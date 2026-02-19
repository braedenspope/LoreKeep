from flask import Blueprint, jsonify, request, session
from extensions import db
from models import Character
from utils import safe_parse_json

characters_bp = Blueprint('characters', __name__)


@characters_bp.route('/api/characters', methods=['GET'])
def get_characters():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        # Show both user's characters AND official monsters
        characters = Character.query.filter(
            db.or_(
                Character.user_id == user_id,
                db.and_(Character.user_id.is_(None), Character.is_official == True)
            )
        ).order_by(
            Character.is_official.asc(),
            Character.name.asc()
        ).all()

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
                "user_id": char.user_id,
                "actions": char.actions,
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
            result.append(char_data)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@characters_bp.route('/api/characters/<int:id>', methods=['GET'])
def get_character(id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    # Allow access to both user's characters AND official monsters
    character = Character.query.filter(
        Character.id == id,
        db.or_(
            Character.user_id == user_id,
            db.and_(Character.user_id.is_(None), Character.is_official == True)
        )
    ).first()

    if not character:
        return jsonify({"error": "Character not found"}), 404

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


@characters_bp.route('/api/characters', methods=['POST'])
def create_character():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json

    try:
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
            actions=data.get('actions'),
            is_official=data.get('is_official', False),
            user_id=user_id
        )

        db.session.add(new_character)
        db.session.commit()

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
        return jsonify({"error": str(e)}), 500


@characters_bp.route('/api/characters/<int:id>', methods=['PUT'])
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

        if 'actions' in data:
            character.actions = data['actions']

        db.session.commit()

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
        return jsonify({"error": f"Failed to update character: {str(e)}"}), 500


@characters_bp.route('/api/characters/<int:id>', methods=['DELETE'])
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
