# test_import.py - Test importing just one monster

from app import app, db, Character

def test_monster_creation():
    """Test creating a monster manually first"""
    
    with app.app_context():
        try:
            print("🧪 Testing monster creation...")
            
            # Check if Character model has required attributes
            required_attrs = ['strength', 'dexterity', 'constitution', 'intelligence', 
                             'wisdom', 'charisma', 'armor_class', 'hit_points', 
                             'challenge_rating', 'creature_type', 'is_official']
            
            print("Checking Character model attributes:")
            for attr in required_attrs:
                if hasattr(Character, attr):
                    print(f"  ✓ {attr}")
                else:
                    print(f"  ✗ {attr} - MISSING!")
                    return False
            
            # Try to create a test monster
            print("\n📝 Creating test monster...")
            test_monster = Character(
                name='Test Dragon',
                character_type='Monster',
                description='A test dragon for verification',
                strength=20,
                dexterity=14,
                constitution=18,
                intelligence=12,
                wisdom=13,
                charisma=15,
                armor_class=17,
                hit_points=95,
                challenge_rating='5',
                creature_type='dragon',
                is_official=True,
                user_id=None
            )
            
            db.session.add(test_monster)
            db.session.commit()
            
            print("✅ Test monster created successfully!")
            
            # Verify it was saved
            saved_monster = Character.query.filter_by(name='Test Dragon').first()
            if saved_monster:
                print(f"✅ Monster saved with ID: {saved_monster.id}")
                print(f"   STR: {saved_monster.strength}, AC: {saved_monster.armor_class}")
                print(f"   CR: {saved_monster.challenge_rating}, Type: {saved_monster.creature_type}")
                return True
            else:
                print("❌ Monster was not saved properly")
                return False
                
        except Exception as e:
            print(f"❌ Error creating test monster: {str(e)}")
            db.session.rollback()
            return False

def test_api_import():
    """Test importing one monster from the API"""
    
    with app.app_context():
        try:
            import requests
            
            print("\n🌐 Testing API import...")
            
            # Get just one monster from the API
            response = requests.get("https://www.dnd5eapi.co/api/monsters/aboleth", timeout=10)
            if response.status_code != 200:
                print(f"❌ API request failed: {response.status_code}")
                return False
            
            monster_data = response.json()
            print(f"✅ Got monster data for: {monster_data['name']}")
            
            # Check if it already exists
            existing = Character.query.filter_by(
                name=monster_data['name'],
                character_type='Monster',
                is_official=True
            ).first()
            
            if existing:
                print(f"  - {monster_data['name']} already exists, deleting for test...")
                db.session.delete(existing)
                db.session.commit()
            
            # Create the monster - FIX THE ARMOR_CLASS PARSING
            cr = monster_data.get('challenge_rating', 0)
            if isinstance(cr, dict):
                cr_value = str(cr.get('rating', '0'))
            else:
                cr_value = str(cr)
            
            # Handle armor_class properly
            armor_class = monster_data.get('armor_class', 10)
            if isinstance(armor_class, list) and len(armor_class) > 0:
                # Extract the value from the first armor class entry
                armor_class = armor_class[0].get('value', 10)
            elif not isinstance(armor_class, int):
                armor_class = 10
            
            api_monster = Character(
                name=monster_data['name'],
                character_type='Monster',
                description=f"{monster_data.get('size', 'Medium')} {monster_data.get('type', 'beast')}",
                strength=monster_data.get('strength', 10),
                dexterity=monster_data.get('dexterity', 10),
                constitution=monster_data.get('constitution', 10),
                intelligence=monster_data.get('intelligence', 10),
                wisdom=monster_data.get('wisdom', 10),
                charisma=monster_data.get('charisma', 10),
                armor_class=armor_class,  # Use the fixed armor_class
                hit_points=monster_data.get('hit_points', 1),
                challenge_rating=cr_value,
                creature_type=monster_data.get('type', 'beast'),
                is_official=True,
                user_id=None
            )
            
            db.session.add(api_monster)
            db.session.commit()
            
            print(f"✅ Successfully imported {monster_data['name']} from API!")
            print(f"   CR: {api_monster.challenge_rating}, AC: {api_monster.armor_class}")
            
            return True
            
        except requests.RequestException as e:
            print(f"❌ Network error: {str(e)}")
            print("🔧 Try checking your internet connection or the API might be down")
            return False
        except Exception as e:
            print(f"❌ Error importing from API: {str(e)}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    print("🧪 LoreKeep Monster Import Test")
    print("=" * 40)
    
    # Test 1: Manual monster creation
    if test_monster_creation():
        print("\n✅ Test 1 PASSED: Manual monster creation works")
        
        # Test 2: API import
        if test_api_import():
            print("\n✅ Test 2 PASSED: API import works")
            print("\n🎉 All tests passed! You can now run the full import.")
            print("Run: python import_all_monsters.py")
        else:
            print("\n❌ Test 2 FAILED: API import has issues")
            print("Check your internet connection or try again later")
    else:
        print("\n❌ Test 1 FAILED: Database schema issues")
        print("The Character model needs to be fixed first")