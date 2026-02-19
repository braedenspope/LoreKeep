from extensions import db


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
