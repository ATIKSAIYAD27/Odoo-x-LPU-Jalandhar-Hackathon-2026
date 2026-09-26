from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from app import db
from app.models import Product, Location, Receipt, ReceiptLine, DeliveryOrder, DeliveryLine, InternalTransfer, StockAdjustment, Stock, StockLedger
from app.utils import get_or_create_stock, log_ledger, apply_stock_change

operations_bp = Blueprint("operations", __name__)


def _parse_line_items(form):
    """Parse and validate product/quantity line items from a form.
    Returns (lines, error_message). Lines are [(product_id, quantity), ...]."""
    product_ids = form.getlist("product_id")
    quantities = form.getlist("quantity")
    lines = []
    for pid, qty in zip(product_ids, quantities):
        if not pid or not pid.strip():
            continue
        try:
            q = int(qty)
        except (ValueError, TypeError):
            return [], f"Line quantity '{qty}' is not a valid number."
        if q <= 0:
            return [], f"Line quantity must be greater than 0 (got {q})."
        try:
            p = int(pid)
        except (ValueError, TypeError):
            return [], f"Invalid product selection."
        lines.append((p, q))
    if not lines:
        return [], "At least one line item with a product and quantity is required."
    return lines, None


@operations_bp.route("/receipts")
@login_required
def receipts():
    status_filter = request.args.get("status", "")
    query = Receipt.query
    if status_filter == "Pending":
        query = query.filter(Receipt.status.in_(["Draft", "Waiting", "Ready"]))
    elif status_filter and status_filter != "All":
        query = query.filter(Receipt.status == status_filter)
    receipts_list = query.order_by(Receipt.created_at.desc()).all()
    locations = Location.query.all()
    return render_template("operations/receipts.html", receipts=receipts_list, locations=locations, status_filter=status_filter)


@operations_bp.route("/receipts/add", methods=["GET", "POST"])
@login_required
def add_receipt():
    if request.method == "POST":
        supplier = request.form.get("supplier", "").strip()
        destination_id = request.form.get("destination_location_id", "")

        if not supplier:
            flash("Supplier name is required.", "danger")
            return redirect(url_for("operations.add_receipt"))
        if not destination_id:
            flash("Destination location is required.", "danger")
            return redirect(url_for("operations.add_receipt"))
        try:
            destination_id = int(destination_id)
        except ValueError:
            flash("Invalid destination location selected.", "danger")
            return redirect(url_for("operations.add_receipt"))
        if not Location.query.get(destination_id):
            flash("Selected destination location does not exist.", "danger")
            return redirect(url_for("operations.add_receipt"))

        lines, error = _parse_line_items(request.form)
        if error:
            flash(error, "danger")
            return redirect(url_for("operations.add_receipt"))

        receipt = Receipt(supplier=supplier, destination_location_id=destination_id, created_by=current_user.id)
        db.session.add(receipt)
        db.session.flush()

        for pid, qty in lines:
            db.session.add(ReceiptLine(receipt_id=receipt.id, product_id=pid, quantity=qty))

        db.session.commit()
        flash(f"Receipt #{receipt.id} created as Draft with {len(lines)} line(s).", "success")
        return redirect(url_for("operations.receipts"))

    products = Product.query.all()
    locations = Location.query.all()
    return render_template("operations/receipt_form.html", products=products, locations=locations)


@operations_bp.route("/receipts/status/<int:id>", methods=["POST"])
@login_required
def set_receipt_status(id):
    receipt = Receipt.query.get_or_404(id)
    new_status = request.form.get("status", "")

    if receipt.status == "Done":
        flash(f"Receipt #{id} is already validated and cannot be changed.", "warning")
        return redirect(url_for("operations.receipts"))
    if receipt.status == "Canceled":
        flash(f"Receipt #{id} is canceled and cannot be changed.", "warning")
        return redirect(url_for("operations.receipts"))
    if new_status not in ["Waiting", "Ready"]:
        flash(f"Invalid status '{new_status}'.", "danger")
        return redirect(url_for("operations.receipts"))

    receipt.status = new_status
    db.session.commit()
    flash(f"Receipt #{id} status updated to {new_status}.", "success")
    return redirect(url_for("operations.receipts"))


