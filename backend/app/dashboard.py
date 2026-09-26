from flask import Blueprint, render_template, jsonify, request, url_for
from datetime import datetime
from flask_login import login_required
from app.models import (
    Product, Receipt, DeliveryOrder, InternalTransfer, StockAdjustment,
    Location, Warehouse, Category,
)

dashboard_bp = Blueprint("dashboard", __name__)

RECEIPT_PENDING = ["Draft", "Waiting", "Ready"]
DELIVERY_PENDING = ["Draft", "Waiting", "Ready", "Picking", "Packed"]


def compute_kpis():
    total_products = Product.query.count()
    products = Product.query.all()

    low_stock = 0
    out_of_stock = 0
    for p in products:
        ts = p.total_stock
        if ts <= 0:
            out_of_stock += 1
        elif ts <= p.reorder_level:
            low_stock += 1

    pending_receipts = Receipt.query.filter(Receipt.status.in_(RECEIPT_PENDING)).count()
    pending_deliveries = DeliveryOrder.query.filter(DeliveryOrder.status.in_(DELIVERY_PENDING)).count()
    transfers_scheduled = InternalTransfer.query.count()

    return {
        "total_products": total_products,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "pending_receipts": pending_receipts,
        "pending_deliveries": pending_deliveries,
        "transfers_scheduled": transfers_scheduled,
    }


def _fmt_date(dt):
    if not dt:
        return "—"
    return dt.strftime("%d %b %Y, %H:%M")


def _read_filters():
    """Read dashboard dynamic filters from the query string."""
    def _int(key):
        raw = request.args.get(key, "")
        if not raw:
            return None
        try:
            return int(raw)
        except ValueError:
            return None

    doc_type = request.args.get("doc_type", "")
    if doc_type not in ("Receipt", "Delivery", "Transfer", "Adjustment"):
        doc_type = ""

    status = request.args.get("status", "")
    if status not in ("All", "Pending", "Draft", "Waiting", "Ready", "Picking", "Packed", "Done", "Canceled"):
        status = ""

    return {
        "doc_type": doc_type,
        "status": status,
        "warehouse_id": _int("warehouse_id"),
        "location_id": _int("location_id"),
        "category_id": _int("category_id"),
    }


def _location_matches(location, filters):
    if location is None:
        return False
    if filters["location_id"] and location.id != filters["location_id"]:
        return False
    if filters["warehouse_id"] and location.warehouse_id != filters["warehouse_id"]:
        return False
    return True


def _transfer_matches(transfer, filters):
    if filters["location_id"] and transfer.from_location_id != filters["location_id"] and transfer.to_location_id != filters["location_id"]:
        return False
    if filters["warehouse_id"]:
        from_wh = Location.query.get(transfer.from_location_id)
        to_wh = Location.query.get(transfer.to_location_id)
        wh_ids = {l.warehouse_id for l in (from_wh, to_wh) if l}
        if filters["warehouse_id"] not in wh_ids:
            return False
    if filters["category_id"]:
        product = Product.query.get(transfer.product_id)
        if not product or product.category_id != filters["category_id"]:
            return False
    return True


def _receipt_category_matches(receipt, filters):
    if not filters["category_id"]:
        return True
    for line in receipt.lines:
        product = Product.query.get(line.product_id)
        if product and product.category_id == filters["category_id"]:
            return True
    return False


def _delivery_category_matches(delivery, filters):
    if not filters["category_id"]:
        return True
    for line in delivery.lines:
        product = Product.query.get(line.product_id)
        if product and product.category_id == filters["category_id"]:
            return True
    return False


def _status_matches(status, filters, pending_list):
    wanted = filters["status"]
    if not wanted or wanted == "All":
        return True
    if wanted == "Pending":
        return status in pending_list
    return status == wanted


