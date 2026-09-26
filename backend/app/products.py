from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from app import db
from app.models import Product, Category, Stock
from app.utils import get_or_create_stock

products_bp = Blueprint("products", __name__)


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
        query = query.filter(Product.category_id == int(category_id))
    if stock_status == "low":
        products = query.all()
        products = [p for p in products if 0 < p.total_stock <= p.reorder_level]
    elif stock_status == "out":
        products = query.all()
        products = [p for p in products if p.total_stock <= 0]
    else:
        products = query.all()

    categories = Category.query.all()
    return render_template("products/product_list.html", products=products, categories=categories, search=search, category_id=category_id, stock_status=stock_status)


@products_bp.route("/products/add", methods=["GET", "POST"])
@login_required
def add_product():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        sku = request.form.get("sku", "").strip()
        category_id = request.form.get("category_id", "")
        uom = request.form.get("uom", "pcs").strip()
        reorder_level = request.form.get("reorder_level", "10").strip()

        if not name or not sku:
            flash("Name and SKU are required.", "danger")
            return redirect(url_for("products.add_product"))
        if not category_id:
            flash("Category is required.", "danger")
            return redirect(url_for("products.add_product"))
        try:
            reorder_level = int(reorder_level)
        except ValueError:
            flash("Reorder level must be a number.", "danger")
            return redirect(url_for("products.add_product"))

        existing = Product.query.filter_by(sku=sku).first()
        if existing:
            flash(f"SKU '{sku}' is already in use.", "danger")
            return redirect(url_for("products.add_product"))

        product = Product(name=name, sku=sku, category_id=int(category_id), uom=uom, reorder_level=reorder_level)
        db.session.add(product)
        db.session.commit()
        flash(f"Product '{name}' added successfully!", "success")
        return redirect(url_for("products.product_list"))

    categories = Category.query.all()
    return render_template("products/product_form.html", categories=categories)


@products_bp.route("/products/edit/<int:id>", methods=["GET", "POST"])
@login_required
def edit_product(id):
    product = Product.query.get_or_404(id)
    if request.method == "POST":
        product.name = request.form.get("name", "").strip()
        product.sku = request.form.get("sku", "").strip()
        product.category_id = int(request.form.get("category_id", product.category_id))
        product.uom = request.form.get("uom", "pcs").strip()
        try:
            product.reorder_level = int(request.form.get("reorder_level", product.reorder_level))
        except ValueError:
            flash("Reorder level must be a number.", "danger")
            return redirect(url_for("products.edit_product", id=id))

        if not product.name or not product.sku:
            flash("Name and SKU are required.", "danger")
            return redirect(url_for("products.edit_product", id=id))

        db.session.commit()
        flash(f"Product '{product.name}' updated!", "success")
        return redirect(url_for("products.product_list"))

    categories = Category.query.all()
    return render_template("products/product_form.html", product=product, categories=categories)


@products_bp.route("/products/delete/<int:id>")
@login_required
def delete_product(id):
    product = Product.query.get_or_404(id)
    name = product.name
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