@operations_bp.route("/receipts/validate/<int:id>")
@login_required
def validate_receipt(id):
    receipt = Receipt.query.get_or_404(id)
    if receipt.status == "Done":
        flash(f"Receipt #{id} is already validated.", "warning")
        return redirect(url_for("operations.receipts"))
    if receipt.status == "Canceled":
        flash(f"Receipt #{id} is canceled and cannot be validated.", "danger")
        return redirect(url_for("operations.receipts"))
    if not receipt.lines:
        flash(f"Receipt #{id} has no line items and cannot be validated.", "danger")
        return redirect(url_for("operations.receipts"))

    for line in receipt.lines:
        try:
            apply_stock_change(line.product_id, receipt.destination_location_id, line.quantity, "Receipt", f"Receipt #{id}")
        except ValueError as e:
            flash(f"Error validating receipt: {str(e)}", "danger")
            return redirect(url_for("operations.receipts"))

    receipt.status = "Done"
    db.session.commit()
    flash(f"Receipt #{id} validated. Stock updated.", "success")
    return redirect(url_for("operations.receipts"))


@operations_bp.route("/receipts/cancel/<int:id>")
@login_required
def cancel_receipt(id):
    receipt = Receipt.query.get_or_404(id)
    if receipt.status == "Done":
        flash("Cannot cancel a validated receipt.", "danger")
        return redirect(url_for("operations.receipts"))
    receipt.status = "Canceled"
    db.session.commit()
    flash(f"Receipt #{id} canceled.", "info")
    return redirect(url_for("operations.receipts"))


@operations_bp.route("/deliveries")
@login_required
def deliveries():
    status_filter = request.args.get("status", "")
    query = DeliveryOrder.query
    if status_filter == "Pending":
        query = query.filter(DeliveryOrder.status.in_(["Draft", "Waiting", "Ready"]))
    elif status_filter and status_filter != "All":
        query = query.filter(DeliveryOrder.status == status_filter)
    deliveries_list = query.order_by(DeliveryOrder.created_at.desc()).all()
    locations = Location.query.all()
    return render_template("operations/deliveries.html", deliveries=deliveries_list, locations=locations, status_filter=status_filter)


@operations_bp.route("/deliveries/add", methods=["GET", "POST"])
@login_required
def add_delivery():
    if request.method == "POST":
        customer = request.form.get("customer", "").strip()
        source_id = request.form.get("source_location_id", "")

        if not customer:
            flash("Customer name is required.", "danger")
            return redirect(url_for("operations.add_delivery"))
        if not source_id:
            flash("Source location is required.", "danger")
            return redirect(url_for("operations.add_delivery"))
        try:
            source_id = int(source_id)
        except ValueError:
            flash("Invalid source location selected.", "danger")
            return redirect(url_for("operations.add_delivery"))
        if not Location.query.get(source_id):
            flash("Selected source location does not exist.", "danger")
            return redirect(url_for("operations.add_delivery"))

        lines, error = _parse_line_items(request.form)
        if error:
            flash(error, "danger")
            return redirect(url_for("operations.add_delivery"))

        delivery = DeliveryOrder(customer=customer, source_location_id=source_id, created_by=current_user.id)
        db.session.add(delivery)
        db.session.flush()

        for pid, qty in lines:
            db.session.add(DeliveryLine(delivery_id=delivery.id, product_id=pid, quantity=qty))

        db.session.commit()
        flash(f"Delivery Order #{delivery.id} created as Draft with {len(lines)} line(s).", "success")
        return redirect(url_for("operations.deliveries"))

    products = Product.query.all()
    locations = Location.query.all()
    return render_template("operations/delivery_form.html", products=products, locations=locations)


