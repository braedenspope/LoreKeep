from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lorekeep.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)  # Store hashed passwords only
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with LoreMaps (one-to-many)
    lore_maps = db.relationship('LoreMap', backref='author', lazy=True)

class LoreMap(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationship with Events (one-to-many)
    events = db.relationship('Event', backref='lore_map', lazy=True)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(100))
    image_url = db.Column(db.String(255))
    conditions = db.Column(db.Text)  # Can store JSON or structured text for conditions
    is_party_location = db.Column(db.Boolean, default=False)
    lore_map_id = db.Column(db.Integer, db.ForeignKey('lore_map.id'), nullable=False)
    
    # Relationships
    characters = db.relationship('EventCharacter', backref='event', lazy=True)

class Character(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    character_type = db.Column(db.String(50))  # NPC, PC, Monster
    description = db.Column(db.Text)
    stats = db.Column(db.Text)  # JSON representation of stats
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationship with Events (many-to-many)
    events = db.relationship('EventCharacter', backref='character', lazy=True)

class EventCharacter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    character_id = db.Column(db.Integer, db.ForeignKey('character.id'), nullable=False)
    role = db.Column(db.String(50))  # Role in this specific event

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    properties = db.Column(db.Text)  # JSON representation of item properties
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# API Routes
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"message": "LoreKeep API is working!"})

@app.route('/api/loremaps', methods=['GET'])
def get_lore_maps():
    # TODO: Add authentication to get only the current user's maps
    lore_maps = LoreMap.query.all()
    result = [{"id": lm.id, "title": lm.title, "description": lm.description} for lm in lore_maps]
    return jsonify(result)

@app.route('/api/loremaps', methods=['POST'])
def create_lore_map():
    # TODO: Add authentication to assign to current user
    data = request.json
    
    # For testing, use user_id=1
    new_map = LoreMap(
        title=data.get('title', 'Untitled Map'),
        description=data.get('description', ''),
        user_id=1  # Replace with authenticated user's ID
    )
    
    db.session.add(new_map)
    db.session.commit()
    
    return jsonify({
        "id": new_map.id,
        "title": new_map.title,
        "description": new_map.description,
        "message": "Lore map created successfully!"
    }), 201

@app.route('/api/events', methods=['POST'])
def create_event():
    # TODO: Add authentication
    data = request.json
    
    new_event = Event(
        title=data.get('title', 'New Event'),
        description=data.get('description', ''),
        location=data.get('location', ''),
        conditions=data.get('conditions', ''),
        is_party_location=data.get('is_party_location', False),
        lore_map_id=data.get('lore_map_id')
    )
    
    db.session.add(new_event)
    db.session.commit()
    
    return jsonify({
        "id": new_event.id,
        "title": new_event.title,
        "message": "Event created successfully!"
    }), 201

# Main application entry point
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
    app.run(debug=True)