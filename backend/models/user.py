from datetime import datetime
from extensions import db


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
