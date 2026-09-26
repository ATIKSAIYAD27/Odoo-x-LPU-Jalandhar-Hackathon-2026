from flask import Blueprint, render_template, redirect, url_for, request, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User, PasswordResetOTP
from datetime import datetime, timedelta
import random

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        role = request.form.get("role", "Warehouse Staff")

        if not name or not email or not password:
            flash("All fields (name, email, password) are required.", "danger")
            return redirect(url_for("auth.signup"))
        if len(password) < 6:
            flash("Password must be at least 6 characters.", "danger")
            return redirect(url_for("auth.signup"))

        existing = User.query.filter_by(email=email).first()
        if existing:
            flash("Email already registered.", "danger")
            return redirect(url_for("auth.signup"))

        user = User(name=name, email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash("Account created successfully! Please log in.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/signup.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not email or not password:
            flash("Email and password are required.", "danger")
            return redirect(url_for("auth.login"))

        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            flash(f"Welcome back, {user.name}!", "success")
            return redirect(url_for("dashboard.index"))
        flash("Invalid email or password.", "danger")
        return redirect(url_for("auth.login"))

    return render_template("auth/login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("auth.login"))


@auth_bp.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        if not email:
            flash("Please enter your email.", "danger")
            return redirect(url_for("auth.forgot_password"))

        user = User.query.filter_by(email=email).first()
        if user:
            otp = PasswordResetOTP(
                email=email,
                code=str(random.randint(100000, 999999)),
                created_at=datetime.utcnow(),
                used=False,
            )
            db.session.add(otp)
            db.session.commit()
            flash(f"OTP generated for {email}. OTP: {otp.code}", "info")
        else:
            flash("If that email exists, an OTP has been generated.", "info")

        return redirect(url_for("auth.forgot_password"))

    return render_template("auth/forgot_password.html")


@auth_bp.route("/reset-password", methods=["GET", "POST"])
def reset_password():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        otp_code = request.form.get("otp", "").strip()
        new_password = request.form.get("password", "")

        if not email or not otp_code or not new_password:
            flash("All fields are required.", "danger")
            return redirect(url_for("auth.reset_password"))

        if len(new_password) < 6:
            flash("Password must be at least 6 characters.", "danger")
            return redirect(url_for("auth.reset_password"))

        otp = PasswordResetOTP.query.filter_by(email=email, used=False).first()
        if not otp:
            flash("No valid OTP found. Please request a new one.", "danger")
            return redirect(url_for("auth.reset_password"))

        if otp.is_expired():
            otp.used = True
            db.session.commit()
            flash("OTP has expired. Please request a new one.", "danger")
            return redirect(url_for("auth.reset_password"))

        if otp.code != otp_code:
            flash("Invalid OTP code.", "danger")
            return redirect(url_for("auth.reset_password"))

        user = User.query.filter_by(email=email).first()
        if user:
            user.set_password(new_password)
            otp.used = True
            db.session.commit()
            flash("Password reset successfully! Please log in.", "success")
            return redirect(url_for("auth.login"))

        flash("User not found.", "danger")
        return redirect(url_for("auth.reset_password"))

    return render_template("auth/reset_password.html")
