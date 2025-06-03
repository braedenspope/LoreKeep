# migrate_database_sqlite.py - SQLite-compatible migration

from app import app, db
import json
import sqlite3
import os

def migrate_character_table_sqlite():
    """Migrate Character table for SQLite by recreating it"""
    
    with app.app_context():
        try:
            # Get the database file path
            db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
            
            print(f"🔧 Migrating SQLite database: {db_path}")
            
            # Backup existing data
            print("📦 Backing up existing character data...")
            
            # Connect directly to SQLite
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get existing character data
            cursor.execute("SELECT * FROM character")
            existing_chars = cursor.fetchall()
            
            # Get column names
            cursor.execute("PRAGMA table_info(character)")
            old_columns = [col[1] for col in cursor.fetchall()]
            
            print(f"  Found {len(existing_chars)} existing characters")
            print(f"  Current columns: {old_columns}")
            
            # Drop the old table
            print("🗑️  Dropping old character table...")
            cursor.execute("DROP TABLE IF EXISTS character")
            
            # Create new table with all columns
            print("🏗️  Creating new character table...")
            create_table_sql = """
            CREATE TABLE character (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                character_type VARCHAR(50),
                description TEXT,
                stats TEXT,
                user_id INTEGER,
                strength INTEGER DEFAULT 10,
                dexterity INTEGER DEFAULT 10,
                constitution INTEGER DEFAULT 10,
                intelligence INTEGER DEFAULT 10,
                wisdom INTEGER DEFAULT 10,
                charisma INTEGER DEFAULT 10,
                armor_class INTEGER DEFAULT 10,
                hit_points INTEGER DEFAULT 1,
                challenge_rating VARCHAR(10),
                creature_type VARCHAR(50),
                is_official BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES user (id)
            )
            """
            cursor.execute(create_table_sql)
            
            # Restore data with migration
            print("📥 Restoring and migrating character data...")
            migrated_count = 0
            
            for char_data in existing_chars:
                try:
                    # Map old data to new columns
                    old_id, old_name, old_type, old_desc, old_stats, old_user_id = char_data[:6]
                    
                    # Default values for new columns
                    strength = dexterity = constitution = 10
                    intelligence = wisdom = charisma = 10
                    armor_class = 10
                    hit_points = 1
                    challenge_rating = None
                    creature_type = None
                    is_official = False
                    
                    # Try to parse old stats JSON
                    if old_stats and old_stats != '{}':
                        try:
                            stats_data = json.loads(old_stats)
                            strength = stats_data.get('strength', 10)
                            dexterity = stats_data.get('dexterity', 10)
                            constitution = stats_data.get('constitution', 10)
                            intelligence = stats_data.get('intelligence', 10)
                            wisdom = stats_data.get('wisdom', 10)
                            charisma = stats_data.get('charisma', 10)
                            armor_class = stats_data.get('armorClass', 10)
                            hit_points = stats_data.get('hitPoints', 1)
                        except json.JSONDecodeError:
                            print(f"  ⚠️  Could not parse stats for {old_name}")
                    
                    # Set creature type for monsters
                    if old_type == 'Monster':
                        creature_type = 'beast'
                    
                    # Insert migrated data
                    insert_sql = """
                    INSERT INTO character (
                        id, name, character_type, description, stats, user_id,
                        strength, dexterity, constitution, intelligence, wisdom, charisma,
                        armor_class, hit_points, challenge_rating, creature_type, is_official
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """
                    
                    cursor.execute(insert_sql, (
                        old_id, old_name, old_type, old_desc, old_stats, old_user_id,
                        strength, dexterity, constitution, intelligence, wisdom, charisma,
                        armor_class, hit_points, challenge_rating, creature_type, is_official
                    ))
                    
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"  ❌ Error migrating character {old_name}: {str(e)}")
            
            # Commit changes
            conn.commit()
            conn.close()
            
            print(f"✅ Successfully migrated {migrated_count} characters")
            
            # Verify the migration worked
            print("🔍 Verifying migration...")
            cursor = sqlite3.connect(db_path).cursor()
            cursor.execute("SELECT COUNT(*) FROM character")
            total_chars = cursor.fetchone()[0]
            
            cursor.execute("PRAGMA table_info(character)")
            new_columns = [col[1] for col in cursor.fetchall()]
            
            print(f"  Total characters after migration: {total_chars}")
            print(f"  New columns: {new_columns}")
            
            print(f"\n🎉 Migration complete! You can now run the monster import script.")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            raise

def backup_database():
    """Create a backup of the database before migration"""
    with app.app_context():
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        backup_path = f"{db_path}.backup"
        
        if os.path.exists(db_path):
            import shutil
            shutil.copy2(db_path, backup_path)
            print(f"💾 Database backed up to: {backup_path}")
            return backup_path
        return None

if __name__ == '__main__':
    print("🔧 Starting SQLite database migration...")
    print("⚠️  This will recreate the character table with new columns.")
    
    # Create backup first
    backup_path = backup_database()
    if backup_path:
        print(f"✅ Backup created successfully")
    
    try:
        migrate_character_table_sqlite()
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        if backup_path:
            print(f"💡 You can restore from backup: {backup_path}")
        raise