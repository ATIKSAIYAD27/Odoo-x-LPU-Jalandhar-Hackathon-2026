from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required
from app import db
from app.models import Product, Category, Stock, StockLedger, StockAdjustment, ReceiptLine, DeliveryLine, InternalTransfer

products_bp = Blueprint("products", __name__)


def _parse_int(value, field_name):
    try:
        return int(value)
    except (ValueError, TypeError):
        flash(f"{field_name} must be a valid number.", "danger")
        return None


@products_bp.route("/products")
@login_required
def product_list():
    search = request.args.get("search", "").strip()
    category_id = request.args.get("category", "")
    stock_status = request.args.get("stock_status", "")

    query = Product.query

    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
        )
    if category_id:
        cid = _parse_int(category_id, "Category")
        if cid is None:
            return redirect(url_for("products.product_list"))
        query = query.filter(Product.category_id == cid)

    products = query.all()

    if stock_status == "low":
        products = [p for p in products if 0 < p.total_stock <= p.reorder_level]
    elif stock_status == "out":
        products = [p for p in products if p.total_stock <= 0]

    categories = Category.query.order_by(Category.name).all()
    return render_template(
        "products/product_list.html",
        products=products,
        categories=categories,
        search=search,
        category_id=category_id,
        stock_status=stock_status,
    )


@products_bp.route("/products/add", methods=["GET", "POST"])
@login_required
def add_product():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        sku = request.form.get("sku", "").strip()
        category_id = request.form.get("category_id", "")
        uom = request.form.get("uom", "pcs").strip()
        reorder_level = request.form.get("reorder_level", "10").strip()

        if not name:
            flash("Product name is required.", "danger")
            return redirect(url_for("products.add_product"))
        if not sku:
            flash("SKU is required.", "danger")
            return redirect(url_for("products.add_product"))
        if not category_id:
            flash("Category is required. Please add a category first in Settings.", "danger")
            return redirect(url_for("products.add_product"))
        cid = _parse_int(category_id, "Category")
        if cid is None:
            return redirect(url_for("products.add_product"))
        if not Category.query.get(cid):
            flash("Selected category does not exist.", "danger")
            return redirect(url_for("products.add_product"))
        try:
            reorder_level = int(reorder_level)
        except ValueError:
            flash("Reorder level must be a whole number.", "danger")
            return redirect(url_for("products.add_product"))
        if reorder_level < 0:
            flash("Reorder level cannot be negative.", "danger")
            return redirect(url_for("products.add_product"))

        existing = Product.query.filter_by(sku=sku).first()
        if existing:
            flash(f"SKU '{sku}' is already used by '{existing.name}'.", "danger")
            return redirect(url_for("products.add_product"))

        product = Product(name=name, sku=sku, category_id=cid, uom=uom or "pcs", reorder_level=reorder_level)
        db.session.add(product)
        db.session.commit()
        flash(f"Product '{name}' added successfully!", "success")
        return redirect(url_for("products.product_list"))

    categories = Category.query.order_by(Category.name).all()
    return render_template("products/product_form.html", categories=categories)


@products_bp.route("/products/edit/<int:id>", methods=["GET", "POST"])
@login_required
def edit_product(id):
    product = Product.query.get_or_404(id)
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        sku = request.form.get("sku", "").strip()
        category_id = request.form.get("category_id", "")
        uom = request.form.get("uom", "pcs").strip()
        reorder_level = request.form.get("reorder_level", "").strip()

        if not name:
            flash("Product name is required.", "danger")
            return redirect(url_for("products.edit_product", id=id))
        if not sku:
            flash("SKU is required.", "danger")
            return redirect(url_for("products.edit_product", id=id))
        if not category_id:
            flash("Category is required.", "danger")
            return redirect(url_for("products.edit_product", id=id))
        cid = _parse_int(category_id, "Category")
        if cid is None:
            return redirect(url_for("products.edit_product", id=id))
        if not Category.query.get(cid):
            flash("Selected category does not exist.", "danger")
            return redirect(url_for("products.edit_product", id=id))
        try:
            reorder_level = int(reorder_level)
        except ValueError:
            flash("Reorder level must be a whole number.", "danger")
            return redirect(url_for("products.edit_product", id=id))
        if reorder_level < 0:
            flash("Reorder level cannot be negative.", "danger")
            return redirect(url_for("products.edit_product", id=id))

        # Duplicate SKU check (exclude self)
        existing = Product.query.filter(Product.sku == sku, Product.id != id).first()
        if existing:
            flash(f"SKU '{sku}' is already used by '{existing.name}'.", "danger")
            return redirect(url_for("products.edit_product", id=id))

        product.name = name
        product.sku = sku
        product.category_id = cid
        product.uom = uom or "pcs"
        product.reorder_level = reorder_level
        db.session.commit()
        flash(f"Product '{name}' updated!", "success")
        return redirect(url_for("products.product_list"))

    categories = Category.query.order_by(Category.name).all()
    return render_template("products/product_form.html", product=product, categories=categories)


