import requests
from app import app, db, Character
from import_monsters_with_actions import create_monster_with_actions
import json

with app.app_context():
    # Get a dragon from the API
    print("Fetching dragon data...")
    response = requests.get('https://www.dnd5eapi.co/api/monsters/adult-red-dragon')
    dragon_data = response.json()
    
    print(f"Got data for: {dragon_data['name']}")
    
    # Create the monster with actions
    dragon = create_monster_with_actions(dragon_data)
    db.session.add(dragon)
    db.session.commit()
    
    print(f'✅ Created: {dragon.name}')
    
    if dragon.actions:
        actions = json.loads(dragon.actions)
        print(f'🎯 Actions: {len(actions)} actions found')
        for i, action in enumerate(actions[:3]):  # Show first 3 actions
            print(f'  {i+1}. {action["name"]}')
            # Show first 80 characters of description
            desc = action["description"][:80] + "..." if len(action["description"]) > 80 else action["description"]
            print(f'     {desc}')
    else:
        print('❌ No actions found')
    
    if dragon.special_abilities:
        abilities = json.loads(dragon.special_abilities)
        print(f'✨ Special Abilities: {len(abilities)} found')
        for ability in abilities[:2]:
            print(f'  - {ability["name"]}')