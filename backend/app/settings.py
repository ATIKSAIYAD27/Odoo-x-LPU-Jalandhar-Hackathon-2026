from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required
from app import db
from app.models import Warehouse, Location

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/settings")
@login_required
def index():
    warehouses = Warehouse.query.all()
    locations = Location.query.all()
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
    flash(f"Warehouse '{name}' added.", "success")
    return redirect(url_for("settings.index"))


@settings_bp.route("/warehouses/delete/<int:id>")
@login_required
def delete_warehouse(id):
    warehouse = Warehouse.query.get_or_404(id)
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
    if not name or not warehouse_id:
        flash("Location name and warehouse are required.", "danger")
        return redirect(url_for("settings.index"))
    location = Location(name=name, warehouse_id=int(warehouse_id))
    db.session.add(location)
    db.session.commit()
    flash(f"Location '{name}' added.", "success")
    return redirect(url_for("settings.index"))


@settings_bp.route("/locations/delete/<int:id>")
@login_required
def delete_location(id):
    location = Location.query.get_or_404(id)
    name = location.name
    db.session.delete(location)
    db.session.commit()
    flash(f"Location '{name}' deleted.", "info")
    return redirect(url_for("settings.index"))