@products_bp.route("/products/delete/<int:id>")
@login_required
def delete_product(id):
    product = Product.query.get_or_404(id)
    name = product.name

    # Block deletion if the product is referenced anywhere
    if Stock.query.filter_by(product_id=id).first():
        flash(f"Cannot delete '{name}': it has stock records. Adjust stock to zero and remove stock rows first.", "danger")
        return redirect(url_for("products.product_list"))
    if StockLedger.query.filter_by(product_id=id).first():
        flash(f"Cannot delete '{name}': it has movement history in the stock ledger.", "danger")
        return redirect(url_for("products.product_list"))
    if StockAdjustment.query.filter_by(product_id=id).first():
        flash(f"Cannot delete '{name}': it has adjustment records.", "danger")
        return redirect(url_for("products.product_list"))
    if ReceiptLine.query.filter_by(product_id=id).first():
        flash(f"Cannot delete '{name}': it appears on receipt documents.", "danger")
        return redirect(url_for("products.product_list"))
    if DeliveryLine.query.filter_by(product_id=id).first():
        flash(f"Cannot delete '{name}': it appears on delivery documents.", "danger")
        return redirect(url_for("products.product_list"))
    if InternalTransfer.query.filter_by(product_id=id).first():
        flash(f"Cannot delete '{name}': it appears on transfer records.", "danger")
        return redirect(url_for("products.product_list"))

    db.session.delete(product)
    db.session.commit()
    flash(f"Product '{name}' deleted.", "info")
    return redirect(url_for("products.product_list"))


@products_bp.route("/products/<int:id>")
@login_required
def product_detail(id):
    product = Product.query.get_or_404(id)
    stocks = Stock.query.filter_by(product_id=id).all()
    return render_template("products/product_detail.html", product=product, stocks=stocks)


# ----------------------------------------------------
# Category CRUD (required so products can be created)
# ----------------------------------------------------
@products_bp.route("/categories")
@login_required
def category_list():
    categories = Category.query.order_by(Category.name).all()
    return render_template("products/categories.html", categories=categories)


@products_bp.route("/categories/add", methods=["POST"])
@login_required
def add_category():
    name = request.form.get("name", "").strip()
    if not name:
        flash("Category name is required.", "danger")
        return redirect(url_for("products.category_list"))
    existing = Category.query.filter(Category.name.ilike(name)).first()
    if existing:
        flash(f"Category '{name}' already exists.", "danger")
        return redirect(url_for("products.category_list"))
    category = Category(name=name)
    db.session.add(category)
    db.session.commit()
    flash(f"Category '{name}' added.", "success")
    return redirect(url_for("products.category_list"))


@products_bp.route("/categories/edit/<int:id>", methods=["POST"])
@login_required
def edit_category(id):
    category = Category.query.get_or_404(id)
    name = request.form.get("name", "").strip()
    if not name:
        flash("Category name is required.", "danger")
        return redirect(url_for("products.category_list"))
    existing = Category.query.filter(Category.name.ilike(name), Category.id != id).first()
    if existing:
        flash(f"Category '{name}' already exists.", "danger")
        return redirect(url_for("products.category_list"))
    category.name = name
    db.session.commit()
    flash(f"Category renamed to '{name}'.", "success")
    return redirect(url_for("products.category_list"))


@products_bp.route("/categories/delete/<int:id>")
@login_required
def delete_category(id):
    category = Category.query.get_or_404(id)
    if category.products:
        flash(f"Cannot delete '{category.name}': {len(category.products)} product(s) still use it.", "danger")
        return redirect(url_for("products.category_list"))
    name = category.name
    db.session.delete(category)
    db.session.commit()
    flash(f"Category '{name}' deleted.", "info")
    return redirect(url_for("products.category_list"))
