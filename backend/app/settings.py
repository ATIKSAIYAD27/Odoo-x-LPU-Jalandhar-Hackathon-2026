from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required
from app import db
from app.models import Warehouse, Location, Stock, StockLedger, StockAdjustment, Receipt, DeliveryOrder, InternalTransfer

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/settings")
@login_required
def index():
    warehouses = Warehouse.query.order_by(Warehouse.name).all()
    locations = Location.query.order_by(Location.name).all()
    return render_template("settings/index.html", warehouses=warehouses, locations=locations)


@settings_bp.route("/warehouses/add", methods=["POST"])
@login_required
def add_warehouse():
    name = request.form.get("name", "").strip()
    if not name:
        flash("Warehouse name is required.", "danger")
        return redirect(url_for("settings.index"))
    warehouse = Warehouse(name=name)
    db.session.add(warehouse)
    db.session.commit()
    flash(f"Warehouse '{name}' added. Add locations to it below.", "success")
    return redirect(url_for("settings.index"))


@settings_bp.route("/warehouses/delete/<int:id>")
@login_required
def delete_warehouse(id):
    warehouse = Warehouse.query.get_or_404(id)
    if warehouse.locations:
        flash(
            f"Cannot delete '{warehouse.name}': it has {len(warehouse.locations)} location(s). "
            "Delete those locations first.",
            "danger",
        )
        return redirect(url_for("settings.index"))
    name = warehouse.name
    db.session.delete(warehouse)
    db.session.commit()
    flash(f"Warehouse '{name}' deleted.", "info")
    return redirect(url_for("settings.index"))


@settings_bp.route("/locations/add", methods=["POST"])
@login_required
def add_location():
    name = request.form.get("name", "").strip()
    warehouse_id = request.form.get("warehouse_id", "")
    if not name:
        flash("Location name is required.", "danger")
        return redirect(url_for("settings.index"))
    if not warehouse_id:
        flash("Warehouse is required.", "danger")
        return redirect(url_for("settings.index"))
    try:
        warehouse_id = int(warehouse_id)
    except ValueError:
        flash("Invalid warehouse selected.", "danger")
        return redirect(url_for("settings.index"))
    if not Warehouse.query.get(warehouse_id):
        flash("Selected warehouse does not exist.", "danger")
        return redirect(url_for("settings.index"))

    location = Location(name=name, warehouse_id=warehouse_id)
    db.session.add(location)
    db.session.commit()
    flash(f"Location '{name}' added.", "success")
    return redirect(url_for("settings.index"))


@settings_bp.route("/locations/delete/<int:id>")
@login_required
def delete_location(id):
    location = Location.query.get_or_404(id)
    name = location.name

    # Block deletion if the location holds stock or is referenced by documents
    if Stock.query.filter_by(location_id=id).first():
        flash(f"Cannot delete '{name}': it holds stock records.", "danger")
        return redirect(url_for("settings.index"))
    if StockLedger.query.filter_by(location_id=id).first():
        flash(f"Cannot delete '{name}': it has movement history in the stock ledger.", "danger")
        return redirect(url_for("settings.index"))
    if StockAdjustment.query.filter_by(location_id=id).first():
        flash(f"Cannot delete '{name}': it has adjustment records.", "danger")
        return redirect(url_for("settings.index"))
    if Receipt.query.filter_by(destination_location_id=id).first():
        flash(f"Cannot delete '{name}': receipts reference it.", "danger")
        return redirect(url_for("settings.index"))
    if DeliveryOrder.query.filter_by(source_location_id=id).first():
        flash(f"Cannot delete '{name}': delivery orders reference it.", "danger")
        return redirect(url_for("settings.index"))
    if InternalTransfer.query.filter(
        (InternalTransfer.from_location_id == id) | (InternalTransfer.to_location_id == id)
    ).first():
        flash(f"Cannot delete '{name}': transfers reference it.", "danger")
        return redirect(url_for("settings.index"))

    db.session.delete(location)
    db.session.commit()
    flash(f"Location '{name}' deleted.", "info")
    return redirect(url_for("settings.index"))
