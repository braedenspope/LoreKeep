from flask import Flask, jsonify, request, session, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import json

# Initialize Flask app
app = Flask(__name__)

# Add this after app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-fallback-key')

# File upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Add these session configuration settings
app.config['SESSION_COOKIE_SECURE'] = True  # HTTPS only
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent XSS
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allow cross-origin
app.config['SESSION_COOKIE_DOMAIN'] = None  # Don't restrict domain

# Database configuration - handle both local and production
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Fix for Render/Heroku postgres URL format
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Local development fallback
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lorekeep.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure CORS for production
frontend_urls = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://lore-keep.vercel.app',  # This is your actual Vercel URL
    os.environ.get('FRONTEND_URL')  # Keep this as backup
]

# Remove None values
frontend_urls = [url for url in frontend_urls if url]

print(f"CORS allowed origins: {frontend_urls}")  # Debug log

CORS(app, 
     origins=frontend_urls,
     allow_headers=['Content-Type', 'Authorization'], 
     expose_headers=['Set-Cookie'],
     allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     supports_credentials=True)

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
    character_type = db.Column(db.String(50))
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # D&D 5e Ability Scores
    strength = db.Column(db.Integer, default=10)
    dexterity = db.Column(db.Integer, default=10)
    constitution = db.Column(db.Integer, default=10)
    intelligence = db.Column(db.Integer, default=10)
    wisdom = db.Column(db.Integer, default=10)
    charisma = db.Column(db.Integer, default=10)
    
    # Combat Stats
    armor_class = db.Column(db.Integer, default=10)
    hit_points = db.Column(db.Integer, default=10)
    
    # Monster-specific fields
    challenge_rating = db.Column(db.String(10))
    creature_type = db.Column(db.String(50))
    
    # Official vs User-created
    is_official = db.Column(db.Boolean, default=False)
    
    # ADD THESE NEW FIELDS FOR ACTIONS:
    actions = db.Column(db.Text)  # JSON string for actions like attacks
    legendary_actions = db.Column(db.Text)  # JSON string for legendary actions
    special_abilities = db.Column(db.Text)  # JSON string for special abilities
    reactions = db.Column(db.Text)  # JSON string for reactions
    
    # Additional D&D data
    skills = db.Column(db.Text)  # JSON string for skills
    damage_resistances = db.Column(db.Text)  # Text field for resistances
    damage_immunities = db.Column(db.Text)  # Text field for immunities
    condition_immunities = db.Column(db.Text)  # Text field for condition immunities
    senses = db.Column(db.Text)  # Text field for senses
    languages = db.Column(db.Text)  # Text field for languages
    
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

