import json
from config import ALLOWED_EXTENSIONS


def safe_parse_json(json_str):
    """Safely parse a JSON string, returning None for invalid input."""
    if not json_str:
        return None
    if isinstance(json_str, (list, dict)):
        return json_str
    if json_str in ['[object Object]', 'undefined', 'null', '']:
        return None
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return None


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
