"""Seed the database with demo data on first run so the app is immediately usable."""
from werkzeug.security import generate_password_hash
from app import db
from app.models import (
    User, Category, Warehouse, Location, Product, Stock,
    StockLedger, Receipt, ReceiptLine, DeliveryOrder, DeliveryLine,
    InternalTransfer, StockAdjustment,
)


def seed_if_empty():
    """Populate the database with demo data only if it has no categories.
    Safe to call on every startup — it does nothing once data exists."""
    if Category.query.first() is not None:
        return False

    # --- Users -----------------------------------------------------------
    manager = User(
        name="Alex Manager",
        email="manager@stocksense.io",
        password_hash=generate_password_hash("admin123"),
        role="Inventory Manager",
    )
    staff = User(
        name="Sam Staff",
        email="staff@stocksense.io",
        password_hash=generate_password_hash("staff123"),
        role="Warehouse Staff",
    )
    db.session.add_all([manager, staff])
    db.session.flush()

    # --- Categories ------------------------------------------------------
    cat_electronics = Category(name="Electronics")
    cat_furniture = Category(name="Furniture")
    cat_hardware = Category(name="Hardware & Fasteners")
    cat_packaging = Category(name="Packaging Materials")
    cat_raw = Category(name="Raw Materials")
    db.session.add_all([cat_electronics, cat_furniture, cat_hardware, cat_packaging, cat_raw])
    db.session.flush()

    # --- Warehouses & Locations -----------------------------------------
    wh_main = Warehouse(name="Main Warehouse")
    wh_north = Warehouse(name="North Regional Depot")
    db.session.add_all([wh_main, wh_north])
    db.session.flush()

    loc_main_a = Location(name="Shelf A1 (Receiving)", warehouse_id=wh_main.id)
    loc_main_b = Location(name="Shelf B2 (Storage)", warehouse_id=wh_main.id)
    loc_main_c = Location(name="Dispatch Bay", warehouse_id=wh_main.id)
    loc_north_a = Location(name="North Hub Staging", warehouse_id=wh_north.id)
    db.session.add_all([loc_main_a, loc_main_b, loc_main_c, loc_north_a])
    db.session.flush()

    # --- Products --------------------------------------------------------
    products = [
        Product(name="Wireless Mouse", sku="WM-001", category_id=cat_electronics.id, uom="pcs", reorder_level=20),
        Product(name="USB-C Cable 1m", sku="UC-002", category_id=cat_electronics.id, uom="pcs", reorder_level=50),
        Product(name="Office Chair", sku="OC-003", category_id=cat_furniture.id, uom="pcs", reorder_level=5),
        Product(name="Standing Desk", sku="SD-004", category_id=cat_furniture.id, uom="pcs", reorder_level=3),
        Product(name="Hex Bolt M6", sku="HB-005", category_id=cat_hardware.id, uom="pcs", reorder_level=200),
        Product(name="Corrugated Box L", sku="CB-006", category_id=cat_packaging.id, uom="pcs", reorder_level=50),
        Product(name="Steel Rod 12mm", sku="SR-007", category_id=cat_raw.id, uom="kg", reorder_level=100),
        Product(name="Aluminium Sheet", sku="AS-008", category_id=cat_raw.id, uom="sheet", reorder_level=30),
    ]
    db.session.add_all(products)
    db.session.flush()

    # --- Stock (initial quantities at locations) -------------------------
    stock_rows = [
        (products[0], loc_main_b, 45),   # Mouse — above reorder (20)
        (products[1], loc_main_b, 30),   # USB-C — below reorder (50) → LOW
        (products[2], loc_main_b, 8),    # Chair — above reorder (5)
        (products[3], loc_main_b, 0),    # Desk — 0 → OUT OF STOCK
        (products[4], loc_main_b, 500),  # Bolt — above reorder (200)
        (products[5], loc_main_c, 40),   # Box — below reorder (50) → LOW
        (products[6], loc_main_a, 250),  # Steel — above reorder (100)
        (products[7], loc_north_a, 20),  # Alu — below reorder (30) → LOW
    ]
    for p, loc, qty in stock_rows:
        stock = Stock(product_id=p.id, location_id=loc.id, quantity=qty)
        db.session.add(stock)
        ledger = StockLedger(
            product_id=p.id, location_id=loc.id, change=qty,
            reason="Receipt", reference="Initial Setup",
        )
        db.session.add(ledger)
    db.session.flush()

    # --- Sample Receipt (Draft — pending) --------------------------------
    r1 = Receipt(supplier="Acme Electronics Ltd", destination_location_id=loc_main_a.id, status="Draft", created_by=manager.id)
    db.session.add(r1)
    db.session.flush()
    db.session.add(ReceiptLine(receipt_id=r1.id, product_id=products[0].id, quantity=50))
    db.session.add(ReceiptLine(receipt_id=r1.id, product_id=products[1].id, quantity=100))

    # --- Sample Receipt (Ready — pending) --------------------------------
    r2 = Receipt(supplier="Global Steel Co", destination_location_id=loc_main_a.id, status="Ready", created_by=manager.id)
    db.session.add(r2)
    db.session.flush()
    db.session.add(ReceiptLine(receipt_id=r2.id, product_id=products[6].id, quantity=200))

    # --- Sample Delivery (Picking — pending) -----------------------------
    d1 = DeliveryOrder(customer="TechCorp Inc", source_location_id=loc_main_b.id, status="Picking", created_by=staff.id)
    db.session.add(d1)
    db.session.flush()
    db.session.add(DeliveryLine(delivery_id=d1.id, product_id=products[0].id, quantity=10))
    db.session.add(DeliveryLine(delivery_id=d1.id, product_id=products[1].id, quantity=25))

    # --- Sample Delivery (Draft — pending) -------------------------------
    d2 = DeliveryOrder(customer="Retail Mart", source_location_id=loc_main_c.id, status="Draft", created_by=staff.id)
    db.session.add(d2)
    db.session.flush()
    db.session.add(DeliveryLine(delivery_id=d2.id, product_id=products[5].id, quantity=30))

    # --- Sample Transfer (already applied) -------------------------------
    # Move 40 steel rods from Receiving to Storage
    t1 = InternalTransfer(product_id=products[6].id, from_location_id=loc_main_a.id, to_location_id=loc_main_b.id, quantity=40)
    db.session.add(t1)
    db.session.flush()
    # Apply stock changes for the transfer
    s_from = Stock.query.filter_by(product_id=products[6].id, location_id=loc_main_a.id).first()
    s_to = Stock.query.filter_by(product_id=products[6].id, location_id=loc_main_b.id).first()
    if s_from and s_from.quantity >= 40:
        s_from.quantity -= 40
    if s_to:
        s_to.quantity += 40
    else:
        s_to = Stock(product_id=products[6].id, location_id=loc_main_b.id, quantity=40)
        db.session.add(s_to)
    db.session.add(StockLedger(
        product_id=products[6].id, location_id=loc_main_a.id, change=-40,
        reason="Transfer-out", reference=f"Transfer #{t1.id}",
    ))
    db.session.add(StockLedger(
        product_id=products[6].id, location_id=loc_main_b.id, change=40,
        reason="Transfer-in", reference=f"Transfer #{t1.id}",
    ))

    # --- Sample Adjustment (already applied) -----------------------------
    # Chair count was 10 on paper, physically counted 8 (2 damaged)
    adj = StockAdjustment(
        product_id=products[2].id, location_id=loc_main_b.id,
        counted_quantity=8, previous_quantity=10,
    )
    db.session.add(adj)
    db.session.flush()
    s_chair = Stock.query.filter_by(product_id=products[2].id, location_id=loc_main_b.id).first()
    if s_chair:
        s_chair.quantity = 8
    db.session.add(StockLedger(
        product_id=products[2].id, location_id=loc_main_b.id, change=-2,
        reason="Adjustment", reference=f"Adjustment #{adj.id}",
    ))

    db.session.commit()
    return True
