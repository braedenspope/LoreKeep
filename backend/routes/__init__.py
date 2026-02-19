from routes.auth import auth_bp
from routes.lore_maps import lore_maps_bp
from routes.events import events_bp
from routes.battle_maps import battle_maps_bp
from routes.characters import characters_bp
from routes.event_characters import event_characters_bp

all_blueprints = [
    auth_bp,
    lore_maps_bp,
    events_bp,
    battle_maps_bp,
    characters_bp,
    event_characters_bp,
]