@operations_bp.route("/deliveries/status/<int:id>", methods=["POST"])
@login_required
def set_delivery_status(id):
    delivery = DeliveryOrder.query.get_or_404(id)
    new_status = request.form.get("status", "")

    if delivery.status == "Done":
        flash(f"Delivery Order #{id} is already validated and cannot be changed.", "warning")
        return redirect(url_for("operations.deliveries"))
    if delivery.status == "Canceled":
        flash(f"Delivery Order #{id} is canceled and cannot be changed.", "warning")
        return redirect(url_for("operations.deliveries"))
    if new_status not in ["Waiting", "Ready"]:
        flash(f"Invalid status '{new_status}'.", "danger")
        return redirect(url_for("operations.deliveries"))

    delivery.status = new_status
    db.session.commit()
    flash(f"Delivery Order #{id} status updated to {new_status}.", "success")
    return redirect(url_for("operations.deliveries"))


@operations_bp.route("/deliveries/validate/<int:id>")
@login_required
def validate_delivery(id):
    delivery = DeliveryOrder.query.get_or_404(id)
    if delivery.status == "Done":
        flash(f"Delivery Order #{id} is already validated.", "warning")
        return redirect(url_for("operations.deliveries"))
    if delivery.status == "Canceled":
        flash(f"Delivery Order #{id} is canceled and cannot be validated.", "danger")
        return redirect(url_for("operations.deliveries"))
    if not delivery.lines:
        flash(f"Delivery Order #{id} has no line items and cannot be validated.", "danger")
        return redirect(url_for("operations.deliveries"))

    # Check stock availability first — all or nothing
    for line in delivery.lines:
        stock = Stock.query.filter_by(product_id=line.product_id, location_id=delivery.source_location_id).first()
        product = Product.query.get(line.product_id)
        product_name = product.name if product else f"product #{line.product_id}"
        available = stock.quantity if stock else 0
        if available < line.quantity:
            shortfall = line.quantity - available
            flash(
                f"Cannot validate Delivery #{id}: insufficient stock for '{product_name}'. "
                f"Requested {line.quantity}, available {available}. Shortfall: {shortfall} units.",
                "danger",
            )
            return redirect(url_for("operations.deliveries"))

    # All lines have enough stock — apply
    for line in delivery.lines:
        apply_stock_change(line.product_id, delivery.source_location_id, -line.quantity, "Delivery", f"Delivery Order #{id}")

    delivery.status = "Done"
    db.session.commit()
    flash(f"Delivery Order #{id} validated. Stock deducted.", "success")
    return redirect(url_for("operations.deliveries"))


@operations_bp.route("/deliveries/cancel/<int:id>")
@login_required
def cancel_delivery(id):
    delivery = DeliveryOrder.query.get_or_404(id)
    if delivery.status == "Done":
        flash("Cannot cancel a validated delivery.", "danger")
        return redirect(url_for("operations.deliveries"))
    delivery.status = "Canceled"
    db.session.commit()
    flash(f"Delivery Order #{id} canceled.", "info")
    return redirect(url_for("operations.deliveries"))


@operations_bp.route("/transfers", methods=["GET", "POST"])
@login_required
def transfers():
    if request.method == "POST":
        product_id = request.form.get("product_id", "")
        from_loc = request.form.get("from_location_id", "")
        to_loc = request.form.get("to_location_id", "")
        quantity = request.form.get("quantity", "")

        if not product_id or not from_loc or not to_loc or not quantity:
            flash("All fields (product, source, destination, quantity) are required.", "danger")
            return redirect(url_for("operations.transfers"))
        try:
            product_id = int(product_id)
            from_loc = int(from_loc)
            to_loc = int(to_loc)
            quantity = int(quantity)
        except ValueError:
            flash("All fields must be valid numbers.", "danger")
            return redirect(url_for("operations.transfers"))

        if quantity <= 0:
            flash("Quantity must be greater than 0.", "danger")
            return redirect(url_for("operations.transfers"))
        if from_loc == to_loc:
            flash("Source and destination locations must be different.", "danger")
            return redirect(url_for("operations.transfers"))

        product = Product.query.get(product_id)
        if not product:
            flash("Selected product does not exist.", "danger")
            return redirect(url_for("operations.transfers"))
        from_location = Location.query.get(from_loc)
        to_location = Location.query.get(to_loc)
        if not from_location or not to_location:
            flash("One or both selected locations do not exist.", "danger")
            return redirect(url_for("operations.transfers"))

        # Check stock at source (do NOT create a row just to check)
        stock = Stock.query.filter_by(product_id=product_id, location_id=from_loc).first()
        available = stock.quantity if stock else 0
        if available < quantity:
            shortfall = quantity - available
            flash(
                f"Insufficient stock for '{product.name}' at {from_location.name}. "
                f"Requested {quantity}, available {available}. Shortfall: {shortfall} units.",
                "danger",
            )
            return redirect(url_for("operations.transfers"))

        # Apply transfer immediately
        transfer = InternalTransfer(
            product_id=product_id,
            from_location_id=from_loc,
            to_location_id=to_loc,
            quantity=quantity,
        )
        db.session.add(transfer)
        db.session.flush()

        apply_stock_change(product_id, from_loc, -quantity, "Transfer-out", f"Transfer #{transfer.id}")
        apply_stock_change(product_id, to_loc, quantity, "Transfer-in", f"Transfer #{transfer.id}")

        db.session.commit()
        flash(f"Transfer of {quantity} {product.name} completed ({from_location.name} -> {to_location.name}).", "success")
        return redirect(url_for("operations.transfers"))

    products = Product.query.all()
    locations = Location.query.all()
    transfers_list = InternalTransfer.query.order_by(InternalTransfer.transferred_at.desc()).all()
    return render_template("operations/transfers.html", products=products, locations=locations, transfers=transfers_list)


