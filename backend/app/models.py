from datetime import datetime, timedelta
from flask_login import UserMixin
from app import db


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(30), nullable=False, default="Warehouse Staff")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    receipts = db.relationship("Receipt", backref="user", lazy=True)
    deliveries = db.relationship("DeliveryOrder", backref="user", lazy=True)

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class Category(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    products = db.relationship("Product", backref="category", lazy=True)

    def __repr__(self):
        return f"<Category {self.name}>"


class Warehouse(db.Model):
    __tablename__ = "warehouses"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    locations = db.relationship("Location", backref="warehouse", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Warehouse {self.name}>"


class Location(db.Model):
    __tablename__ = "locations"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey("warehouses.id"), nullable=False)

    stocks = db.relationship("Stock", back_populates="location", lazy=True)
    ledger_entries = db.relationship("StockLedger", back_populates="location", lazy=True)
    adjustments = db.relationship("StockAdjustment", back_populates="location", lazy=True)

    def __repr__(self):
        return f"<Location {self.name}>"


class Product(db.Model):
    __tablename__ = "products"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(100), unique=True, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    uom = db.Column(db.String(50), nullable=False, default="pcs")
    reorder_level = db.Column(db.Integer, nullable=False, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    stocks = db.relationship("Stock", back_populates="product", lazy=True, cascade="all, delete-orphan")
    ledger_entries = db.relationship("StockLedger", back_populates="product", lazy=True)
    adjustments = db.relationship("StockAdjustment", back_populates="product", lazy=True)

    @property
    def total_stock(self):
        return sum(
            (s.quantity for s in self.stocks),
            0,
        )

    def __repr__(self):
        return f"<Product {self.name} ({self.sku})>"


class Stock(db.Model):
    __tablename__ = "stock"
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False, default=0)

    product = db.relationship("Product", back_populates="stocks")
    location = db.relationship("Location", back_populates="stocks")

    def __repr__(self):
        return f"<Stock product={self.product_id} loc={self.location_id} qty={self.quantity}>"


class Receipt(db.Model):
    __tablename__ = "receipts"
    id = db.Column(db.Integer, primary_key=True)
    supplier = db.Column(db.String(200), nullable=False)
    destination_location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Draft")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    destination_location = db.relationship("Location", foreign_keys=[destination_location_id], backref="receipts")
    lines = db.relationship("ReceiptLine", backref="receipt", lazy=True, cascade="all, delete-orphan")

    VALID_STATUSES = ["Draft", "Waiting", "Ready", "Done", "Canceled"]

    def __repr__(self):
        return f"<Receipt #{self.id} ({self.status})>"


class ReceiptLine(db.Model):
    __tablename__ = "receipt_lines"
    id = db.Column(db.Integer, primary_key=True)
    receipt_id = db.Column(db.Integer, db.ForeignKey("receipts.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    product = db.relationship("Product", foreign_keys=[product_id])

    @property
    def qty(self):
        return self.quantity

    def __repr__(self):
        return f"<ReceiptLine product={self.product_id} qty={self.quantity}>"


class DeliveryOrder(db.Model):
    __tablename__ = "delivery_orders"
    id = db.Column(db.Integer, primary_key=True)
    customer = db.Column(db.String(200), nullable=False)
    source_location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Draft")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    source_location = db.relationship("Location", foreign_keys=[source_location_id], backref="delivery_orders")
    lines = db.relationship("DeliveryLine", backref="delivery", lazy=True, cascade="all, delete-orphan")

    VALID_STATUSES = ["Draft", "Waiting", "Ready", "Done", "Canceled"]

    def __repr__(self):
        return f"<DeliveryOrder #{self.id} ({self.status})>"


class DeliveryLine(db.Model):
    __tablename__ = "delivery_lines"
    id = db.Column(db.Integer, primary_key=True)
    delivery_id = db.Column(db.Integer, db.ForeignKey("delivery_orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    product = db.relationship("Product", foreign_keys=[product_id])

    @property
    def qty(self):
        return self.quantity

    def __repr__(self):
        return f"<DeliveryLine product={self.product_id} qty={self.quantity}>"


class InternalTransfer(db.Model):
    __tablename__ = "internal_transfers"
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    from_location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    to_location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    transferred_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product", foreign_keys=[product_id], backref="transfers")
    from_location = db.relationship("Location", foreign_keys=[from_location_id], backref="transfers_from")
    to_location = db.relationship("Location", foreign_keys=[to_location_id], backref="transfers_to")

    def __repr__(self):
        return f"<InternalTransfer #{self.id}: {self.product_id} {self.from_location_id}->{self.to_location_id}>"


class StockAdjustment(db.Model):
    __tablename__ = "stock_adjustments"
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    counted_quantity = db.Column(db.Integer, nullable=False)
    adjusted_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product", back_populates="adjustments")
    location = db.relationship("Location", back_populates="adjustments")

    previous_quantity = db.Column(db.Integer, nullable=True)

    @property
    def difference(self):
        if self.previous_quantity is None:
            return 0
        return self.counted_quantity - self.previous_quantity

    def __repr__(self):
        return f"<StockAdjustment #{self.id}: product={self.product_id} diff={self.difference}>"


class StockLedger(db.Model):
    __tablename__ = "stock_ledgers"
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    change = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(50), nullable=False)
    reference = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product", back_populates="ledger_entries")
    location = db.relationship("Location", back_populates="ledger_entries")

    def __repr__(self):
        return f"<Ledger {self.reason} {self.reference} change={self.change}>"


class PasswordResetOTP(db.Model):
    __tablename__ = "password_reset_otps"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    used = db.Column(db.Boolean, default=False)

    def is_expired(self):
        return datetime.utcnow() > self.created_at + timedelta(minutes=10)

    def __repr__(self):
        return f"<OTP {self.email} used={self.used}>"
