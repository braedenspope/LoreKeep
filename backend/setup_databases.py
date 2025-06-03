# setup_database.py - Simple database initialization

from app import app, db, Character, User, LoreMap, Event
import sqlite3
import os

def check_database_status():
    """Check what tables exist in the database"""
    with app.app_context():
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        
        print(f"🔍 Checking database: {db_path}")
        print(f"📁 Database file exists: {os.path.exists(db_path)}")
        
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # List all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            print(f"📊 Found tables: {[table[0] for table in tables]}")
            
            # Check if character table exists and has data
            if ('character',) in tables:
                cursor.execute("SELECT COUNT(*) FROM character")
                char_count = cursor.fetchone()[0]
                print(f"👥 Characters in database: {char_count}")
                
                # Show table structure
                cursor.execute("PRAGMA table_info(character)")
                columns = cursor.fetchall()
                print(f"📋 Character table columns: {[col[1] for col in columns]}")
            else:
                print("❌ No character table found")
            
            conn.close()
        else:
            print("❌ Database file does not exist")

def create_fresh_database():
    """Create a fresh database with all tables"""
    with app.app_context():
        print("🏗️  Creating fresh database...")
        
        # Drop all tables and recreate
        db.drop_all()
        db.create_all()
        
        print("✅ Database created with all tables")
        
        # Verify tables were created
        check_database_status()
        
        return True

def setup_database_for_monsters():
    """Set up database specifically for monster import"""
    with app.app_context():
        try:
            print("🐲 Setting up database for monster import...")
            
            # First check current status
            check_database_status()
            
            # Create all tables (this is safe to run multiple times)
            print("\n🔧 Creating/updating database schema...")
            db.create_all()
            
            # Verify Character table has the right columns
            db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("PRAGMA table_info(character)")
            columns = [col[1] for col in cursor.fetchall()]
            
            required_columns = [
                'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
                'armor_class', 'hit_points', 'challenge_rating', 'creature_type', 'is_official'
            ]
            
            missing_columns = [col for col in required_columns if col not in columns]
            
            if missing_columns:
                print(f"❌ Missing columns: {missing_columns}")
                print("🔧 The Character model in app.py needs to be updated first!")
                
                print("\n📝 Please update your Character class in app.py to include:")
                for col in missing_columns:
                    if col in ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma', 'armor_class', 'hit_points']:
                        print(f"    {col} = db.Column(db.Integer, default=10)")
                    elif col == 'challenge_rating':
                        print(f"    {col} = db.Column(db.String(10))")
                    elif col == 'creature_type':
                        print(f"    {col} = db.Column(db.String(50))")
                    elif col == 'is_official':
                        print(f"    {col} = db.Column(db.Boolean, default=False)")
                
                return False
            else:
                print("✅ All required columns present!")
                print("🎉 Database is ready for monster import!")
                return True
            
        except Exception as e:
            print(f"❌ Error setting up database: {str(e)}")
            return False

if __name__ == '__main__':
    print("🚀 LoreKeep Database Setup")
    print("=" * 50)
    
    # Check current status
    check_database_status()
    
    print("\n" + "=" * 50)
    choice = input("What would you like to do?\n1. Set up for monster import\n2. Create fresh database\n3. Just check status\nChoice (1-3): ")
    
    if choice == "1":
        success = setup_database_for_monsters()
        if success:
            print(f"\n✅ Ready! You can now run: python import_monsters.py")
        else:
            print(f"\n❌ Please update app.py first, then run this script again")
    elif choice == "2":
        create_fresh_database()
        print(f"\n✅ Fresh database created! Update app.py, then run this script again with option 1")
    else:
        print(f"\n👀 Status check complete")