def build_recent_ops(filters):
    """Build the dashboard operations feed, honoring the dynamic filters."""
    ops = []

    if not filters["doc_type"] or filters["doc_type"] == "Receipt":
        receipts = Receipt.query.order_by(Receipt.created_at.desc()).all()
        for r in receipts:
            if not _status_matches(r.status, filters, RECEIPT_PENDING):
                continue
            if not _location_matches(r.destination_location, filters):
                continue
            if not _receipt_category_matches(r, filters):
                continue
            ops.append({
                "ref": f"REC-{r.id:04d}",
                "type": "Receipt",
                "partner": r.supplier,
                "notes": f"{len(r.lines)} line(s) → {r.destination_location.name if r.destination_location else '—'}",
                "status": r.status,
                "date": _fmt_date(r.created_at),
                "_dt": r.created_at,
                "validate_url": url_for("operations.validate_receipt", id=r.id) if r.status not in ("Done", "Canceled") else None,
            })

    if not filters["doc_type"] or filters["doc_type"] == "Delivery":
        deliveries = DeliveryOrder.query.order_by(DeliveryOrder.created_at.desc()).all()
        for d in deliveries:
            if not _status_matches(d.status, filters, DELIVERY_PENDING):
                continue
            if not _location_matches(d.source_location, filters):
                continue
            if not _delivery_category_matches(d, filters):
                continue
            ops.append({
                "ref": f"DEL-{d.id:04d}",
                "type": "Delivery",
                "partner": d.customer,
                "notes": f"{len(d.lines)} line(s) ← {d.source_location.name if d.source_location else '—'}",
                "status": d.status,
                "date": _fmt_date(d.created_at),
                "_dt": d.created_at,
                "validate_url": url_for("operations.validate_delivery", id=d.id) if d.status not in ("Done", "Canceled") else None,
            })

    if not filters["doc_type"] or filters["doc_type"] == "Transfer":
        if filters["status"] in ("", "All", "Done", "Pending"):
            transfers = InternalTransfer.query.order_by(InternalTransfer.transferred_at.desc()).all()
            for t in transfers:
                if not _transfer_matches(t, filters):
                    continue
                ops.append({
                    "ref": f"TRF-{t.id:04d}",
                    "type": "Transfer",
                    "partner": t.product.name if t.product else f"Product #{t.product_id}",
                    "notes": f"{t.quantity} units: {t.from_location.name if t.from_location else '—'} → {t.to_location.name if t.to_location else '—'}",
                    "status": "Done",
                    "date": _fmt_date(t.transferred_at),
                    "_dt": t.transferred_at,
                    "validate_url": None,
                })

    if not filters["doc_type"] or filters["doc_type"] == "Adjustment":
        if filters["status"] in ("", "All", "Done", "Pending"):
            adjustments = StockAdjustment.query.order_by(StockAdjustment.adjusted_at.desc()).all()
            for a in adjustments:
                if not _location_matches(a.location, filters):
                    continue
                if filters["category_id"]:
                    product = Product.query.get(a.product_id)
                    if not product or product.category_id != filters["category_id"]:
                        continue
                product = Product.query.get(a.product_id)
                ops.append({
                    "ref": f"ADJ-{a.id:04d}",
                    "type": "Adjustment",
                    "partner": product.name if product else f"Product #{a.product_id}",
                    "notes": f"Physical count {a.counted_quantity} (was {a.previous_quantity}, {a.difference:+d})",
                    "status": "Done",
                    "date": _fmt_date(a.adjusted_at),
                    "_dt": a.adjusted_at,
                    "validate_url": None,
                })

    ops.sort(key=lambda o: o["_dt"] or datetime.min, reverse=True)
    return ops[:50]


@dashboard_bp.route("/")
@login_required
def index():
    filters = _read_filters()
    recent_ops = build_recent_ops(filters)

    warehouses = Warehouse.query.order_by(Warehouse.name).all()
    locations = Location.query.order_by(Location.name).all()
    categories = Category.query.order_by(Category.name).all()

    active_filters = {k: v for k, v in filters.items() if v not in (None, "")}
    return render_template(
        "dashboard.html",
        kpis=compute_kpis(),
        recent_ops=recent_ops,
        filters=filters,
        warehouses=warehouses,
        locations=locations,
        categories=categories,
        active_filter_count=len(active_filters),
    )


@dashboard_bp.route("/api/kpis")
@login_required
def api_kpis():
    kpis = compute_kpis()
    return jsonify(kpis)
