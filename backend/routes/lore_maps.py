import json
from flask import Blueprint, jsonify, request, session
from extensions import db
from models import LoreMap, Event, EventConnection
from datetime import datetime

lore_maps_bp = Blueprint('lore_maps', __name__)


@lore_maps_bp.route('/api/loremaps', methods=['GET'])
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


@lore_maps_bp.route('/api/loremaps', methods=['POST'])
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


@lore_maps_bp.route('/api/loremaps/<int:id>', methods=['DELETE'])
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


@lore_maps_bp.route('/api/loremaps/<int:id>', methods=['GET'])
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
        "is_completed": event.is_completed or False,
        "dm_notes": event.dm_notes or '',
        "order_number": event.order_number,
        "battle_map_url": event.image_url,
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
        "description": conn.description,
        "connection_type": conn.connection_type or 'default'
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


@lore_maps_bp.route('/api/connections/<int:connection_id>', methods=['PUT'])
def update_connection(connection_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    conn = EventConnection.query.get(connection_id)
    if not conn:
        return jsonify({"error": "Connection not found"}), 404

    # Verify ownership through the from_event's lore map
    event = Event.query.join(LoreMap).filter(
        Event.id == conn.from_event_id,
        LoreMap.user_id == user_id
    ).first()
    if not event:
        return jsonify({"error": "Connection not found"}), 404

    data = request.json
    if 'description' in data:
        conn.description = data['description']
    if 'connection_type' in data:
        conn.connection_type = data['connection_type']

    event.lore_map.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "id": conn.id,
        "from": conn.from_event_id,
        "to": conn.to_event_id,
        "description": conn.description,
        "connection_type": conn.connection_type or 'default'
    })


@lore_maps_bp.route('/api/connections/<int:connection_id>', methods=['DELETE'])
def delete_connection(connection_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    conn = EventConnection.query.get(connection_id)
    if not conn:
        return jsonify({"error": "Connection not found"}), 404

    event = Event.query.join(LoreMap).filter(
        Event.id == conn.from_event_id,
        LoreMap.user_id == user_id
    ).first()
    if not event:
        return jsonify({"error": "Connection not found"}), 404

    db.session.delete(conn)
    db.session.commit()

    return jsonify({"message": "Connection deleted successfully!"})
