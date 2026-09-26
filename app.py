import sys
import os

# Point to backend directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"StockSense IMS running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
