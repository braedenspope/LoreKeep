from flask import Blueprint, jsonify, request, session
from extensions import db
from models import Event, LoreMap, Character, EventCharacter

event_characters_bp = Blueprint('event_characters', __name__)


@event_characters_bp.route('/api/events/<int:event_id>/characters', methods=['GET'])
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


@event_characters_bp.route('/api/events/<int:event_id>/characters', methods=['POST'])
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

    # Allow both user's characters AND official monsters
    character = Character.query.filter(
        Character.id == character_id,
        db.or_(
            Character.user_id == user_id,
            db.and_(Character.user_id.is_(None), Character.is_official == True)
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


@event_characters_bp.route('/api/events/<int:event_id>/characters/<int:character_id>', methods=['DELETE'])
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
