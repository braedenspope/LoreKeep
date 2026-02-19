import os

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-fallback-key')

# File upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# Session configuration
SESSION_COOKIE_SECURE = True       # HTTPS only
SESSION_COOKIE_HTTPONLY = True      # Prevent XSS
SESSION_COOKIE_SAMESITE = 'None'   # Allow cross-origin
SESSION_COOKIE_DOMAIN = None       # Don't restrict domain

# Database configuration - handle both local and production
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Fix for Render/Heroku postgres URL format
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = database_url
else:
    # Local development fallback
    SQLALCHEMY_DATABASE_URI = 'sqlite:///lorekeep.db'

SQLALCHEMY_TRACK_MODIFICATIONS = False

# CORS allowed origins
FRONTEND_URLS = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://lore-keep.vercel.app',
    os.environ.get('FRONTEND_URL'),
]
# Remove None values
FRONTEND_URLS = [url for url in FRONTEND_URLS if url]
