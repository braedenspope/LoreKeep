import os
from datetime import datetime
from flask import Blueprint, jsonify, request, session, send_from_directory, current_app
from werkzeug.utils import secure_filename
from extensions import db
from models import Event, LoreMap
from utils import allowed_file

battle_maps_bp = Blueprint('battle_maps', __name__)


@battle_maps_bp.route('/api/events/<int:event_id>/battle-map', methods=['POST'])
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
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Update the event with the image URL
        event.image_url = f"/api/uploads/{filename}"
        db.session.commit()

        return jsonify({
            "message": "Battle map uploaded successfully",
            "battle_map_url": event.image_url
        })

    return jsonify({"error": "Invalid file type"}), 400


@battle_maps_bp.route('/api/events/<int:event_id>/battle-map', methods=['DELETE'])
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
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

        if os.path.exists(filepath):
            os.remove(filepath)

    # Remove the image URL from the event
    event.image_url = None
    db.session.commit()

    return jsonify({"message": "Battle map deleted successfully"})


@battle_maps_bp.route('/api/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
