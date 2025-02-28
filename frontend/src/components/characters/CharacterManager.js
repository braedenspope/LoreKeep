import React, { useState, useEffect } from 'react';
import './CharacterManager.css';

// Sample character data
const sampleCharacters = [
  {
    id: 1,
    name: 'Lord Neverember',
    type: 'NPC',
    description: 'The former Open Lord of Waterdeep, now rules Neverwinter.',
    stats: {
      strength: 14,
      dexterity: 12,
      constitution: 16,
      intelligence: 16,
      wisdom: 14,
      charisma: 18,
      armorClass: 16,
      hitPoints: 112,
      actions: [
        { name: 'Longsword', description: '+7 to hit, 1d8+3 slashing damage' },
        { name: 'Crossbow', description: '+5 to hit, 1d10+1 piercing damage' },
      ]
    }
  },
  {
    id: 2,
    name: 'Grumsh the Destroyer',
    type: 'Monster',
    description: 'A fearsome half-orc barbarian who leads a band of marauders.',
    stats: {
      strength: 18,
      dexterity: 14,
      constitution: 16,
      intelligence: 8,
      wisdom: 10,
      charisma: 12,
      armorClass: 15,
      hitPoints: 65,
      actions: [
        { name: 'Greataxe', description: '+7 to hit, 1d12+4 slashing damage' },
        { name: 'Javelin', description: '+7 to hit, 1d6+4 piercing damage' },
      ]
    }
  },
  {
    id: 3,
    name: 'Elaria Moonwhisper',
    type: 'PC',
    description: 'Elven wizard who seeks ancient magic artifacts.',
    stats: {
      strength: 8,
      dexterity: 14,
      constitution: 12,
      intelligence: 18,
      wisdom: 14,
      charisma: 12,
      armorClass: 12,
      hitPoints: 32,
      actions: [
        { name: 'Firebolt', description: '+7 to hit, 1d10 fire damage' },
        { name: 'Magic Missile', description: 'Auto-hit, 3×1d4+1 force damage' },
      ]
    }
  }
];

const CharacterManager = ({ user }) => {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setCharacters(sampleCharacters);
      setLoading(false);
    }, 800);
  }, []);

  const filteredCharacters = characters.filter(char => {
    // Filter by character type
    if (filter !== 'all' && char.type !== filter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !char.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setIsEditing(false);
  };

  const handleCreateClick = () => {
    setIsCreating(true);
    setSelectedCharacter(null);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="loading">Loading characters...</div>;
  }

  return (
    <div className="character-manager">
      <div className="character-sidebar">
        <div className="sidebar-header">
          <h2>Characters</h2>
          <button className="create-btn" onClick={handleCreateClick}>
            Create New
          </button>
        </div>
        
        <div className="filter-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="character-filters">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'PC' ? 'active' : ''}
              onClick={() => setFilter('PC')}
            >
              PCs
            </button>
            <button
              className={filter === 'NPC' ? 'active' : ''}
              onClick={() => setFilter('NPC')}
            >
              NPCs
            </button>
            <button
              className={filter === 'Monster' ? 'active' : ''}
              onClick={() => setFilter('Monster')}
            >
              Monsters
            </button>
          </div>
        </div>
        
        <div className="character-list">
          {filteredCharacters.length === 0 ? (
            <div className="no-characters">
              No characters match your criteria
            </div>
          ) : (
            filteredCharacters.map(character => (
              <div
                key={character.id}
                className={`character-item ${selectedCharacter?.id === character.id ? 'selected' : ''}`}
                onClick={() => handleCharacterSelect(character)}
              >
                <div className="character-name">{character.name}</div>
                <div className="character-type">{character.type}</div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="character-detail-panel">
        {selectedCharacter ? (
          <div className="character-details">
            <div className="detail-header">
              <h2>{selectedCharacter.name}</h2>
              <span className="character-type-tag">{selectedCharacter.type}</span>
              
              <div className="detail-actions">
                <button onClick={() => setIsEditing(true)}>Edit</button>
                <button className="delete-btn">Delete</button>
              </div>
            </div>
            
            <div className="character-description">
              <h3>Description</h3>
              <p>{selectedCharacter.description}</p>
            </div>
            
            <div className="character-stats">
              <h3>Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">STR</span>
                  <span className="stat-value">{selectedCharacter.stats.strength}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">DEX</span>
                  <span className="stat-value">{selectedCharacter.stats.dexterity}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">CON</span>
                  <span className="stat-value">{selectedCharacter.stats.constitution}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">INT</span>
                  <span className="stat-value">{selectedCharacter.stats.intelligence}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">WIS</span>
                  <span className="stat-value">{selectedCharacter.stats.wisdom}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">CHA</span>
                  <span className="stat-value">{selectedCharacter.stats.charisma}</span>
                </div>
              </div>
              
              <div className="combat-stats">
                <div className="combat-stat">
                  <span className="stat-label">AC</span>
                  <span className="stat-value">{selectedCharacter.stats.armorClass}</span>
                </div>
                <div className="combat-stat">
                  <span className="stat-label">HP</span>
                  <span className="stat-value">{selectedCharacter.stats.hitPoints}</span>
                </div>
              </div>
            </div>
            
            <div className="character-actions">
              <h3>Actions</h3>
              <div className="actions-list">
                {selectedCharacter.stats.actions.map((action, index) => (
                  <div key={index} className="action-item">
                    <div className="action-name">{action.name}</div>
                    <div className="action-description">{action.description}</div>
                    <button className="roll-btn">Roll</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isCreating ? (
          <div className="character-form">
            <h2>Create New Character</h2>
            <p>Form will go here...</p>
            <div className="form-actions">
              <button>Save Character</button>
              <button onClick={() => setIsCreating(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            <p>Select a character from the list or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterManager;