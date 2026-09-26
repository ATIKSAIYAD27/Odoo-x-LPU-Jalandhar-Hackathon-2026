# StockSense — Inventory Management System

Modular Inventory Management System (IMS) API built with Python + Flask, replacing manual registers and Excel sheets with real-time, database-backed tracking.

## Stack
- **Python + Flask** (app factory pattern)
- **Flask-SQLAlchemy** + **Flask-Login** + **Werkzeug** password hashing
- **SQLite** database (self-contained, runs offline)
- No external services (no email/SMS provider)

## Architecture
Modular Flask blueprints, one per concern:
- `app/__init__.py` → App factory, extension init, blueprint registration, `db.create_all()`
- `app/models.py` → All SQLAlchemy models (User, Category, Warehouse, Location, Product, Stock, Receipt, DeliveryOrder, InternalTransfer, StockAdjustment, StockLedger, PasswordResetOTP)
- `app/auth.py` → Signup, login, logout, OTP password reset
- `app/dashboard.py` → KPI computation + `/api/kpis` JSON endpoint
- `app/products.py` → Product CRUD, search, category/stock filtering
- `app/operations.py` → Receipts, delivery orders, internal transfers, stock adjustments, stock ledger (move history)
- `app/settings.py` → Warehouses & locations management
- `app/profile.py` → View/edit current user profile
- `app/utils.py` → Shared helpers: `get_or_create_stock()`, `log_ledger()`, `apply_stock_change()`

## Getting Started
```bash
cd backend
pip install -r requirements.txt
python run.py
```
App runs at `http://localhost:5000`

## Key Features
- **Receipts & Deliveries**: Draft → Validate workflow with stock management
- **Internal Transfers**: Apply immediately with source/destination validation
- **Stock Adjustments**: Count-based adjustments with computed differences
- **Stock Ledger**: Append-only log of every movement (Receipt/Delivery/Transfer/Adjustment)
- **Dashboard KPIs**: Live-computed from database (total products, low stock, out of stock, pending receipts/deliveries)
- **Authentication**: Session-based with Flask-Login, OTP password reset
- **Filters**: Products by search/category/stock status; Receipts/Deliveries by status; Move History by reason

## Project Structure
```
backend/
├── run.py                    # Entry point
├── requirements.txt          # Dependencies
├── .gitignore               # Git ignore rules
├── app/
│   ├── __init__.py          # App factory
│   ├── models.py            # SQLAlchemy models
│   ├── auth.py              # Auth blueprint
│   ├── dashboard.py         # Dashboard blueprint
│   ├── products.py          # Products blueprint
│   ├── operations.py        # Operations blueprint
│   ├── settings.py          # Settings blueprint
│   ├── profile.py           # Profile blueprint
│   ├── utils.py             # Shared helpers
│   ├── templates/           # HTML templates
│   │   ├── base.html        # Base template
│   │   ├── auth/            # Auth templates
│   │   ├── products/        # Product templates
│   │   ├── operations/      # Operations templates
│   │   ├── settings/        # Settings templates
│   │   ├── dashboard.html
│   │   └── profile.html
│   └── static/              # Static files
└── instance/                # SQLite database (gitignored)

fronted/                     # Frontend application
```

## Business Logic
- **Receipts/Deliveries**: Created as Draft (no stock effect). Validate increases/decreases stock and logs ledger. Already-validated can't be re-validated.
- **Deliveries**: Before validating, checks every line has enough stock. Rejects with specific error naming product and shortfall if insufficient.
- **Internal Transfers**: Apply immediately. Rejects if source = destination or insufficient stock. Writes TWO ledger entries (Transfer-out/Transfer-in).
- **Stock Adjustments**: Apply immediately. Computes difference (counted − previous), logs ledger.
- **All quantity fields**: Reject <= 0 (transfers/lines) or negative (adjustment counts) at route level.
- **Shared helpers**: `get_or_create_stock()` and `log_ledger()` used by all stock-changing operations.
