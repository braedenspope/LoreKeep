from flask import Flask, jsonify, request, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
import json

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')

# Configure CORS to allow requests from React frontend
CORS(app, supports_credentials=True, origins=['http://localhost:3000'], allow_headers=['Content-Type'])

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lorekeep.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    lore_maps = db.relationship('LoreMap', backref='author', lazy=True)
    characters = db.relationship('Character', backref='creator', lazy=True)
    items = db.relationship('Item', backref='creator', lazy=True)

class LoreMap(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    events = db.relationship('Event', backref='lore_map', lazy=True, cascade='all, delete-orphan')

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(100))
    position_x = db.Column(db.Integer, default=0)
    position_y = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(255))
    conditions = db.Column(db.Text)  # JSON string for conditions
    is_party_location = db.Column(db.Boolean, default=False)
    lore_map_id = db.Column(db.Integer, db.ForeignKey('lore_map.id'), nullable=False)
    
    # Relationships
    characters = db.relationship('EventCharacter', backref='event', lazy=True, cascade='all, delete-orphan')
    connections_from = db.relationship('EventConnection', 
                                      foreign_keys='EventConnection.from_event_id',
                                      backref='from_event', 
                                      lazy=True,
                                      cascade='all, delete-orphan')
    connections_to = db.relationship('EventConnection', 
                                    foreign_keys='EventConnection.to_event_id',
                                    backref='to_event', 
                                    lazy=True,
                                    cascade='all, delete-orphan')

class EventConnection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    from_event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    to_event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    description = db.Column(db.String(255))
    condition = db.Column(db.Text)  # JSON string for conditions

class Character(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    character_type = db.Column(db.String(50))  # 'PC', 'NPC', 'Monster'
    description = db.Column(db.Text)
    stats = db.Column(db.Text)  # JSON representation of stats
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    events = db.relationship('EventCharacter', backref='character', lazy=True, cascade='all, delete-orphan')

class EventCharacter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    character_id = db.Column(db.Integer, db.ForeignKey('character.id'), nullable=False)
    role = db.Column(db.String(50))  # Role in this specific event

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    properties = db.Column(db.Text)  # JSON string for item properties
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# API Routes
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"message": "LoreKeep API is working!"})

# User routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if username or email already exists
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({"error": "Username already exists"}), 400
    
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({"error": "Email already exists"}), 400
    
    # Create new user
    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        password_hash=generate_password_hash(data.get('password'))
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "id": new_user.id,
        "username": new_user.username,
        "message": "User registered successfully!"
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    
    if user and check_password_hash(user.password_hash, data.get('password')):
        session['user_id'] = user.id
        return jsonify({
            "id": user.id,
            "username": user.username,
            "message": "Login successful"
        })
    
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully"})

# LoreMap routes
@app.route('/api/loremaps', methods=['GET'])
def get_lore_maps():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    lore_maps = LoreMap.query.filter_by(user_id=user_id).all()
    result = [{
        "id": lm.id, 
        "title": lm.title, 
        "description": lm.description,
        "created_at": lm.created_at.isoformat(),
        "updated_at": lm.updated_at.isoformat()
    } for lm in lore_maps]
    
    return jsonify(result)

@app.route('/api/loremaps', methods=['POST'])
def create_lore_map():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.json
    
    new_map = LoreMap(
        title=data.get('title', 'Untitled Map'),
        description=data.get('description', ''),
        user_id=user_id
    )
    
    db.session.add(new_map)
    db.session.commit()
    
    return jsonify({
        "id": new_map.id,
        "title": new_map.title,
        "description": new_map.description,
        "message": "Lore map created successfully!"
    }), 201

