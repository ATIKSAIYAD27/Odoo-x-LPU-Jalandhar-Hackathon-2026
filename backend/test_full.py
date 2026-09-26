import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import (
    User, Category, Warehouse, Location, Product, Stock,
    Receipt, DeliveryOrder, InternalTransfer, StockAdjustment, StockLedger,
)

app = create_app()

def check(label, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {label}" + (f" -- {detail}" if detail and not condition else ""))
    if not condition:
        global failures
        failures += 1

failures = 0

with app.app_context():
    db.drop_all()
    db.create_all()
    from app.seed import seed_if_empty
    seed_if_empty()

with app.app_context(), app.test_client() as c:
    # ---------- Seed data ----------
    check("Seed created categories", Category.query.count() >= 5, f"got {Category.query.count()}")
    check("Seed created warehouses", Warehouse.query.count() >= 2, f"got {Warehouse.query.count()}")
    check("Seed created locations", Location.query.count() >= 4, f"got {Location.query.count()}")
    check("Seed created products", Product.query.count() >= 8, f"got {Product.query.count()}")
    check("Seed created stock rows", Stock.query.count() >= 8, f"got {Stock.query.count()}")
    check("Seed created a draft receipt", Receipt.query.filter_by(status="Draft").count() >= 1)
    check("Seed created a ready receipt", Receipt.query.filter_by(status="Ready").count() >= 1)
    check("Seed created a picking delivery", DeliveryOrder.query.filter_by(status="Picking").count() >= 1)
    check("Seed created a transfer", InternalTransfer.query.count() >= 1)
    check("Seed created an adjustment", StockAdjustment.query.count() >= 1)
    check("Seed wrote ledger entries", StockLedger.query.count() >= 8, f"got {StockLedger.query.count()}")

    # ---------- Auth ----------
    r = c.post("/signup", data={"name": "New User", "email": "new@x.com", "password": "pass123", "role": "Inventory Manager"}, follow_redirects=True)
    check("Signup works", b"Account created" in r.data or b"login" in r.data.lower(), r.data[:200])

    r = c.post("/login", data={"email": "new@x.com", "password": "pass123"}, follow_redirects=True)
    check("Login works", b"Dashboard" in r.data or b"Quick Actions" in r.data)

    # Duplicate email
    r = c.post("/signup", data={"name": "Dup", "email": "new@x.com", "password": "pass123"}, follow_redirects=True)
    check("Duplicate email rejected", b"already registered" in r.data)

    # Login wrong password
    c.get("/logout", follow_redirects=True)
    r = c.post("/login", data={"email": "new@x.com", "password": "wrong"}, follow_redirects=True)
    check("Wrong password rejected", b"Invalid email or password" in r.data)

    # OTP flow
    r = c.post("/forgot-password", data={"email": "new@x.com"}, follow_redirects=True)
    check("Forgot password shows OTP", b"OTP for" in r.data)
    otp = __import__("app.models", fromlist=["PasswordResetOTP"]).PasswordResetOTP.query.filter_by(email="new@x.com", used=False).first()
    check("OTP is 6 digits", otp and len(otp.code) == 6, f"code={otp.code if otp else None}")

    r = c.post("/reset-password", data={"email": "new@x.com", "otp": otp.code, "password": "newpass456"}, follow_redirects=True)
    check("Reset password works", b"Password reset successfully" in r.data or b"successfully" in r.data)

    # Reuse OTP should fail
    r = c.post("/reset-password", data={"email": "new@x.com", "otp": otp.code, "password": "another789"}, follow_redirects=True)
    check("Used OTP rejected", b"Invalid OTP" in r.data or b"expired" in r.data or b"valid OTP" in r.data)

    # Login with new password
    c.get("/logout", follow_redirects=True)
    r = c.post("/login", data={"email": "new@x.com", "password": "newpass456"}, follow_redirects=True)
    check("Login after reset works", r.status_code == 200 and (b"Dashboard" in r.data or b"Quick Actions" in r.data))

    # OTP email delivery path (Gmail SMTP stubbed — no network)
    c.get("/logout", follow_redirects=True)
    c.post("/signup", data={"name": "SMTP User", "email": "smtp@x.com", "password": "pass123", "role": "Warehouse Staff"}, follow_redirects=True)
    import app.auth as auth_mod
    orig_send = auth_mod.send_otp_email
    sent = {}
    def _fake_send(to, code):
        sent["to"], sent["code"] = to, code
        return True
    auth_mod.send_otp_email = _fake_send
    r = c.post("/forgot-password", data={"email": "smtp@x.com"}, follow_redirects=True)
    check("OTP handed to SMTP sender", sent.get("to") == "smtp@x.com", f"got {sent}")
    check("OTP-sent confirmation shown", b"OTP sent to" in r.data, r.data[:200])
    check("Emailed OTP hidden from page", bool(sent.get("code")) and sent["code"].encode() not in r.data)
    r = c.post("/reset-password", data={"email": "smtp@x.com", "otp": sent.get("code", ""), "password": "smtp456"}, follow_redirects=True)
    check("Reset with emailed OTP works", b"Password reset successfully" in r.data)
    r = c.post("/login", data={"email": "smtp@x.com", "password": "smtp456"}, follow_redirects=True)
    check("Login after emailed-OTP reset works", b"Dashboard" in r.data or b"Quick Actions" in r.data)
    auth_mod.send_otp_email = orig_send

    # ---------- Dashboard ----------
    r = c.get("/")
    check("Dashboard renders", r.status_code == 200)
    r = c.get("/api/kpis")
    kpis = r.get_json()
    check("API /api/kpis returns JSON", r.status_code == 200 and "total_products" in kpis)
    check("KPI total_products matches DB", kpis["total_products"] == Product.query.count())
    check("KPI out_of_stock counted", kpis["out_of_stock"] >= 1, f"got {kpis['out_of_stock']}")
    check("KPI low_stock counted", kpis["low_stock"] >= 1, f"got {kpis['low_stock']}")
    check("KPI pending_receipts counted", kpis["pending_receipts"] >= 2, f"got {kpis['pending_receipts']}")
    check("KPI pending_deliveries counted", kpis["pending_deliveries"] >= 2, f"got {kpis['pending_deliveries']}")
    check("KPI transfers counted", kpis["transfers_scheduled"] >= 1, f"got {kpis['transfers_scheduled']}")

    # ---------- Dashboard dynamic filters ----------
    r = c.get("/?doc_type=Receipt")
    check("Dashboard doc-type filter (Receipts)", r.status_code == 200 and b"REC-" in r.data)
    r = c.get("/?doc_type=Delivery")
    check("Dashboard doc-type filter (Deliveries)", r.status_code == 200 and b"DEL-" in r.data)
    r = c.get("/?doc_type=Transfer")
    check("Dashboard doc-type filter (Transfers)", r.status_code == 200 and b"TRF-" in r.data)
    r = c.get("/?doc_type=Adjustment")
    check("Dashboard doc-type filter (Adjustments)", r.status_code == 200 and b"ADJ-" in r.data)
    r = c.get("/?status=Pending")
    check("Dashboard status filter (Pending)", r.status_code == 200 and b"REC-" in r.data and b"DEL-" in r.data)
    r = c.get("/?status=Done")
    check("Dashboard status filter (Done)", r.status_code == 200 and b"TRF-" in r.data)
    wh1 = Warehouse.query.first()
    r = c.get(f"/?warehouse_id={wh1.id}")
    check("Dashboard warehouse filter renders", r.status_code == 200)
    loc1 = Location.query.first()
    r = c.get(f"/?location_id={loc1.id}")
    check("Dashboard location filter renders", r.status_code == 200)
    cat1 = Category.query.first()
    r = c.get(f"/?category_id={cat1.id}")
    check("Dashboard category filter renders", r.status_code == 200)
    r = c.get("/?doc_type=Receipt&status=Done")
    check("Dashboard combined filters render", r.status_code == 200)
    r = c.get("/?warehouse_id=notanumber")
    check("Dashboard invalid filter value handled", r.status_code == 200)

    # ---------- Categories (Inventory Manager required) ----------
    c.get("/logout", follow_redirects=True)
    c.post("/login", data={"email": "manager@stocksense.io", "password": "manager123"})
    r = c.get("/categories")
    check("Category list renders", r.status_code == 200 and b"Categories" in r.data)
    r = c.post("/categories/add", data={"name": "Test Cat"}, follow_redirects=True)
    check("Add category works", b"added" in r.data)
    tc = Category.query.filter_by(name="Test Cat").first()
    check("Category created in DB", tc is not None)
    r = c.post("/categories/add", data={"name": "test cat"}, follow_redirects=True)
    check("Duplicate category rejected", b"already exists" in r.data)
    r = c.post(f"/categories/edit/{tc.id}", data={"name": "Renamed Cat"}, follow_redirects=True)
    check("Rename category works", b"Renamed" in r.data)
    rc = Category.query.get(tc.id)
    check("Category renamed in DB", rc.name == "Renamed Cat")
    # Delete category with no products
    r = c.get(f"/categories/delete/{tc.id}", follow_redirects=True)
    check("Delete empty category works", Category.query.filter_by(name="Renamed Cat").first() is None)
    # Delete category with products should be blocked
    cat_with_products = Category.query.filter(Category.products.any()).first()
    r = c.get(f"/categories/delete/{cat_with_products.id}", follow_redirects=True)
    check("Delete category with products blocked", b"Cannot delete" in r.data)

    # ---------- Products ----------
    r = c.get("/products")
    check("Product list renders", r.status_code == 200 and b"Wireless Mouse" in r.data)
    r = c.get("/products?search=mouse")
    check("Product search works", b"Wireless Mouse" in r.data and b"Standing Desk" not in r.data)
    r = c.get("/products?stock_status=out")
    check("Product out-of-stock filter works", b"Standing Desk" in r.data and b"Wireless Mouse" not in r.data)
    r = c.get("/products?stock_status=low")
    check("Product low-stock filter works", b"USB-C" in r.data)

    # Add product
    cat = Category.query.first()
    r = c.post("/products/add", data={"name": "Test Widget", "sku": "TW-999", "category_id": str(cat.id), "uom": "pcs", "reorder_level": "5"}, follow_redirects=True)
    check("Add product works", b"added successfully" in r.data)
    tw = Product.query.filter_by(sku="TW-999").first()
    check("Product in DB", tw is not None)

    # Add product with initial stock booked into a location
    init_loc = Location.query.first()
    r = c.post("/products/add", data={
        "name": "Opening Stock Item", "sku": "OS-777", "category_id": str(cat.id),
        "uom": "pcs", "reorder_level": "2", "initial_stock": "15",
        "location_id": str(init_loc.id),
    }, follow_redirects=True)
    check("Add product with initial stock works", b"added successfully" in r.data)
    os_prod = Product.query.filter_by(sku="OS-777").first()
    os_stock = Stock.query.filter_by(product_id=os_prod.id, location_id=init_loc.id).first() if os_prod else None
    check("Initial stock row created", os_stock is not None and os_stock.quantity == 15,
          f"got {os_stock.quantity if os_stock else None}")
    check("Initial stock ledger entry written", StockLedger.query.filter_by(reason="Initial Stock").count() == 1)
    r = c.get("/move-history?reason=Initial%20Stock")
    check("Move history shows initial stock", r.status_code == 200 and b"Opening Stock Item" in r.data)

    # Initial stock > 0 without a location must be rejected
    r = c.post("/products/add", data={
        "name": "No Loc Item", "sku": "NL-778", "category_id": str(cat.id),
        "uom": "pcs", "reorder_level": "2", "initial_stock": "5",
    }, follow_redirects=True)
    check("Initial stock without location rejected", b"stock location is required" in r.data)
    check("Rejected product not created", Product.query.filter_by(sku="NL-778").first() is None)

    # Duplicate SKU
    r = c.post("/products/add", data={"name": "Another", "sku": "TW-999", "category_id": str(cat.id)}, follow_redirects=True)
    check("Duplicate SKU rejected", b"already used" in r.data)

    # Missing fields
    r = c.post("/products/add", data={"name": "", "sku": "", "category_id": ""}, follow_redirects=True)
    check("Empty product rejected with flash", b"required" in r.data)

    # Edit product duplicate SKU check
    other = Product.query.filter(Product.sku != "TW-999").first()
    r = c.post(f"/products/edit/{tw.id}", data={"name": "Test Widget 2", "sku": other.sku, "category_id": str(cat.id), "reorder_level": "5"}, follow_redirects=True)
    check("Edit duplicate SKU rejected", b"already used" in r.data)
    r = c.post(f"/products/edit/{tw.id}", data={"name": "Test Widget Renamed", "sku": "TW-999", "category_id": str(cat.id), "reorder_level": "7"}, follow_redirects=True)
    check("Edit product works", b"updated" in r.data)

    # Product detail
    r = c.get(f"/products/{tw.id}")
    check("Product detail renders", r.status_code == 200 and b"Test Widget Renamed" in r.data)

    # Delete product with no references
    r = c.get(f"/products/delete/{tw.id}", follow_redirects=True)
    check("Delete unreferenced product works", Product.query.filter_by(sku="TW-999").first() is None)

    # Delete product with references blocked
    ref_prod = Product.query.filter(StockLedger.query.filter(StockLedger.product_id == Product.id).exists()).first()
    r = c.get(f"/products/delete/{ref_prod.id}", follow_redirects=True)
    check("Delete referenced product blocked", b"Cannot delete" in r.data)

    # ---------- Role-based access (Warehouse Staff restrictions) ----------
    c.get("/logout", follow_redirects=True)
    r = c.post("/login", data={"email": "staff@stocksense.io", "password": "staff123"}, follow_redirects=True)
    check("Staff login works", b"Dashboard" in r.data or b"Quick Actions" in r.data, r.data[:200])
    r = c.get("/products/add", follow_redirects=True)
    check("Staff blocked from creating product", b"Inventory Manager" in r.data)
    r = c.post("/categories/add", data={"name": "Staff Cat"}, follow_redirects=True)
    check("Staff blocked from creating category", b"Inventory Manager" in r.data)
    check("Staff category not created", Category.query.filter_by(name="Staff Cat").first() is None)
    r = c.post("/warehouses/add", data={"name": "Staff WH"}, follow_redirects=True)
    check("Staff blocked from adding warehouse", b"Inventory Manager" in r.data)
    check("Staff warehouse not created", Warehouse.query.filter_by(name="Staff WH").first() is None)
    r = c.get("/products")
    check("Staff can still view products", r.status_code == 200 and b"Wireless Mouse" in r.data)
    c.get("/logout", follow_redirects=True)
    c.post("/login", data={"email": "new@x.com", "password": "newpass456"})

    # ---------- Receipts ----------
    r = c.get("/receipts")
    check("Receipt list renders", r.status_code == 200 and b"Acme Electronics" in r.data)
    check("Receipt shows destination location", b"Shelf A1" in r.data)

    r = c.get("/receipts?status=Pending")
    check("Receipt pending filter works", b"Acme" in r.data)
    r = c.get("/receipts?status=Done")
    check("Receipt done filter works", r.status_code == 200)

    # Add receipt with invalid line (qty=0)
    loc = Location.query.first()
    prod = Product.query.first()
    r = c.post("/receipts/add", data={
        "supplier": "Bad Supplier", "destination_location_id": str(loc.id),
        "product_id": str(prod.id), "quantity": "0",
    }, follow_redirects=True)
    check("Receipt line qty<=0 rejected", b"greater than 0" in r.data)
    check("Bad receipt not created", Receipt.query.filter_by(supplier="Bad Supplier").first() is None)

    # Add receipt with no lines
    r = c.post("/receipts/add", data={
        "supplier": "NoLines Co", "destination_location_id": str(loc.id),
        "product_id": "", "quantity": "",
    }, follow_redirects=True)
    check("Receipt with no lines rejected", b"line item" in r.data)

    # Add valid receipt
    r = c.post("/receipts/add", data={
        "supplier": "Good Supplier", "destination_location_id": str(loc.id),
        "product_id": str(prod.id), "quantity": "25",
    }, follow_redirects=True)
    check("Add valid receipt works", b"created as Draft" in r.data)
    good_r = Receipt.query.filter_by(supplier="Good Supplier").first()
    check("Receipt has 1 line", good_r and len(good_r.lines) == 1)

    # Validate receipt
    stock_before = Stock.query.filter_by(product_id=prod.id, location_id=loc.id).first()
    before_qty = stock_before.quantity if stock_before else 0
    ledger_before = StockLedger.query.filter_by(reason="Receipt").count()
    r = c.get(f"/receipts/validate/{good_r.id}", follow_redirects=True)
    check("Validate receipt works", b"validated" in r.data)
    check("Receipt status now Done", good_r.status == "Done")
    stock_after = Stock.query.filter_by(product_id=prod.id, location_id=loc.id).first()
    check("Stock increased after receipt", stock_after.quantity == before_qty + 25, f"{before_qty} -> {stock_after.quantity}")
    check("Ledger entry written for receipt", StockLedger.query.filter_by(reason="Receipt").count() == ledger_before + 1)

    # Re-validate should be blocked
    r = c.get(f"/receipts/validate/{good_r.id}", follow_redirects=True)
    check("Re-validate receipt blocked", b"already validated" in r.data)

    # ---------- Deliveries ----------
    r = c.get("/deliveries")
    check("Delivery list renders", r.status_code == 200 and b"TechCorp" in r.data)
    check("Delivery shows source location", b"Shelf B2" in r.data)

    r = c.get("/deliveries?status=Pending")
    check("Delivery pending filter works", b"TechCorp" in r.data)

    # Add delivery with invalid line (qty=-1)
    r = c.post("/deliveries/add", data={
        "customer": "Bad Cust", "source_location_id": str(loc.id),
        "product_id": str(prod.id), "quantity": "-1",
    }, follow_redirects=True)
    check("Delivery line qty<=0 rejected", b"greater than 0" in r.data)

    # Add valid delivery
    r = c.post("/deliveries/add", data={
        "customer": "Good Cust", "source_location_id": str(loc.id),
        "product_id": str(prod.id), "quantity": "5",
    }, follow_redirects=True)
    check("Add valid delivery works", b"created as Draft" in r.data)
    good_d = DeliveryOrder.query.filter_by(customer="Good Cust").first()
    check("Delivery has 1 line", good_d and len(good_d.lines) == 1)

    # Validate delivery — must be picked and packed first (Pick -> Pack -> Validate)
    r = c.get(f"/deliveries/validate/{good_d.id}", follow_redirects=True)
    check("Validating unpacked delivery blocked", b"must be picked and packed" in r.data, r.data[:300])
    r = c.post(f"/deliveries/status/{good_d.id}", data={"status": "Picking"}, follow_redirects=True)
    check("Delivery -> Picking works", good_d.status == "Picking")
    r = c.post(f"/deliveries/status/{good_d.id}", data={"status": "Packed"}, follow_redirects=True)
    check("Delivery -> Packed works", good_d.status == "Packed")

    stock_before = Stock.query.filter_by(product_id=prod.id, location_id=loc.id).first()
    before_qty = stock_before.quantity
    r = c.get(f"/deliveries/validate/{good_d.id}", follow_redirects=True)
    check("Validate delivery works", b"validated" in r.data)
    stock_after = Stock.query.filter_by(product_id=prod.id, location_id=loc.id).first()
    check("Stock decreased after delivery", stock_after.quantity == before_qty - 5, f"{before_qty} -> {stock_after.quantity}")

    # Re-validate blocked
    r = c.get(f"/deliveries/validate/{good_d.id}", follow_redirects=True)
    check("Re-validate delivery blocked", b"already validated" in r.data)

    # Delivery with insufficient stock
    # Find a product/location with 0 or low stock
    out_prod = Product.query.filter(Product.name == "Standing Desk").first()
    if out_prod:
        out_stock = Stock.query.filter_by(product_id=out_prod.id).first()
        out_loc_id = out_stock.location_id if out_stock else loc.id
        r = c.post("/deliveries/add", data={
            "customer": "TooMuch", "source_location_id": str(out_loc_id),
            "product_id": str(out_prod.id), "quantity": "9999",
        }, follow_redirects=True)
        bad_d = DeliveryOrder.query.filter_by(customer="TooMuch").first()
        if bad_d:
            c.post(f"/deliveries/status/{bad_d.id}", data={"status": "Picking"}, follow_redirects=True)
            c.post(f"/deliveries/status/{bad_d.id}", data={"status": "Packed"}, follow_redirects=True)
            r = c.get(f"/deliveries/validate/{bad_d.id}", follow_redirects=True)
            check("Insufficient stock delivery rejected", b"insufficient stock" in r.data, r.data[:500])
            check("Stock not deducted on failed validation", bad_d.status != "Done")
        else:
            check("Insufficient stock delivery rejected", False, "delivery not created")

    # ---------- Status transitions ----------
    r = c.post(f"/receipts/status/{good_r.id}", data={"status": "Waiting"}, follow_redirects=True)
    check("Cannot change status of Done receipt", b"cannot be changed" in r.data)

    # Find a Draft receipt and change status
    draft_r = Receipt.query.filter_by(status="Draft").first()
    if draft_r:
        r = c.post(f"/receipts/status/{draft_r.id}", data={"status": "Ready"}, follow_redirects=True)
        check("Draft receipt -> Ready works", draft_r.status == "Ready")
        r = c.post(f"/receipts/status/{draft_r.id}", data={"status": "Bogus"}, follow_redirects=True)
        check("Invalid status rejected", b"Invalid status" in r.data)

    draft_d = DeliveryOrder.query.filter_by(status="Draft").first()
    if draft_d:
        r = c.post(f"/deliveries/status/{draft_d.id}", data={"status": "Packed"}, follow_redirects=True)
        check("Draft delivery -> Packed works", draft_d.status == "Packed")
        r = c.post(f"/deliveries/status/{draft_d.id}", data={"status": "Bogus"}, follow_redirects=True)
        check("Invalid delivery status rejected", b"Invalid status" in r.data)

    # Cancel a Draft receipt
    draft_r2 = Receipt.query.filter_by(status="Draft").first()
    if draft_r2:
        rid = draft_r2.id
        r = c.get(f"/receipts/cancel/{rid}", follow_redirects=True)
        check("Cancel receipt works", Receipt.query.get(rid).status == "Canceled")

    # ---------- Transfers ----------
    r = c.get("/transfers")
    check("Transfer page renders", r.status_code == 200 and b"New Transfer" in r.data)

    # Same location
    l1 = Location.query.first()
    p1 = Product.query.filter(Stock.query.filter(Stock.product_id == Product.id, Stock.quantity > 10).exists()).first()
    r = c.post("/transfers", data={
        "product_id": str(p1.id), "from_location_id": str(l1.id),
        "to_location_id": str(l1.id), "quantity": "1",
    }, follow_redirects=True)
    check("Same location transfer rejected", b"must be different" in r.data)

    # Insufficient stock
    l_ids = [l.id for l in Location.query.all()]
    r = c.post("/transfers", data={
        "product_id": str(p1.id), "from_location_id": str(l_ids[0]),
        "to_location_id": str(l_ids[-1]), "quantity": "99999",
    }, follow_redirects=True)
    check("Insufficient stock transfer rejected", b"Insufficient stock" in r.data)

    # qty <= 0
    r = c.post("/transfers", data={
        "product_id": str(p1.id), "from_location_id": str(l_ids[0]),
        "to_location_id": str(l_ids[-1]), "quantity": "0",
    }, follow_redirects=True)
    check("Transfer qty<=0 rejected", b"greater than 0" in r.data)

    # Valid transfer
    s1 = Stock.query.filter(Stock.quantity > 10).first()
    if s1:
        # find another location
        other_loc = Location.query.filter(Location.id != s1.location_id).first()
        if other_loc:
            ledger_before = StockLedger.query.count()
            qty_before_src = s1.quantity
            r = c.post("/transfers", data={
                "product_id": str(s1.product_id), "from_location_id": str(s1.location_id),
                "to_location_id": str(other_loc.id), "quantity": "3",
            }, follow_redirects=True)
            check("Valid transfer works", b"completed" in r.data)
            s1_after = Stock.query.filter_by(product_id=s1.product_id, location_id=s1.location_id).first()
            check("Source stock decreased", s1_after.quantity == qty_before_src - 3, f"{qty_before_src} -> {s1_after.quantity}")
            check("Two ledger entries written", StockLedger.query.count() == ledger_before + 2, f"before={ledger_before} after={StockLedger.query.count()}")

    # ---------- Adjustments ----------
    r = c.get("/adjustments")
    check("Adjustment page renders", r.status_code == 200 and b"Stock Adjustment" in r.data)

    # Negative count
    r = c.post("/adjustments", data={
        "product_id": str(prod.id), "location_id": str(loc.id), "counted_quantity": "-5",
    }, follow_redirects=True)
    check("Negative count rejected", b"cannot be negative" in r.data)

    # Valid adjustment
    s_adj = Stock.query.filter(Stock.quantity > 0).first()
    if s_adj:
        counted = s_adj.quantity + 7
        r = c.post("/adjustments", data={
            "product_id": str(s_adj.product_id), "location_id": str(s_adj.location_id),
            "counted_quantity": str(counted),
        }, follow_redirects=True)
        check("Valid adjustment works", b"Adjustment recorded" in r.data)
        s_adj_after = Stock.query.filter_by(product_id=s_adj.product_id, location_id=s_adj.location_id).first()
        check("Stock set to counted value", s_adj_after.quantity == counted, f"expected {counted} got {s_adj_after.quantity}")
        adj = StockAdjustment.query.order_by(StockAdjustment.id.desc()).first()
        check("Adjustment previous_quantity stored", adj.previous_quantity is not None)
        check("Adjustment difference computed", adj.difference == counted - adj.previous_quantity, f"diff={adj.difference}")

    # ---------- Move History ----------
    r = c.get("/move-history")
    check("Move history renders", r.status_code == 200 and b"Move History" in r.data)
    r = c.get("/move-history?reason=Receipt")
    check("Move history reason filter works", r.status_code == 200)
    r = c.get("/move-history?reason=Transfer-out")
    check("Move history transfer filter works", r.status_code == 200)

    # ---------- Settings (Inventory Manager required) ----------
    c.get("/logout", follow_redirects=True)
    c.post("/login", data={"email": "manager@stocksense.io", "password": "manager123"})
    r = c.get("/settings")
    check("Settings renders", r.status_code == 200 and b"Warehouses" in r.data)
    r = c.post("/warehouses/add", data={"name": "Test WH"}, follow_redirects=True)
    check("Add warehouse works", b"added" in r.data)
    test_wh = Warehouse.query.filter_by(name="Test WH").first()
    r = c.post("/locations/add", data={"name": "Test Loc", "warehouse_id": str(test_wh.id)}, follow_redirects=True)
    check("Add location works", b"added" in r.data)

    # Delete location with stock blocked
    loc_with_stock = Location.query.join(Stock, Stock.location_id == Location.id).first()
    r = c.get(f"/locations/delete/{loc_with_stock.id}", follow_redirects=True)
    check("Delete location with stock blocked", b"Cannot delete" in r.data)

    # Delete empty location works
    empty_loc = Location.query.filter(~Location.query.filter(Location.id == Location.id).exists()).first()
    # find a location with no stock/ledger/receipts/deliveries/transfers
    for loc_cand in Location.query.all():
        if (Stock.query.filter_by(location_id=loc_cand.id).first() is None and
            StockLedger.query.filter_by(location_id=loc_cand.id).first() is None and
            StockAdjustment.query.filter_by(location_id=loc_cand.id).first() is None and
            Receipt.query.filter_by(destination_location_id=loc_cand.id).first() is None and
            DeliveryOrder.query.filter_by(source_location_id=loc_cand.id).first() is None and
            InternalTransfer.query.filter((InternalTransfer.from_location_id == loc_cand.id) | (InternalTransfer.to_location_id == loc_cand.id)).first() is None):
            empty_loc = loc_cand
            break
    if empty_loc:
        r = c.get(f"/locations/delete/{empty_loc.id}", follow_redirects=True)
        check("Delete empty location works", Location.query.get(empty_loc.id) is None)

    # Delete warehouse with locations blocked
    r = c.get(f"/warehouses/delete/{wh_main.id if (wh_main:=Warehouse.query.first()) else 1}", follow_redirects=True)
    check("Delete warehouse with locations blocked", b"Cannot delete" in r.data)

    # ---------- Profile ----------
    c.get("/logout", follow_redirects=True)
    c.post("/login", data={"email": "new@x.com", "password": "newpass456"})
    r = c.get("/profile")
    check("Profile renders", r.status_code == 200 and b"Profile" in r.data)
    r = c.post("/profile/edit", data={"name": "Renamed User"}, follow_redirects=True)
    check("Edit profile works", b"Renamed User" in r.data)
    # Wrong current password
    r = c.post("/profile/change-password", data={
        "current_password": "wrong", "new_password": "abc12345", "confirm_password": "abc12345",
    }, follow_redirects=True)
    check("Wrong current password rejected", b"incorrect" in r.data)
    # Mismatched passwords
    r = c.post("/profile/change-password", data={
        "current_password": "newpass456", "new_password": "abc12345", "confirm_password": "xyz99999",
    }, follow_redirects=True)
    check("Mismatched new passwords rejected", b"do not match" in r.data)
    # Correct password change
    r = c.post("/profile/change-password", data={
        "current_password": "newpass456", "new_password": "finalpass789", "confirm_password": "finalpass789",
    }, follow_redirects=True)
    check("Password change works", b"successfully" in r.data)
    c.get("/logout", follow_redirects=True)
    r = c.post("/login", data={"email": "new@x.com", "password": "finalpass789"}, follow_redirects=True)
    check("Login with new password works", r.status_code == 200)

    # ---------- Auth required ----------
    c.get("/logout", follow_redirects=True)
    r = c.get("/", follow_redirects=False)
    check("Unauthenticated / redirects to login", r.status_code in (302, 401))
    r = c.get("/products", follow_redirects=False)
    check("Unauthenticated /products redirects", r.status_code in (302, 401))
    r = c.get("/api/kpis", follow_redirects=False)
    check("Unauthenticated /api/kpis redirects", r.status_code in (302, 401))

    # ---------- Navigation links present ----------
    c.post("/login", data={"email": "new@x.com", "password": "finalpass789"})
    r = c.get("/")
    nav_checks = [
        (b"/products", "Products link"),
        (b"/categories", "Categories link"),
        (b"/receipts", "Receipts link"),
        (b"/deliveries", "Deliveries link"),
        (b"/transfers", "Transfers link"),
        (b"/adjustments", "Adjustments link"),
        (b"/move-history", "Move History link"),
        (b"/settings", "Settings link"),
        (b"/profile", "Profile link"),
    ]
    for needle, label in nav_checks:
        check(f"Navbar has {label}", needle in r.data)

print()
if failures:
    print(f"RESULT: {failures} FAILURES")
    sys.exit(1)
else:
    print("RESULT: ALL TESTS PASSED")
