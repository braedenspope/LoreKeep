# import_monsters_with_actions.py
# Enhanced import script that captures all monster data including actions

import requests
from app import app, db, Character
import time
import json

def import_enhanced_monsters():
    """Import D&D 5e monsters with full action data"""
    
    base_url = "https://www.dnd5eapi.co/api/monsters"
    
    with app.app_context():
        try:
            print("🐲 Fetching monster list from D&D 5e API...")
            response = requests.get(base_url)
            response.raise_for_status()
            monster_list = response.json()
            
            print(f"Found {len(monster_list['results'])} monsters to import")
            
            imported_count = 0
            updated_count = 0
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
                    
                    # Get detailed monster data
                    monster_url = f"https://www.dnd5eapi.co{monster_ref['url']}"
                    print(f"  Processing {monster_name}...")
                    
                    monster_response = requests.get(monster_url)
                    monster_response.raise_for_status()
                    monster_data = monster_response.json()
                    
                    if existing:
                        # Update existing monster with action data
                        update_monster_with_actions(existing, monster_data)
                        updated_count += 1
                        print(f"  ✓ Updated {monster_name} with actions")
                    else:
                        # Create new monster with full data
                        monster = create_monster_with_actions(monster_data)
                        db.session.add(monster)
                        imported_count += 1
                        print(f"  ✓ Imported {monster_name} with actions (CR {monster.challenge_rating})")
                    
                    db.session.commit()
                    
                    # Be nice to the API
                    time.sleep(0.1)
                    
                except Exception as e:
                    failed_count += 1
                    print(f"  ✗ Failed to process {monster_ref['name']}: {str(e)}")
                    db.session.rollback()
                    continue
            
            print(f"\n🎉 Enhanced import complete!")
            print(f"✓ Newly imported: {imported_count} monsters")
            print(f"✓ Updated with actions: {updated_count} monsters")
            print(f"✗ Failed imports: {failed_count} monsters")
            print(f"📊 Total monsters now: {Character.query.filter_by(is_official=True).count()}")
            
        except Exception as e:
            print(f"❌ Error during import: {str(e)}")
            db.session.rollback()

def create_monster_with_actions(data):
    """Create a monster with full action data"""
    
    # Parse challenge rating
    cr = data.get('challenge_rating', 0)
    if isinstance(cr, dict):
        cr_value = str(cr.get('rating', '0'))
    else:
        cr_value = str(cr)
    
    # Handle armor_class
    armor_class = data.get('armor_class', 10)
    if isinstance(armor_class, list) and len(armor_class) > 0:
        armor_class = armor_class[0].get('value', 10)
    elif not isinstance(armor_class, int):
        armor_class = 10
    
    # Get creature info
    creature_type = data.get('type', 'beast')
    size = data.get('size', 'Medium')
    alignment = data.get('alignment', 'neutral')
    
    # Create description
    description = f"{size} {creature_type}"
    if alignment and alignment != 'neutral':
        description += f", {alignment}"
    
    # Extract action data
    actions = extract_actions(data.get('actions', []))
    legendary_actions = extract_actions(data.get('legendary_actions', []))
    special_abilities = extract_actions(data.get('special_abilities', []))
    reactions = extract_actions(data.get('reactions', []))
    
    # Extract other data
    skills = extract_skills(data.get('proficiencies', []))
    damage_resistances = ', '.join(data.get('damage_resistances', []))
    damage_immunities = ', '.join(data.get('damage_immunities', []))
    condition_immunities = ', '.join(data.get('condition_immunities', []))
    senses = format_senses(data.get('senses', {}))
    languages = data.get('languages', '')
    
    # Create the Character object
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
        
        # Combat stats
        armor_class=armor_class,
        hit_points=data.get('hit_points', 1),
        
        # Monster-specific info
        challenge_rating=cr_value,
        creature_type=creature_type,
        
        # Action data (stored as JSON strings)
        actions=json.dumps(actions) if actions else None,
        legendary_actions=json.dumps(legendary_actions) if legendary_actions else None,
        special_abilities=json.dumps(special_abilities) if special_abilities else None,
        reactions=json.dumps(reactions) if reactions else None,
        
        # Other D&D data
        skills=json.dumps(skills) if skills else None,
        damage_resistances=damage_resistances if damage_resistances else None,
        damage_immunities=damage_immunities if damage_immunities else None,
        condition_immunities=condition_immunities if condition_immunities else None,
        senses=senses if senses else None,
        languages=languages if languages else None,
        
        # Source tracking
        is_official=True,
        user_id=None
    )
    
    return monster

def update_monster_with_actions(monster, data):
    """Update an existing monster with action data"""
    
    # Extract action data
    actions = extract_actions(data.get('actions', []))
    legendary_actions = extract_actions(data.get('legendary_actions', []))
    special_abilities = extract_actions(data.get('special_abilities', []))
    reactions = extract_actions(data.get('reactions', []))
    
    # Extract other data
    skills = extract_skills(data.get('proficiencies', []))
    damage_resistances = ', '.join(data.get('damage_resistances', []))
    damage_immunities = ', '.join(data.get('damage_immunities', []))
    condition_immunities = ', '.join(data.get('condition_immunities', []))
    senses = format_senses(data.get('senses', {}))
    languages = data.get('languages', '')
    
    # Update the monster with action data
    monster.actions = json.dumps(actions) if actions else None
    monster.legendary_actions = json.dumps(legendary_actions) if legendary_actions else None
    monster.special_abilities = json.dumps(special_abilities) if special_abilities else None
    monster.reactions = json.dumps(reactions) if reactions else None
    
    # Update other D&D data
    monster.skills = json.dumps(skills) if skills else None
    monster.damage_resistances = damage_resistances if damage_resistances else None
    monster.damage_immunities = damage_immunities if damage_immunities else None
    monster.condition_immunities = condition_immunities if condition_immunities else None
    monster.senses = senses if senses else None
    monster.languages = languages if languages else None

def extract_actions(actions_data):
    """Extract and format action data"""
    if not actions_data:
        return []
    
    actions = []
    for action in actions_data:
        action_info = {
            'name': action.get('name', ''),
            'description': action.get('desc', ''),
        }
        
        # Add attack info if present
        if 'attack_bonus' in action:
            action_info['attack_bonus'] = action['attack_bonus']
        
        # Add damage info if present
        if 'damage' in action:
            action_info['damage'] = action['damage']
        
        # Add DC info if present
        if 'dc' in action:
            action_info['dc'] = action['dc']
        
        actions.append(action_info)
    
    return actions

def extract_skills(proficiencies):
    """Extract skill proficiencies"""
    skills = {}
    for prof in proficiencies:
        if prof.get('proficiency', {}).get('name', '').startswith('Skill:'):
            skill_name = prof['proficiency']['name'].replace('Skill: ', '')
            skills[skill_name] = prof.get('value', 0)
    return skills

def format_senses(senses_data):
    """Format senses data into readable string"""
    if not senses_data:
        return None
    
    senses = []
    for sense, value in senses_data.items():
        if sense == 'passive_perception':
            senses.append(f"passive Perception {value}")
        else:
            senses.append(f"{sense.replace('_', ' ')} {value} ft.")
    
    return ', '.join(senses)

if __name__ == '__main__':
    print("🐲 Starting Enhanced D&D 5e Monster Import...")
    print("This will add actions and abilities to all monsters")
    print("Estimated time: 10-15 minutes\n")
    
    import_enhanced_monsters()
    
    print(f"\n✅ Enhanced import finished!")
    print(f"🎯 Your monsters now have full stat blocks with actions!")