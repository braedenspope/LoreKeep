from extensions import db


class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    properties = db.Column(db.Text)  # JSON string for item properties
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