@app.route('/api/loremaps/<int:id>', methods=['DELETE'])
def delete_lore_map(id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Check if lore map exists and belongs to user
    lore_map = LoreMap.query.filter_by(id=id, user_id=user_id).first()
    if not lore_map:
        return jsonify({"error": "Campaign not found"}), 404
    
    try:
        # Delete the lore map (cascade will handle events and connections)
        db.session.delete(lore_map)
        db.session.commit()
        
        return jsonify({
            "message": "Campaign deleted successfully!"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete campaign"}), 500

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
        "is_party_location": event.is_party_location,
        "battle_map_url": event.image_url,  # Include battle map URL
        "conditions": json.loads(event.conditions) if event.conditions else []
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
    # Don't override battle_map_url unless explicitly provided
    # This prevents the LoreMapEditor save from clearing the image
    if 'battle_map_url' in data and data['battle_map_url'] is not None:
        event.image_url = data['battle_map_url']
    
    # Update the lore map's updated_at timestamp
    event.lore_map.updated_at = datetime.utcnow()
    
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
        "battle_map_url": event.image_url,
        "conditions": json.loads(event.conditions) if event.conditions else [],
        "message": "Event updated successfully!"
    })

# Battle Map routes
@app.route('/api/events/<int:event_id>/battle-map', methods=['POST'])
def upload_battle_map(event_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Check if event belongs to user
    event = Event.query.join(LoreMap).filter(
        Event.id == event_id,
        LoreMap.user_id == user_id
    ).first()
    
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    if 'battle_map' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['battle_map']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        # Create a unique filename
        filename = secure_filename(file.filename)
        timestamp = str(int(datetime.utcnow().timestamp()))
        filename = f"{timestamp}_{filename}"
        
        # Save the file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Update the event with the image URL
        event.image_url = f"/api/uploads/{filename}"
        db.session.commit()
        
        return jsonify({
            "message": "Battle map uploaded successfully",
            "battle_map_url": event.image_url
        })
    
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/events/<int:event_id>/battle-map', methods=['DELETE'])
def delete_battle_map(event_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Check if event belongs to user
    event = Event.query.join(LoreMap).filter(
        Event.id == event_id,
        LoreMap.user_id == user_id
    ).first()
    
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    # Delete the file if it exists
    if event.image_url:
        filename = event.image_url.split('/')[-1]
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if os.path.exists(filepath):
            os.remove(filepath)
    
    # Remove the image URL from the event
    event.image_url = None
    db.session.commit()
    
    return jsonify({"message": "Battle map deleted successfully"})

@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

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

# FIXED Character routes - Now supports official monsters
@app.route('/api/characters', methods=['GET'])
def get_characters():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        # Show both user's characters AND official monsters
        characters = Character.query.filter(
            db.or_(
                Character.user_id == user_id,  # User's custom characters
                db.and_(Character.user_id.is_(None), Character.is_official == True)  # Official monsters
            )
        ).order_by(
            Character.is_official.asc(),  # User characters first
            Character.name.asc()  # Then alphabetical
        ).all()
        
        def safe_parse_json(json_str):
            """Safely parse JSON with better error handling"""
            if not json_str:
                return None
            
            # Check if it's already a valid object
            if isinstance(json_str, (list, dict)):
                return json_str
            
            # Check for common invalid values
            if json_str in ['[object Object]', 'undefined', 'null', '']:
                return None
            
            try:
                return json.loads(json_str)
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Warning: Could not parse JSON: {json_str[:100]}... Error: {e}")
                return None
        
        result = []
        for char in characters:
            char_data = {
                "id": char.id,
                "name": char.name,
                "character_type": char.character_type,
                "description": char.description,
                "strength": char.strength or 10,
                "dexterity": char.dexterity or 10,
                "constitution": char.constitution or 10,
                "intelligence": char.intelligence or 10,
                "wisdom": char.wisdom or 10,
                "charisma": char.charisma or 10,
                "armor_class": char.armor_class or 10,
                "hit_points": char.hit_points or 1,
                "challenge_rating": char.challenge_rating,
                "creature_type": char.creature_type,
                "is_official": char.is_official or False,
                "user_id": char.user_id,  # Will be None for official monsters
                
                # IMPORTANT: Include the raw actions field for custom characters
                "actions": char.actions,  # Keep this as raw string/data
                
                # Safely parse other action data with fallbacks for official monsters
                "legendary_actions": safe_parse_json(char.legendary_actions),
                "special_abilities": safe_parse_json(char.special_abilities),
                "reactions": safe_parse_json(char.reactions),
                "skills": safe_parse_json(char.skills),
                "damage_resistances": char.damage_resistances,
                "damage_immunities": char.damage_immunities,
                "condition_immunities": char.condition_immunities,
                "senses": char.senses,
                "languages": char.languages
            }
            
            # Debug log for custom characters
            if not char.is_official:
                print(f"Custom character {char.name} (ID: {char.id}) actions: {char.actions}")
            
            result.append(char_data)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_characters: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/characters/<int:id>', methods=['GET'])
def get_character(id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # FIXED: Allow access to both user's characters AND official monsters
    character = Character.query.filter(
        Character.id == id,
        db.or_(
            Character.user_id == user_id,  # User's custom characters
            db.and_(Character.user_id.is_(None), Character.is_official == True)  # Official monsters
        )
    ).first()
    
    if not character:
        return jsonify({"error": "Character not found"}), 404
    
    def safe_parse_json(json_str):
        """Safely parse JSON with better error handling"""
        if not json_str:
            return None
        
        # Check if it's already a valid object
        if isinstance(json_str, (list, dict)):
            return json_str
        
        # Check for common invalid values
        if json_str in ['[object Object]', 'undefined', 'null', '']:
            return None
        
        try:
            return json.loads(json_str)
        except (json.JSONDecodeError, TypeError) as e:
            print(f"Warning: Could not parse JSON for character {character.name}: {json_str[:100]}... Error: {e}")
            return None
    
    return jsonify({
        "id": character.id,
        "name": character.name,
        "character_type": character.character_type,
        "description": character.description,
        "user_id": character.user_id,
        "is_official": character.is_official or False,
        "strength": character.strength or 10,
        "dexterity": character.dexterity or 10,
        "constitution": character.constitution or 10,
        "intelligence": character.intelligence or 10,
        "wisdom": character.wisdom or 10,
        "charisma": character.charisma or 10,
        "armor_class": character.armor_class or 10,
        "hit_points": character.hit_points or 1,
        "creature_type": character.creature_type,
        "challenge_rating": character.challenge_rating,
        
        # Safely parse action fields with fallbacks
        "actions": safe_parse_json(character.actions),
        "legendary_actions": safe_parse_json(character.legendary_actions),
        "special_abilities": safe_parse_json(character.special_abilities),
        "reactions": safe_parse_json(character.reactions),
        "skills": safe_parse_json(character.skills),
        "damage_resistances": character.damage_resistances,
        "damage_immunities": character.damage_immunities,
        "condition_immunities": character.condition_immunities,
        "senses": character.senses,
        "languages": character.languages
    })

@app.route('/api/characters', methods=['POST'])
def create_character():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.json
    
    try:
        print(f"Creating character with data: {data}")  # Debug log
        
        # Create character with individual stat fields
        new_character = Character(
            name=data.get('name', 'New Character'),
            character_type=data.get('character_type', 'NPC'),
            description=data.get('description', ''),
            strength=data.get('strength', 10),
            dexterity=data.get('dexterity', 10),
            constitution=data.get('constitution', 10),
            intelligence=data.get('intelligence', 10),
            wisdom=data.get('wisdom', 10),
            charisma=data.get('charisma', 10),
            armor_class=data.get('armor_class', 10),
            hit_points=data.get('hit_points', 1),
            challenge_rating=data.get('challenge_rating', '0'),
            creature_type=data.get('creature_type', 'humanoid'),
            actions=data.get('actions'),  # Store actions as JSON string (can be None)
            is_official=data.get('is_official', False),
            user_id=user_id
        )
        
        db.session.add(new_character)
        db.session.commit()
        
        print(f"Character created with ID: {new_character.id}, actions: {new_character.actions}")  # Debug log
        
        return jsonify({
            "id": new_character.id,
            "name": new_character.name,
            "character_type": new_character.character_type,
            "description": new_character.description,
            "strength": new_character.strength,
            "dexterity": new_character.dexterity,
            "constitution": new_character.constitution,
            "intelligence": new_character.intelligence,
            "wisdom": new_character.wisdom,
            "charisma": new_character.charisma,
            "armor_class": new_character.armor_class,
            "hit_points": new_character.hit_points,
            "challenge_rating": new_character.challenge_rating,
            "creature_type": new_character.creature_type,
            "actions": new_character.actions,
            "is_official": new_character.is_official,
            "user_id": new_character.user_id,
            "message": "Character created successfully!"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating character: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/characters/<int:id>', methods=['PUT'])
def update_character(id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Only allow users to edit their own characters (not official monsters)
    character = Character.query.filter_by(id=id, user_id=user_id).first()
    if not character:
        return jsonify({"error": "Character not found or access denied"}), 404
    
    data = request.json
    
    try:
        print(f"Updating character {id} with data: {data}")  # Debug log
        print(f"Actions in request: {data.get('actions')}")  # Debug log
        
        # Update character fields
        character.name = data.get('name', character.name)
        character.character_type = data.get('character_type', character.character_type)
        character.description = data.get('description', character.description)
        character.strength = data.get('strength', character.strength)
        character.dexterity = data.get('dexterity', character.dexterity)
        character.constitution = data.get('constitution', character.constitution)
        character.intelligence = data.get('intelligence', character.intelligence)
        character.wisdom = data.get('wisdom', character.wisdom)
        character.charisma = data.get('charisma', character.charisma)
        character.armor_class = data.get('armor_class', character.armor_class)
        character.hit_points = data.get('hit_points', character.hit_points)
        character.creature_type = data.get('creature_type', character.creature_type)
        character.challenge_rating = data.get('challenge_rating', character.challenge_rating)
        
        # Update actions if provided (including setting to None if empty)
        if 'actions' in data:
            character.actions = data['actions']
            print(f"Updated character actions to: {character.actions}")  # Debug log
        
        db.session.commit()
        
        print(f"Character {id} updated successfully, final actions: {character.actions}")  # Debug log
        
        return jsonify({
            "id": character.id,
            "name": character.name,
            "character_type": character.character_type,
            "description": character.description,
            "strength": character.strength,
            "dexterity": character.dexterity,
            "constitution": character.constitution,
            "intelligence": character.intelligence,
            "wisdom": character.wisdom,
            "charisma": character.charisma,
            "armor_class": character.armor_class,
            "hit_points": character.hit_points,
            "challenge_rating": character.challenge_rating,
            "creature_type": character.creature_type,
            "actions": character.actions,
            "is_official": character.is_official,
            "user_id": character.user_id,
            "message": "Character updated successfully!"
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating character: {e}")
        return jsonify({"error": f"Failed to update character: {str(e)}"}), 500

@app.route('/api/characters/<int:id>', methods=['DELETE'])
def delete_character(id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    character = Character.query.filter_by(id=id, user_id=user_id).first()
    if not character:
        return jsonify({"error": "Character not found"}), 404
    
    try:
        db.session.delete(character)
        db.session.commit()
        return jsonify({"message": "Character deleted successfully!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# FIXED Event Character routes - Now supports official monsters
@app.route('/api/events/<int:event_id>/characters', methods=['GET'])
def get_event_characters(event_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Check if event belongs to user
    event = Event.query.join(LoreMap).filter(Event.id == event_id, LoreMap.user_id == user_id).first()
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    # Get all characters associated with this event
    event_characters = db.session.query(EventCharacter, Character).join(
        Character, EventCharacter.character_id == Character.id
    ).filter(EventCharacter.event_id == event_id).all()
    
    result = []
    for event_char, character in event_characters:
        result.append({
            "id": event_char.id,
            "event_id": event_char.event_id,
            "character_id": event_char.character_id,
            "role": event_char.role,
            "character_name": character.name,
            "character_type": character.character_type,
            "is_official": character.is_official or False
        })
    
    return jsonify(result)

@app.route('/api/events/<int:event_id>/characters', methods=['POST'])
def add_character_to_event(event_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Check if event belongs to user
    event = Event.query.join(LoreMap).filter(Event.id == event_id, LoreMap.user_id == user_id).first()
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    data = request.json
    character_id = data.get('character_id')
    
    # FIXED: Allow both user's characters AND official monsters
    character = Character.query.filter(
        Character.id == character_id,
        db.or_(
            Character.user_id == user_id,  # User's custom characters
            db.and_(Character.user_id.is_(None), Character.is_official == True)  # Official monsters
        )
    ).first()
    
    if not character:
        return jsonify({"error": "Character not found or access denied"}), 404
    
    # Check if character is already in event
    existing = EventCharacter.query.filter_by(event_id=event_id, character_id=character_id).first()
    if existing:
        return jsonify({"error": "Character already in event"}), 400
    
    # Add character to event
    event_character = EventCharacter(
        event_id=event_id,
        character_id=character_id,
        role=data.get('role', 'present')
    )
    
    try:
        db.session.add(event_character)
        db.session.commit()
        
        return jsonify({
            "id": event_character.id,
            "event_id": event_character.event_id,
            "character_id": event_character.character_id,
            "role": event_character.role,
            "message": "Character added to event!"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/events/<int:event_id>/characters/<int:character_id>', methods=['DELETE'])
def remove_character_from_event(event_id, character_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Check if event belongs to user
    event = Event.query.join(LoreMap).filter(Event.id == event_id, LoreMap.user_id == user_id).first()
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    # Find and delete the event character relationship
    event_character = EventCharacter.query.filter_by(event_id=event_id, character_id=character_id).first()
    if not event_character:
        return jsonify({"error": "Character not in event"}), 404
    
    try:
        db.session.delete(event_character)
        db.session.commit()
        
        return jsonify({
            "message": "Character removed from event!"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

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
            print("Demo user created: username='demo', password='demo123'")
    
    app.run(host='0.0.0.0', port=port, debug=False)