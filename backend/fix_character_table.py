# backend/fix_character_table.py
# Add missing D&D columns to the character table

import sqlite3
import os
import shutil
from datetime import datetime

def fix_character_table():
    """Add missing D&D columns to character table"""
    
    db_path = 'lorekeep.db'
    
    # Create backup
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f'lorekeep_backup_fix_{timestamp}.db'
    shutil.copy2(db_path, backup_path)
    print(f"✓ Database backed up to {backup_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current structure
        cursor.execute("PRAGMA table_info(character)")
        current_columns = [row[1] for row in cursor.fetchall()]
        print(f"Current columns: {current_columns}")
        
        # List of all required D&D columns
        required_columns = [
            ('strength', 'INTEGER DEFAULT 10'),
            ('dexterity', 'INTEGER DEFAULT 10'),
            ('constitution', 'INTEGER DEFAULT 10'),
            ('intelligence', 'INTEGER DEFAULT 10'),
            ('wisdom', 'INTEGER DEFAULT 10'),
            ('charisma', 'INTEGER DEFAULT 10'),
            ('armor_class', 'INTEGER DEFAULT 10'),
            ('hit_points', 'INTEGER DEFAULT 1'),
            ('hit_dice', 'VARCHAR(50)'),
            ('speed', 'VARCHAR(100)'),
            ('size', 'VARCHAR(20)'),
            ('creature_type', 'VARCHAR(50)'),
            ('alignment', 'VARCHAR(50)'),
            ('challenge_rating', 'VARCHAR(10)'),
            ('experience_points', 'INTEGER DEFAULT 0'),
            ('saving_throws', 'TEXT'),
            ('skills', 'TEXT'),
            ('damage_resistances', 'TEXT'),
            ('damage_immunities', 'TEXT'),
            ('damage_vulnerabilities', 'TEXT'),
            ('condition_immunities', 'TEXT'),
            ('senses', 'TEXT'),
            ('languages', 'TEXT'),
            ('actions', 'TEXT'),
            ('legendary_actions', 'TEXT'),
            ('reactions', 'TEXT'),
            ('special_abilities', 'TEXT'),
            ('spellcasting_ability', 'VARCHAR(20)'),
            ('spell_save_dc', 'INTEGER'),
            ('spell_attack_bonus', 'INTEGER'),
            ('spells', 'TEXT'),
            ('source', 'VARCHAR(100)'),
            ('is_official', 'BOOLEAN DEFAULT 0')
        ]
        
        # Add missing columns
        added_count = 0
        for col_name, col_type in required_columns:
            if col_name not in current_columns:
                try:
                    cursor.execute(f"ALTER TABLE character ADD COLUMN {col_name} {col_type}")
                    print(f"✓ Added column: {col_name}")
                    added_count += 1
                except sqlite3.OperationalError as e:
                    print(f"⚠ Could not add {col_name}: {e}")
        
        if added_count == 0:
            print("✓ All required columns already exist!")
        else:
            print(f"✓ Added {added_count} missing columns")
        
        conn.commit()
        
        # Verify final structure
        cursor.execute("PRAGMA table_info(character)")
        final_columns = [row[1] for row in cursor.fetchall()]
        print(f"✓ Final table has {len(final_columns)} columns")
        
        # Check if we have all required columns now
        missing = [col for col, _ in required_columns if col not in final_columns]
        if missing:
            print(f"❌ Still missing: {missing}")
        else:
            print("✅ All D&D 5e columns present!")
        
        # Test creating a character
        test_insert = """
            INSERT INTO character (
                name, character_type, description, user_id,
                strength, dexterity, constitution, intelligence, wisdom, charisma,
                armor_class, hit_points, size, creature_type, alignment, challenge_rating, 
                experience_points, is_official, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        cursor.execute(test_insert, (
            'Test Character', 'NPC', 'Test description', 1,
            10, 10, 10, 10, 10, 10,  # ability scores
            10, 1, 'Medium', 'humanoid', 'neutral', '0',  # combat/monster stats
            0, 0, 'Test Creation'  # xp, is_official, source
        ))
        
        # Get the test character ID and then delete it
        test_id = cursor.lastrowid
        cursor.execute("DELETE FROM character WHERE id = ?", (test_id,))
        
        conn.commit()
        print("✅ Test character creation successful!")
        
    except Exception as e:
        print(f"❌ Error fixing character table: {e}")
        conn.rollback()
        
        # Restore backup
        conn.close()
        shutil.copy2(backup_path, db_path)
        print(f"Database restored from backup: {backup_path}")
        return False
        
    finally:
        conn.close()
    
    return True

if __name__ == '__main__':
    print("Fixing character table structure...")
    success = fix_character_table()
    
    if success:
        print("\n🎉 Character table fixed successfully!")
        print("You can now create characters and import monsters.")
    else:
        print("\n❌ Failed to fix character table.")
        print("You may need to recreate the database from scratch.")