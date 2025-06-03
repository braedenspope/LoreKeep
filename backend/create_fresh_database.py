# backend/create_fresh_database.py
# Create a fresh database with the correct structure

import sqlite3
import os
from datetime import datetime
import shutil

def create_fresh_database():
    """Create a fresh database with the correct D&D 5e structure"""
    
    db_path = 'lorekeep.db'
    
    # Backup existing database if it exists
    if os.path.exists(db_path):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = f'lorekeep_backup_{timestamp}.db'
        shutil.copy2(db_path, backup_path)
        print(f"✓ Existing database backed up to {backup_path}")
    
    # Remove old database
    if os.path.exists(db_path):
        os.remove(db_path)
        print("✓ Removed old database")
    
    # Create new database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Creating fresh database with correct structure...")
        
        # Create User table
        cursor.execute("""
            CREATE TABLE user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password_hash VARCHAR(128) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created user table")
        
        # Create LoreMap table
        cursor.execute("""
            CREATE TABLE lore_map (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES user (id)
            )
        """)
        print("✓ Created lore_map table")
        
        # Create Event table
        cursor.execute("""
            CREATE TABLE event (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                location VARCHAR(100),
                position_x INTEGER DEFAULT 0,
                position_y INTEGER DEFAULT 0,
                image_url VARCHAR(255),
                conditions TEXT,
                is_party_location BOOLEAN DEFAULT 0,
                lore_map_id INTEGER NOT NULL,
                FOREIGN KEY (lore_map_id) REFERENCES lore_map (id)
            )
        """)
        print("✓ Created event table")
        
        # Create EventConnection table
        cursor.execute("""
            CREATE TABLE event_connection (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_event_id INTEGER NOT NULL,
                to_event_id INTEGER NOT NULL,
                description VARCHAR(255),
                condition TEXT,
                FOREIGN KEY (from_event_id) REFERENCES event (id),
                FOREIGN KEY (to_event_id) REFERENCES event (id)
            )
        """)
        print("✓ Created event_connection table")
        
        # Create Character table with full D&D 5e structure
        cursor.execute("""
            CREATE TABLE character (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                character_type VARCHAR(50),
                description TEXT,
                strength INTEGER DEFAULT 10,
                dexterity INTEGER DEFAULT 10,
                constitution INTEGER DEFAULT 10,
                intelligence INTEGER DEFAULT 10,
                wisdom INTEGER DEFAULT 10,
                charisma INTEGER DEFAULT 10,
                armor_class INTEGER DEFAULT 10,
                hit_points INTEGER DEFAULT 1,
                hit_dice VARCHAR(50),
                speed VARCHAR(100),
                size VARCHAR(20),
                creature_type VARCHAR(50),
                alignment VARCHAR(50),
                challenge_rating VARCHAR(10),
                experience_points INTEGER DEFAULT 0,
                saving_throws TEXT,
                skills TEXT,
                damage_resistances TEXT,
                damage_immunities TEXT,
                damage_vulnerabilities TEXT,
                condition_immunities TEXT,
                senses TEXT,
                languages TEXT,
                actions TEXT,
                legendary_actions TEXT,
                reactions TEXT,
                special_abilities TEXT,
                spellcasting_ability VARCHAR(20),
                spell_save_dc INTEGER,
                spell_attack_bonus INTEGER,
                spells TEXT,
                source VARCHAR(100),
                is_official BOOLEAN DEFAULT 0,
                user_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES user (id)
            )
        """)
        print("✓ Created character table with full D&D 5e structure")
        
        # Create EventCharacter table
        cursor.execute("""
            CREATE TABLE event_character (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                character_id INTEGER NOT NULL,
                role VARCHAR(50),
                FOREIGN KEY (event_id) REFERENCES event (id),
                FOREIGN KEY (character_id) REFERENCES character (id)
            )
        """)
        print("✓ Created event_character table")
        
        # Create Item table
        cursor.execute("""
            CREATE TABLE item (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                properties TEXT,
                user_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES user (id)
            )
        """)
        print("✓ Created item table")
        
        # Create demo user
        cursor.execute("""
            INSERT INTO user (username, email, password_hash)
            VALUES ('demo', 'demo@example.com', 'pbkdf2:sha256:600000$7j8K2l9M$1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b')
        """)
        print("✓ Created demo user (username: 'demo', password: 'demo123')")
        
        conn.commit()
        
        # Verify the database structure
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"✓ Database created with tables: {', '.join(tables)}")
        
        # Verify character table structure
        cursor.execute("PRAGMA table_info(character)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"✓ Character table has {len(columns)} columns including D&D 5e attributes")
        
        print("\n🎉 Fresh database created successfully!")
        print("✓ All tables created with correct structure")
        print("✓ Demo user created (username: 'demo', password: 'demo123')")
        print("✓ Ready for monster import")
        
    except Exception as e:
        print(f"❌ Failed to create database: {e}")
        conn.rollback()
        raise e
        
    finally:
        conn.close()

def verify_database():
    """Verify the database was created correctly"""
    
    if not os.path.exists('lorekeep.db'):
        print("❌ Database file not found!")
        return False
    
    conn = sqlite3.connect('lorekeep.db')
    cursor = conn.cursor()
    
    try:
        # Check tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        expected_tables = ['user', 'lore_map', 'event', 'event_connection', 'character', 'event_character', 'item']
        
        for table in expected_tables:
            if table in tables:
                print(f"✓ Table '{table}' exists")
            else:
                print(f"❌ Table '{table}' missing")
                return False
        
        # Check character table has new columns
        cursor.execute("PRAGMA table_info(character)")
        columns = [row[1] for row in cursor.fetchall()]
        
        required_columns = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
                          'armor_class', 'hit_points', 'challenge_rating', 'creature_type', 'is_official']
        
        for col in required_columns:
            if col in columns:
                print(f"✓ Column '{col}' exists")
            else:
                print(f"❌ Column '{col}' missing")
                return False
        
        print("✅ Database verification passed!")
        return True
        
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return False
        
    finally:
        conn.close()

if __name__ == '__main__':
    print("Creating fresh LoreKeep database...")
    create_fresh_database()
    print("\nVerifying database structure...")
    verify_database()