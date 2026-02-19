from extensions import db


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

    # Actions
    actions = db.Column(db.Text)  # JSON string for actions like attacks
    legendary_actions = db.Column(db.Text)  # JSON string for legendary actions
    special_abilities = db.Column(db.Text)  # JSON string for special abilities
    reactions = db.Column(db.Text)  # JSON string for reactions

    # Additional D&D data
    skills = db.Column(db.Text)  # JSON string for skills
    damage_resistances = db.Column(db.Text)
    damage_immunities = db.Column(db.Text)
    condition_immunities = db.Column(db.Text)
    senses = db.Column(db.Text)
    languages = db.Column(db.Text)

    # Relationships
    events = db.relationship('EventCharacter', backref='character', lazy=True, cascade='all, delete-orphan')


class EventCharacter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    character_id = db.Column(db.Integer, db.ForeignKey('character.id'), nullable=False)
    role = db.Column(db.String(50))  # Role in this specific event
