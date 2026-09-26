from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from app import db
from app.models import User

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile")
@login_required
def index():
    return render_template("profile.html", user=current_user)


@profile_bp.route("/profile/edit", methods=["POST"])
@login_required
def edit_profile():
    name = request.form.get("name", "").strip()
    if not name:
        flash("Name is required.", "danger")
        return redirect(url_for("profile.index"))
    current_user.name = name
    db.session.commit()
    flash("Profile updated!", "success")
    return redirect(url_for("profile.index"))


@profile_bp.route("/profile/change-password", methods=["POST"])
@login_required
def change_password():
    current_password = request.form.get("current_password", "")
    new_password = request.form.get("new_password", "")
    confirm_password = request.form.get("confirm_password", "")

    if not current_password or not new_password or not confirm_password:
        flash("All password fields are required.", "danger")
        return redirect(url_for("profile.index"))

    if not current_user.check_password(current_password):
        flash("Current password is incorrect.", "danger")
        return redirect(url_for("profile.index"))

    if new_password != confirm_password:
        flash("New passwords do not match.", "danger")
        return redirect(url_for("profile.index"))

    if len(new_password) < 6:
        flash("New password must be at least 6 characters.", "danger")
        return redirect(url_for("profile.index"))

    current_user.set_password(new_password)
    db.session.commit()
    flash("Password changed successfully!", "success")
    return redirect(url_for("profile.index"))