@app.route('/api/loremaps/<int:id>', methods=['GET'])
def get_lore_map(id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    lore_map = LoreMap.query.filter_by(id=id, user_id=user_id).first()
    if not lore_map:
        return jsonify({"error": "Lore map not found"}), 404
    
    # Get all events for this lore map
    events = Event.query.filter_by(lore_map_id=lore_map.id).all()
    events_data = [{
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "location": event.location,
        "position": {
            "x": event.position_x,
            "y": event.position_y
        },
        "is_party_location": event.is_party_location
    } for event in events]
    
    # Get all connections between events
    connections = EventConnection.query.filter(
        (EventConnection.from_event_id.in_([e.id for e in events])) |
        (EventConnection.to_event_id.in_([e.id for e in events]))
    ).all()
    
    connections_data = [{
        "id": conn.id,
        "from": conn.from_event_id,
        "to": conn.to_event_id,
        "description": conn.description
    } for conn in connections]
    
    result = {
        "id": lore_map.id,
        "title": lore_map.title,
        "description": lore_map.description,
        "created_at": lore_map.created_at.isoformat(),
        "updated_at": lore_map.updated_at.isoformat(),
        "events": events_data,
        "connections": connections_data
    }
    
    return jsonify(result)

# Event routes
@app.route('/api/loremaps/<int:lore_map_id>/events', methods=['POST'])
def create_event(lore_map_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Check if lore map exists and belongs to user
    lore_map = LoreMap.query.filter_by(id=lore_map_id, user_id=user_id).first()
    if not lore_map:
        return jsonify({"error": "Lore map not found"}), 404
    
    data = request.json
    position = data.get('position', {})
    
    new_event = Event(
        title=data.get('title', 'New Event'),
        description=data.get('description', ''),
        location=data.get('location', ''),
        position_x=position.get('x', 0),
        position_y=position.get('y', 0),
        conditions=json.dumps(data.get('conditions', {})),
        is_party_location=data.get('is_party_location', False),
        lore_map_id=lore_map_id
    )
    
    db.session.add(new_event)
    db.session.commit()
    
    return jsonify({
        "id": new_event.id,
        "title": new_event.title,
        "description": new_event.description,
        "location": new_event.location,
        "position": {
            "x": new_event.position_x,
            "y": new_event.position_y
        },
        "is_party_location": new_event.is_party_location,
        "message": "Event created successfully!"
    }), 201

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Get event and check if it belongs to user
    event = Event.query.join(LoreMap).filter(
        Event.id == event_id,
        LoreMap.user_id == user_id
    ).first()
    
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    data = request.json
    position = data.get('position', {})
    
    # Update event fields
    if 'title' in data:
        event.title = data['title']
    if 'description' in data:
        event.description = data['description']
    if 'location' in data:
        event.location = data['location']
    if 'position' in data:
        event.position_x = position.get('x', event.position_x)
        event.position_y = position.get('y', event.position_y)
    if 'conditions' in data:
        event.conditions = json.dumps(data['conditions'])
    if 'is_party_location' in data:
        event.is_party_location = data['is_party_location']
    
    db.session.commit()
    
    return jsonify({
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "location": event.location,
        "position": {
            "x": event.position_x,
            "y": event.position_y
        },
        "is_party_location": event.is_party_location,
        "message": "Event updated successfully!"
    })

@app.route('/api/loremaps/<int:lore_map_id>/connections', methods=['POST'])
def create_connection(lore_map_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Check if lore map exists and belongs to user
    lore_map = LoreMap.query.filter_by(id=lore_map_id, user_id=user_id).first()
    if not lore_map:
        return jsonify({"error": "Lore map not found"}), 404
    
    data = request.json
    from_event_id = data.get('from')
    to_event_id = data.get('to')
    
    # Check if both events exist and belong to this lore map
    from_event = Event.query.filter_by(id=from_event_id, lore_map_id=lore_map_id).first()
    to_event = Event.query.filter_by(id=to_event_id, lore_map_id=lore_map_id).first()
    
    if not from_event or not to_event:
        return jsonify({"error": "One or both events not found"}), 404
    
    # Create connection
    new_connection = EventConnection(
        from_event_id=from_event_id,
        to_event_id=to_event_id,
        description=data.get('description', ''),
        condition=json.dumps(data.get('condition', {}))
    )
    
    db.session.add(new_connection)
    db.session.commit()
    
    return jsonify({
        "id": new_connection.id,
        "from": new_connection.from_event_id,
        "to": new_connection.to_event_id,
        "description": new_connection.description,
        "message": "Connection created successfully!"
    }), 201

# Add a session validation endpoint
@app.route('/api/validate-session', methods=['GET'])
def validate_session():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "message": "Session is valid"
    })

# Main application entry point
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
        
        # Create a test user if none exists
        if not User.query.filter_by(username='test').first():
            test_user = User(
                username='test',
                email='test@example.com',
                password_hash=generate_password_hash('password')
            )
            db.session.add(test_user)
            db.session.commit()
    
    app.run(debug=True)