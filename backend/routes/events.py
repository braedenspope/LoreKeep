import json
from datetime import datetime
from flask import Blueprint, jsonify, request, session
from extensions import db
from models import LoreMap, Event, EventConnection

events_bp = Blueprint('events', __name__)


@events_bp.route('/api/loremaps/<int:lore_map_id>/events', methods=['POST'])
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


@events_bp.route('/api/events/<int:event_id>', methods=['PUT'])
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
    if 'is_completed' in data:
        event.is_completed = data['is_completed']
    if 'dm_notes' in data:
        event.dm_notes = data['dm_notes']
    if 'order_number' in data:
        event.order_number = data['order_number']
    # Don't override battle_map_url unless explicitly provided
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
        "is_completed": event.is_completed,
        "dm_notes": event.dm_notes,
        "order_number": event.order_number,
        "battle_map_url": event.image_url,
        "conditions": json.loads(event.conditions) if event.conditions else [],
        "message": "Event updated successfully!"
    })


@events_bp.route('/api/loremaps/<int:lore_map_id>/connections', methods=['POST'])
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
        "connection_type": new_connection.connection_type or 'default',
        "message": "Connection created successfully!"
    }), 201


@events_bp.route('/api/events/<int:event_id>/toggle-complete', methods=['POST'])
def toggle_event_complete(event_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    event = Event.query.join(LoreMap).filter(
        Event.id == event_id,
        LoreMap.user_id == user_id
    ).first()

    if not event:
        return jsonify({"error": "Event not found"}), 404

    event.is_completed = not event.is_completed
    db.session.commit()

    return jsonify({
        "id": event.id,
        "is_completed": event.is_completed,
        "message": "Event completion toggled!"
    })
