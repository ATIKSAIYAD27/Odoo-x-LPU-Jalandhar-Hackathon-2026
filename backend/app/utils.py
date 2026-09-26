from functools import wraps
from flask import flash, redirect, url_for, request
from flask_login import current_user
from app import db
from app.models import Stock, StockLedger

MANAGER_ROLE = "Inventory Manager"


def role_required(*roles):
    """Restrict a view to users whose role is in `roles."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for("auth.login"))
            if current_user.role not in roles:
                allowed = " or ".join(roles)
                flash(
                    f"Access denied — this action requires the {allowed} role. "
                    f"You are signed in as {current_user.role}.",
                    "danger",
                )
                return redirect(request.referrer or url_for("dashboard.index"))
            return func(*args, **kwargs)
        return wrapper
    return decorator


def is_manager():
    return current_user.is_authenticated and current_user.role == MANAGER_ROLE


def get_or_create_stock(product_id, location_id, create=False):
    stock = Stock.query.filter_by(product_id=product_id, location_id=location_id).first()
    if stock is None and create:
        stock = Stock(product_id=product_id, location_id=location_id, quantity=0)
        db.session.add(stock)
        db.session.flush()
    return stock


def log_ledger(product_id, location_id, change, reason, reference):
    entry = StockLedger(
        product_id=product_id,
        location_id=location_id,
        change=change,
        reason=reason,
        reference=reference,
    )
    db.session.add(entry)
    db.session.flush()


def apply_stock_change(product_id, location_id, delta, reason, reference, create=True):
    stock = get_or_create_stock(product_id, location_id, create=create)
    if stock is None:
        raise ValueError(f"Stock record not found for product {product_id} at location {location_id}")
    if stock.quantity + delta < 0:
        raise ValueError(f"Insufficient stock for product {product_id} at location {location_id}")
    stock.quantity += delta
    log_ledger(product_id, location_id, delta, reason, reference)
