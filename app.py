import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Remove current module from sys.modules to prevent shadowing the backend app package
if "app" in sys.modules and not hasattr(sys.modules["app"], "create_app"):
    del sys.modules["app"]

import app as backend_pkg
create_app = backend_pkg.create_app
application = create_app()
app = application

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"StockSense IMS running on http://127.0.0.1:{port}")
    application.run(host="0.0.0.0", port=port, debug=True)
