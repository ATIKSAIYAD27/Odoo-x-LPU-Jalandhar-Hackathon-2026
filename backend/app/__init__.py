from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.login_message_category = "warning"

def create_app():
    app = Flask(__name__, instance_relative_config=False)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "stocksense-dev-key-change-me")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(app.instance_path, "stocksense.db")
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    login_manager.init_app(app)

    from app.models import User

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    from app.auth import auth_bp
    from app.dashboard import dashboard_bp
    from app.products import products_bp
    from app.operations import operations_bp
    from app.settings import settings_bp
    from app.profile import profile_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(operations_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(profile_bp)

    with app.app_context():
        os.makedirs(app.instance_path, exist_ok=True)
        db.create_all()

        # Seed demo data on first run so the app is usable immediately
        from app.seed import seed_if_empty
        seed_if_empty()

    return app
