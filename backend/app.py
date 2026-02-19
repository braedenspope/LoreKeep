import os
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash

import config
from extensions import db
from models import User
from routes import all_blueprints

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(config)

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize extensions
db.init_app(app)

# Configure CORS
CORS(app,
     origins=config.FRONTEND_URLS,
     allow_headers=['Content-Type', 'Authorization'],
     expose_headers=['Set-Cookie'],
     allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     supports_credentials=True)

# Register all blueprints
for bp in all_blueprints:
    app.register_blueprint(bp)


# Test endpoint
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"message": "LoreKeep API is working!"})


# Main application entry point
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))

    with app.app_context():
        db.create_all()  # Create database tables

        # Create a demo user if none exists (for testing)
        if not User.query.filter_by(username='demo').first():
            demo_user = User(
                username='demo',
                email='demo@example.com',
                password_hash=generate_password_hash('demo123')
            )
            db.session.add(demo_user)
            db.session.commit()

    app.run(host='0.0.0.0', port=port, debug=False)
