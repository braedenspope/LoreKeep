# backend/import_all_monsters.py
# Import all D&D 5e monsters using the simplified Character model

import requests
from app import app, db, Character
import time
import json

def import_all_dnd_monsters():
    """Import all D&D 5e monsters from the API"""
    
    base_url = "https://www.dnd5eapi.co/api/monsters"
    
    with app.app_context():
        try:
            print("Fetching monster list from D&D 5e API...")
            response = requests.get(base_url)
            response.raise_for_status()
            monster_list = response.json()
            
            print(f"Found {len(monster_list['results'])} monsters to import")
            
            imported_count = 0
            failed_count = 0
            skipped_count = 0
            
            for monster_ref in monster_list['results']:
                try:
                    monster_name = monster_ref['name']
                    
                    # Check if already exists
                    existing = Character.query.filter_by(
                        name=monster_name,
                        character_type='Monster',
                        is_official=True
                    ).first()
                    
                    if existing:
                        print(f"  - {monster_name} already exists, skipping...")
                        skipped_count += 1
                        continue
                    
                    # Get detailed monster data
                    monster_url = f"https://www.dnd5eapi.co{monster_ref['url']}"
                    print(f"  Importing {monster_name}...")
                    
                    monster_response = requests.get(monster_url)
                    monster_response.raise_for_status()
                    monster_data = monster_response.json()
                    
                    # Create simplified monster record
                    monster = create_simplified_monster(monster_data)
                    
                    db.session.add(monster)
                    db.session.commit()
                    
                    imported_count += 1
                    print(f"  ✓ Imported {monster_name} (CR {monster.challenge_rating})")
                    
                    # Be nice to the API
                    time.sleep(0.1)
                    
                except Exception as e:
                    failed_count += 1
                    print(f"  ✗ Failed to import {monster_ref['name']}: {str(e)}")
                    db.session.rollback()
                    continue
            
            print(f"\n🎉 Import complete!")
            print(f"✓ Successfully imported: {imported_count} monsters")
            print(f"- Skipped (already exist): {skipped_count} monsters")
            print(f"✗ Failed imports: {failed_count} monsters")
            print(f"📊 Total monsters now: {Character.query.filter_by(is_official=True).count()}")
            
        except Exception as e:
            print(f"❌ Error during import: {str(e)}")
            db.session.rollback()

def create_simplified_monster(data):
    """Convert API monster data to simplified Character model"""
    
    # Parse challenge rating
    cr = data.get('challenge_rating', 0)
    if isinstance(cr, dict):
        cr_value = str(cr.get('rating', '0'))
    else:
        cr_value = str(cr)
    
    # Get creature type and size info for description
    creature_type = data.get('type', 'beast')
    size = data.get('size', 'Medium')
    alignment = data.get('alignment', 'neutral')
    
    # Create description
    description = f"{size} {creature_type}"
    if alignment and alignment != 'neutral':
        description += f", {alignment}"
    
    # Handle armor_class properly - this was the bug!
    armor_class = data.get('armor_class', 10)
    if isinstance(armor_class, list) and len(armor_class) > 0:
        # Extract the value from the first armor class entry
        armor_class = armor_class[0].get('value', 10)
    elif not isinstance(armor_class, int):
        armor_class = 10
    
    # Create the simplified Character object
    monster = Character(
        name=data['name'],
        character_type='Monster',
        description=description,
        
        # Ability scores
        strength=data.get('strength', 10),
        dexterity=data.get('dexterity', 10),
        constitution=data.get('constitution', 10),
        intelligence=data.get('intelligence', 10),
        wisdom=data.get('wisdom', 10),
        charisma=data.get('charisma', 10),
        
        # Combat stats - use the fixed armor_class
        armor_class=armor_class,
        hit_points=data.get('hit_points', 1),
        
        # Monster-specific info
        challenge_rating=cr_value,
        creature_type=creature_type,
        
        # Source tracking
        is_official=True,
        user_id=None  # Official monsters have no owner
    )
    
    return monster

def show_import_stats():
    """Show statistics about imported monsters"""
    with app.app_context():
        total_chars = Character.query.count()
        official_monsters = Character.query.filter_by(is_official=True, character_type='Monster').count()
        user_chars = Character.query.filter_by(is_official=False).count()
        
        print(f"\n📊 Character Database Stats:")
        print(f"  Total Characters: {total_chars}")
        print(f"  Official Monsters: {official_monsters}")
        print(f"  User Characters: {user_chars}")
        
        # Show some example monsters
        print(f"\n🐉 Sample Monsters:")
        sample_monsters = Character.query.filter_by(
            is_official=True, 
            character_type='Monster'
        ).order_by(Character.name).limit(10).all()
        
        for monster in sample_monsters:
            print(f"  - {monster.name} (CR {monster.challenge_rating}, {monster.creature_type})")
        
        # Show challenge rating distribution
        print(f"\n📈 Challenge Rating Distribution:")
        cr_counts = {}
        monsters = Character.query.filter_by(is_official=True, character_type='Monster').all()
        for monster in monsters:
            cr = monster.challenge_rating or '0'
            cr_counts[cr] = cr_counts.get(cr, 0) + 1
        
        # Show top 10 most common CRs
        sorted_crs = sorted(cr_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        for cr, count in sorted_crs:
            print(f"  CR {cr}: {count} monsters")

if __name__ == '__main__':
    print("🐲 Starting D&D 5e Monster Import...")
    print("This will import 300+ official monsters from the D&D 5e API")
    print("Estimated time: 5-10 minutes\n")
    
    import_all_dnd_monsters()
    show_import_stats()
    
    print(f"\n✅ Import finished! Check your Characters page to see all the monsters.")