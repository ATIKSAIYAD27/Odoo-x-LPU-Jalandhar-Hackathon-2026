from flask import Blueprint, render_template, jsonify
from flask_login import login_required
from app.models import Product, Receipt, DeliveryOrder, InternalTransfer

dashboard_bp = Blueprint("dashboard", __name__)


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

    pending_receipts = Receipt.query.filter(
        Receipt.status.in_(["Draft", "Waiting", "Ready"])
    ).count()
    pending_deliveries = DeliveryOrder.query.filter(
        DeliveryOrder.status.in_(["Draft", "Waiting", "Ready"])
    ).count()
    transfers_scheduled = InternalTransfer.query.count()

    return {
        "total_products": total_products,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "pending_receipts": pending_receipts,
        "pending_deliveries": pending_deliveries,
        "transfers_scheduled": transfers_scheduled,
    }


@dashboard_bp.route("/")
@login_required
def index():
    kpis = compute_kpis()
    return render_template("dashboard.html", kpis=kpis)


@dashboard_bp.route("/api/kpis")
@login_required
def api_kpis():
    kpis = compute_kpis()
    return jsonify(kpis)
