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
    is_completed = db.Column(db.Boolean, default=False)
    dm_notes = db.Column(db.Text)
    order_number = db.Column(db.Integer)
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
    connection_type = db.Column(db.String(20), default='default')  # default, success, failure, optional


def run_migrations(db):
    """Add new columns to existing tables safely."""
    migrations = [
        ("event", "is_completed", "BOOLEAN DEFAULT 0"),
        ("event", "dm_notes", "TEXT"),
        ("event", "order_number", "INTEGER"),
        ("event_connection", "connection_type", "VARCHAR(20) DEFAULT 'default'"),
    ]
    for table, column, col_type in migrations:
        try:
            db.session.execute(db.text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
            db.session.commit()
        except Exception:
            db.session.rollback()
