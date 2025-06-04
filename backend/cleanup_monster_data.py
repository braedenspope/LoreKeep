# backend/cleanup_monster_data.py
# Clean up corrupted JSON data in monster records

from app import app, db, Character
import json

def cleanup_monster_json_data():
    """Clean up corrupted JSON data in monster records"""
    
    with app.app_context():
        try:
            print("🧹 Cleaning up monster JSON data...")
            
            # Get all official monsters
            monsters = Character.query.filter_by(is_official=True, character_type='Monster').all()
            print(f"Found {len(monsters)} official monsters to check")
            
            cleaned_count = 0
            corrupted_count = 0
            
            for monster in monsters:
                monster_updated = False
                
                # Check and fix each JSON field
                json_fields = ['actions', 'legendary_actions', 'special_abilities', 'reactions', 'skills']
                
                for field_name in json_fields:
                    field_value = getattr(monster, field_name)
                    
                    if field_value:
                        # Check for common corruption patterns
                        if field_value in ['[object Object]', 'undefined', 'null', '']:
                            print(f"  Cleaning {field_name} for {monster.name}: was '{field_value}'")
                            setattr(monster, field_name, None)
                            monster_updated = True
                            corrupted_count += 1
                        
                        # Try to parse as JSON to verify it's valid
                        elif isinstance(field_value, str):
                            try:
                                json.loads(field_value)
                            except json.JSONDecodeError:
                                print(f"  Cleaning invalid JSON in {field_name} for {monster.name}")
                                setattr(monster, field_name, None)
                                monster_updated = True
                                corrupted_count += 1
                
                if monster_updated:
                    cleaned_count += 1
            
            # Commit all changes
            db.session.commit()
            
            print(f"\n✅ Cleanup complete!")
            print(f"📊 Monsters cleaned: {cleaned_count}")
            print(f"🔧 Corrupted fields fixed: {corrupted_count}")
            
            # Show some statistics
            total_with_actions = Character.query.filter(
                Character.is_official == True,
                Character.character_type == 'Monster',
                Character.actions.isnot(None)
            ).count()
            
            print(f"📈 Monsters with valid actions: {total_with_actions}")
            
        except Exception as e:
            print(f"❌ Error during cleanup: {str(e)}")
            db.session.rollback()

def verify_monster_data():
    """Verify that monster data is now clean"""
    
    with app.app_context():
        print("\n🔍 Verifying monster data...")
        
        monsters = Character.query.filter_by(is_official=True, character_type='Monster').limit(5).all()
        
        for monster in monsters:
            print(f"\n📖 {monster.name}:")
            print(f"  CR: {monster.challenge_rating}")
            print(f"  Type: {monster.creature_type}")
            
            # Check actions
            if monster.actions:
                try:
                    actions = json.loads(monster.actions)
                    print(f"  ✅ Actions: {len(actions)} valid actions")
                except:
                    print(f"  ❌ Actions: Invalid JSON")
            else:
                print(f"  ⚪ Actions: None")
            
            # Check special abilities
            if monster.special_abilities:
                try:
                    abilities = json.loads(monster.special_abilities)
                    print(f"  ✅ Special Abilities: {len(abilities)} valid abilities")
                except:
                    print(f"  ❌ Special Abilities: Invalid JSON")
            else:
                print(f"  ⚪ Special Abilities: None")

if __name__ == '__main__':
    print("🧹 Starting monster data cleanup...")
    cleanup_monster_json_data()
    verify_monster_data()
    print("\n🎉 Cleanup finished! Try accessing your monsters again.")