@operations_bp.route("/adjustments", methods=["GET", "POST"])
@login_required
def adjustments():
    if request.method == "POST":
        product_id = request.form.get("product_id", "")
        location_id = request.form.get("location_id", "")
        counted_quantity = request.form.get("counted_quantity", "")

        if not product_id or not location_id or not counted_quantity:
            flash("All fields (product, location, counted quantity) are required.", "danger")
            return redirect(url_for("operations.adjustments"))
        try:
            product_id = int(product_id)
            location_id = int(location_id)
            counted_quantity = int(counted_quantity)
        except ValueError:
            flash("Product, location, and counted quantity must be valid numbers.", "danger")
            return redirect(url_for("operations.adjustments"))

        if counted_quantity < 0:
            flash("Counted quantity cannot be negative.", "danger")
            return redirect(url_for("operations.adjustments"))

        product = Product.query.get(product_id)
        location = Location.query.get(location_id)
        if not product:
            flash("Selected product does not exist.", "danger")
            return redirect(url_for("operations.adjustments"))
        if not location:
            flash("Selected location does not exist.", "danger")
            return redirect(url_for("operations.adjustments"))

        stock = get_or_create_stock(product_id, location_id, create=True)
        previous_quantity = stock.quantity
        difference = counted_quantity - previous_quantity

        adjustment = StockAdjustment(
            product_id=product_id,
            location_id=location_id,
            counted_quantity=counted_quantity,
            previous_quantity=previous_quantity,
        )
        db.session.add(adjustment)
        db.session.flush()

        # Apply the adjustment
        stock.quantity = counted_quantity
        log_ledger(product_id, location_id, difference, "Adjustment", f"Adjustment #{adjustment.id}")

        db.session.commit()
        flash(
            f"Adjustment recorded: {product.name} at {location.name} changed by {difference:+d} "
            f"(was {previous_quantity}, now {counted_quantity}).",
            "success",
        )
        return redirect(url_for("operations.adjustments"))

    products = Product.query.all()
    locations = Location.query.all()
    ledgers = StockLedger.query.order_by(StockLedger.created_at.desc()).all()
    return render_template("operations/adjustments.html", products=products, locations=locations, ledgers=ledgers)


@operations_bp.route("/move-history")
@login_required
def move_history():
    reason_filter = request.args.get("reason", "")
    query = StockLedger.query
    if reason_filter:
        query = query.filter(StockLedger.reason == reason_filter)
    ledgers = query.order_by(StockLedger.created_at.desc()).all()
    reasons = ["Receipt", "Delivery", "Transfer-out", "Transfer-in", "Adjustment"]
    return render_template("operations/move_history.html", ledgers=ledgers, reasons=reasons, reason_filter=reason_filter)
