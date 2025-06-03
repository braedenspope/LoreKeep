# backend/fix_database.py
# Complete database migration to new character structure

import sqlite3
import json
import os
import shutil
from datetime import datetime

def fix_database_migration():
    """Complete the database migration properly"""
    
    db_path = 'lorekeep.db'
    
    # Create timestamped backup
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f'lorekeep_backup_{timestamp}.db'
    
    if os.path.exists(db_path):
        shutil.copy2(db_path, backup_path)
        print(f"✓ Database backed up to {backup_path}")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current structure
        cursor.execute("PRAGMA table_info(character)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        if 'strength' in columns:
            print("✓ Database already has new structure!")
            return
        
        print("Starting database migration...")
        
        # Step 1: Get existing data
        cursor.execute("SELECT id, name, character_type, description, stats, user_id FROM character")
        old_characters = cursor.fetchall()
        print(f"Found {len(old_characters)} existing characters")
        
        # Step 2: Drop existing character table
        cursor.execute("DROP TABLE character")
        print("✓ Dropped old character table")
        
        # Step 3: Create new character table with all required columns
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
        print("✓ Created new character table with full D&D structure")
        
        # Step 4: Migrate existing character data
        for char_data in old_characters:
            old_id, name, char_type, description, old_stats, user_id = char_data
            
            # Parse old stats
            stats = {}
            if old_stats:
                try:
                    stats = json.loads(old_stats) if isinstance(old_stats, str) else old_stats
                except:
                    stats = {}
            
            # Set defaults based on character type
            if char_type == 'Monster':
                default_size = 'Medium'
                default_creature_type = 'beast'
                default_cr = '1'
            else:
                default_size = 'Medium'
                default_creature_type = 'humanoid'
                default_cr = '0'
            
            # Insert with new structure
            cursor.execute("""
                INSERT INTO character (
                    name, character_type, description, user_id,
                    strength, dexterity, constitution, intelligence, wisdom, charisma,
                    armor_class, hit_points, hit_dice, speed,
                    size, creature_type, alignment, challenge_rating, experience_points,
                    is_official, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                name, char_type, description, user_id,
                stats.get('strength', 10),
                stats.get('dexterity', 10),
                stats.get('constitution', 10),
                stats.get('intelligence', 10),
                stats.get('wisdom', 10),
                stats.get('charisma', 10),
                stats.get('armorClass', 10),
                stats.get('hitPoints', 1),
                '1d4',  # Default hit dice
                '30 ft.',  # Default speed
                default_size,
                default_creature_type,
                'neutral',  # Default alignment
                default_cr,
                0,  # Default XP
                0,  # is_official = False for user characters
                'User Created'
            ))
        
        conn.commit()
        print(f"✓ Successfully migrated {len(old_characters)} characters")
        
        # Verify the new structure
        cursor.execute("PRAGMA table_info(character)")
        new_columns = [row[1] for row in cursor.fetchall()]
        print(f"✓ New table has {len(new_columns)} columns including: strength, dexterity, etc.")
        
        # Test that we can query the new structure
        cursor.execute("SELECT COUNT(*) FROM character")
        count = cursor.fetchone()[0]
        print(f"✓ Verified: {count} characters in migrated database")
        
        print("\n🎉 Database migration completed successfully!")
        print("You can now run the monster import script.")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        
        # Restore from backup if something went wrong
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, db_path)
            print(f"Database restored from backup: {backup_path}")
        
        raise e
        
    finally:
        conn.close()

if __name__ == '__main__':
    fix_database_migration()