import React, { useState, useEffect, useCallback } from 'react';
import './CharacterManager.css';
import { rollAbilityCheck, rollFromNotation } from '../../utils/diceUtils';
import DiceRollModal from '../common/DiceRollModal';
import { formatChallengeRating, sortByChallengeRating } from '../../utils/challengeRatingUtils';
import config from '../../config';

const CharacterManager = ({ user }) => {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diceRollResult, setDiceRollResult] = useState(null);
  const [rollActionName, setRollActionName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    character_type: 'NPC',
    description: '',
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      armorClass: 10,
      hitPoints: 10,
      actions: []
    }
  });

  // Helper function to safely parse JSON data
  const safeParseActions = (actionsData) => {
    if (!actionsData) return [];
    
    // If it's already an array, return it
    if (Array.isArray(actionsData)) return actionsData;
    
    // If it's a string, try to parse it
    if (typeof actionsData === 'string') {
      // Check for common invalid values
      if (actionsData === '[object Object]' || actionsData === 'undefined' || actionsData === 'null') {
        return [];
      }
      
      try {
        const parsed = JSON.parse(actionsData);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Could not parse actions data:', actionsData, e);
        return [];
      }
    }
    
    // If it's an object, wrap it in an array
    if (typeof actionsData === 'object') {
      return [actionsData];
    }
    
    return [];
  };
  
  // Fetch characters from the backend
  const fetchCharacters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/api/characters`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load characters');
      }
      
      const data = await response.json();
      setCharacters(data);
    } catch (err) {
      console.error('Failed to fetch characters:', err);
      setError('Failed to load characters. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // Roll ability check
  const handleAbilityRoll = (abilityName, abilityScore) => {
    const result = rollAbilityCheck(abilityScore);
    setDiceRollResult(result);
    setRollActionName(`${abilityName} Check`);
  };

  // Roll custom action
  const handleActionRoll = (actionName, actionDescription) => {
    // Try to extract dice notation from action description
    const diceMatch = actionDescription.match(/(\d+d\d+(?:[+-]\d+)?)/i);
    
    if (diceMatch) {
      const result = rollFromNotation(diceMatch[0]);
      if (result) {
        setDiceRollResult(result);
        setRollActionName(actionName);
        return;
      }
    }
    
    // Fallback to 1d20 if no dice notation found
    const result = rollFromNotation('1d20');
    setDiceRollResult(result);
    setRollActionName(actionName);
  };

  // Roll monster action with damage
  const handleMonsterActionRoll = (action) => {
    const { name, attack_bonus, damage } = action;
    
    if (attack_bonus) {
      // This is an attack - roll to hit
      const attackRoll = rollFromNotation('1d20');
      const totalAttack = attackRoll.total + attack_bonus;
      
      let damageText = '';
      if (damage && Array.isArray(damage) && damage.length > 0) {
        const damageRolls = damage.map(d => {
          if (d.damage_dice) {
            const damageRoll = rollFromNotation(d.damage_dice);
            return `${damageRoll.total} ${d.damage_type?.name || d.damage_type || ''}`;
          }
          return 'No damage dice';
        });
        damageText = ` | Damage: ${damageRolls.join(', ')}`;
      }
      
      setDiceRollResult({
        ...attackRoll,
        total: totalAttack,
        formatted: `Attack Roll: 1d20+${attack_bonus} = ${attackRoll.roll}+${attack_bonus} = ${totalAttack}${damageText}`
      });
      setRollActionName(name);
    } else {
      // Just a regular action roll
      handleActionRoll(name, action.description || action.desc || '');
    }
  };

  // Close dice modal
  const closeDiceModal = () => {
    setDiceRollResult(null);
    setRollActionName('');
  };

  // Create a new character
  const handleCreate = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          character_type: formData.character_type,
          description: formData.description,
          stats: JSON.stringify(formData.stats)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create character');
      }
      
      const data = await response.json();
      setCharacters([...characters, data]);
      setIsCreating(false);
      resetForm();
      
    } catch (err) {
      console.error('Failed to create character:', err);
      setError('Failed to create character. Please try again.');
    }
  };
  
  // Update existing character
  const handleUpdate = async () => {
    if (!selectedCharacter) return;
    
    try {
      const response = await fetch(`${config.apiUrl}/api/characters/${selectedCharacter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          character_type: formData.character_type,
          description: formData.description,
          stats: JSON.stringify(formData.stats)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update character');
      }
      
      const data = await response.json();
      setCharacters(characters.map(char => 
        char.id === selectedCharacter.id ? data : char
      ));
      setIsEditing(false);
      setSelectedCharacter(data);
      
    } catch (err) {
      console.error('Failed to update character:', err);
      setError('Failed to update character. Please try again.');
    }
  };
  
  // Delete character
  const handleDelete = async () => {
    if (!selectedCharacter) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedCharacter.name}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/characters/${selectedCharacter.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete character');
      }
      
      setCharacters(characters.filter(char => char.id !== selectedCharacter.id));
      setSelectedCharacter(null);
      
    } catch (err) {
      console.error('Failed to delete character:', err);
      setError('Failed to delete character. Please try again.');
    }
  };
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      character_type: 'NPC',
      description: '',
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        armorClass: 10,
        hitPoints: 10,
        actions: []
      }
    });
  };
  
  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle stat changes
  const handleStatChange = (statName, value) => {
    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        [statName]: parseInt(value, 10) || 0
      }
    });
  };
  
  // Add a new action to character
  const handleAddAction = () => {
    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        actions: [
          ...formData.stats.actions,
          { name: '', description: '' }
        ]
      }
    });
  };
  
  // Update action data
  const handleActionChange = (index, field, value) => {
    const updatedActions = [...formData.stats.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        actions: updatedActions
      }
    });
  };
  
  // Remove an action
  const handleRemoveAction = (index) => {
    const updatedActions = formData.stats.actions.filter((_, i) => i !== index);
    
    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        actions: updatedActions
      }
    });
  };

  // Start editing character
  const handleEditClick = () => {
    if (!selectedCharacter) return;
    
    // Parse the stats if it's a string
    const stats = typeof selectedCharacter.stats === 'string' 
      ? JSON.parse(selectedCharacter.stats) 
      : selectedCharacter.stats;
    
    setFormData({
      name: selectedCharacter.name,
      character_type: selectedCharacter.character_type,
      description: selectedCharacter.description,
      stats: stats
    });
    
    setIsEditing(true);
  };

  // Filter and sort characters alphabetically
  const filteredCharacters = characters
    .filter(char => {
      // Filter by character type
      if (filter !== 'all' && char.character_type !== filter) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !char.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort alphabetically by name (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

  // Render the character creation/editing form
  const renderForm = () => {
    return (
      <div className="character-form">
        <h2>{isEditing ? 'Edit Character' : 'Create New Character'}</h2>
        
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="character_type">Character Type</label>
          <select
            id="character_type"
            name="character_type"
            value={formData.character_type}
            onChange={handleFormChange}
          >
            <option value="PC">PC</option>
            <option value="NPC">NPC</option>
            <option value="Monster">Monster</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            rows="4"
          />
        </div>
        
        <h3>Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <label htmlFor="strength">STR</label>
            <input
              type="number"
              id="strength"
              value={formData.stats.strength}
              onChange={(e) => handleStatChange('strength', e.target.value)}
              min="1"
            />
          </div>
          
          <div className="stat-item">
            <label htmlFor="dexterity">DEX</label>
            <input
              type="number"
              id="dexterity"
              value={formData.stats.dexterity}
              onChange={(e) => handleStatChange('dexterity', e.target.value)}
              min="1"
            />
          </div>
          
          <div className="stat-item">
            <label htmlFor="constitution">CON</label>
            <input
              type="number"
              id="constitution"
              value={formData.stats.constitution}
              onChange={(e) => handleStatChange('constitution', e.target.value)}
              min="1"
            />
          </div>
          
          <div className="stat-item">
            <label htmlFor="intelligence">INT</label>
            <input
              type="number"
              id="intelligence"
              value={formData.stats.intelligence}
              onChange={(e) => handleStatChange('intelligence', e.target.value)}
              min="1"
            />
          </div>
          
          <div className="stat-item">
            <label htmlFor="wisdom">WIS</label>
            <input
              type="number"
              id="wisdom"
              value={formData.stats.wisdom}
              onChange={(e) => handleStatChange('wisdom', e.target.value)}
              min="1"
            />
          </div>
          
          <div className="stat-item">
            <label htmlFor="charisma">CHA</label>
            <input
              type="number"
              id="charisma"
              value={formData.stats.charisma}
              onChange={(e) => handleStatChange('charisma', e.target.value)}
              min="1"
            />
          </div>
        </div>
        
        <div className="combat-stats">
          <div className="combat-stat">
            <label htmlFor="armorClass">AC</label>
            <input
              type="number"
              id="armorClass"
              value={formData.stats.armorClass}
              onChange={(e) => handleStatChange('armorClass', e.target.value)}
              min="1"
            />
          </div>
          
          <div className="combat-stat">
            <label htmlFor="hitPoints">HP</label>
            <input
              type="number"
              id="hitPoints"
              value={formData.stats.hitPoints}
              onChange={(e) => handleStatChange('hitPoints', e.target.value)}
              min="1"
            />
          </div>
        </div>
        
        <h3>Actions</h3>
        <button type="button" className="add-action-btn" onClick={handleAddAction}>
          Add Action
        </button>
        
        {formData.stats.actions.map((action, index) => (
          <div key={index} className="action-form-item">
            <div className="action-header">
              <h4>Action {index + 1}</h4>
              <button 
                type="button" 
                className="remove-action-btn"
                onClick={() => handleRemoveAction(index)}
              >
                Remove
              </button>
            </div>
            
            <div className="form-group">
              <label htmlFor={`action-name-${index}`}>Name</label>
              <input
                type="text"
                id={`action-name-${index}`}
                value={action.name}
                onChange={(e) => handleActionChange(index, 'name', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor={`action-desc-${index}`}>Description</label>
              <input
                type="text"
                id={`action-desc-${index}`}
                value={action.description}
                onChange={(e) => handleActionChange(index, 'description', e.target.value)}
              />
            </div>
          </div>
        ))}
        
        <div className="form-actions">
          <button type="button" onClick={isEditing ? handleUpdate : handleCreate}>
            {isEditing ? 'Update Character' : 'Create Character'}
          </button>
          <button type="button" onClick={() => {
            setIsCreating(false);
            setIsEditing(false);
            resetForm();
          }}>
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Helper function to render character stats - UPDATED WITH SAFE JSON PARSING
  function renderCharacterStats() {
    if (!selectedCharacter) return null;
    
    return (
      <>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">STR</span>
            <span className="stat-value">{selectedCharacter.strength || 10}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">DEX</span>
            <span className="stat-value">{selectedCharacter.dexterity || 10}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">CON</span>
            <span className="stat-value">{selectedCharacter.constitution || 10}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">INT</span>
            <span className="stat-value">{selectedCharacter.intelligence || 10}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">WIS</span>
            <span className="stat-value">{selectedCharacter.wisdom || 10}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">CHA</span>
            <span className="stat-value">{selectedCharacter.charisma || 10}</span>
          </div>
        </div>
        
        <div className="combat-stats">
          <div className="combat-stat">
            <span className="stat-label">AC</span>
            <span className="stat-value">{selectedCharacter.armor_class || 10}</span>
          </div>
          <div className="combat-stat">
            <span className="stat-label">HP</span>
            <span className="stat-value">{selectedCharacter.hit_points || 1}</span>
          </div>
          {selectedCharacter.challenge_rating && (
            <div className="combat-stat">
              <span className="stat-label">CR</span>
              <span className="stat-value">{selectedCharacter.challenge_rating}</span>
            </div>
          )}
        </div>

        {/* Show additional monster info */}
        {selectedCharacter.is_official && selectedCharacter.character_type === 'Monster' && (
          <div className="monster-info">
            {selectedCharacter.creature_type && (
              <div className="creature-info">
                <strong>Type:</strong> {selectedCharacter.creature_type}
              </div>
            )}
            {selectedCharacter.senses && (
              <div className="creature-senses">
                <strong>Senses:</strong> {selectedCharacter.senses}
              </div>
            )}
            {selectedCharacter.languages && (
              <div className="creature-languages">
                <strong>Languages:</strong> {selectedCharacter.languages}
              </div>
            )}
            {selectedCharacter.damage_resistances && (
              <div className="creature-resistances">
                <strong>Damage Resistances:</strong> {selectedCharacter.damage_resistances}
              </div>
            )}
            {selectedCharacter.damage_immunities && (
              <div className="creature-immunities">
                <strong>Damage Immunities:</strong> {selectedCharacter.damage_immunities}
              </div>
            )}
            {selectedCharacter.condition_immunities && (
              <div className="creature-condition-immunities">
                <strong>Condition Immunities:</strong> {selectedCharacter.condition_immunities}
              </div>
            )}
          </div>
        )}

        {/* Monster Special Abilities - FIXED WITH SAFE PARSING */}
        {selectedCharacter.special_abilities && (
          <div className="character-special-abilities">
            <h3>Special Abilities</h3>
            <div className="abilities-list">
              {safeParseActions(selectedCharacter.special_abilities).map((ability, index) => (
                <div key={index} className="ability-item">
                  <div className="ability-name">{ability.name || 'Unnamed Ability'}</div>
                  <div className="ability-description">{ability.description || ability.desc || 'No description'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monster Actions - FIXED WITH SAFE PARSING */}
        {selectedCharacter.actions && (
          <div className="character-actions">
            <h3>Actions</h3>
            <div className="actions-list">
              {safeParseActions(selectedCharacter.actions).map((action, index) => (
                <div key={index} className="action-item">
                  <div className="action-name">{action.name || 'Unnamed Action'}</div>
                  <div className="action-description">{action.description || action.desc || 'No description'}</div>
                  
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legendary Actions - FIXED WITH SAFE PARSING */}
        {selectedCharacter.legendary_actions && (
          <div className="character-legendary-actions">
            <h3>Legendary Actions</h3>
            <div className="legendary-actions-list">
              {safeParseActions(selectedCharacter.legendary_actions).map((action, index) => (
                <div key={index} className="legendary-action-item">
                  <div className="legendary-action-name">{action.name || 'Unnamed Action'}</div>
                  <div className="legendary-action-description">{action.description || action.desc || 'No description'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reactions - FIXED WITH SAFE PARSING */}
        {selectedCharacter.reactions && (
          <div className="character-reactions">
            <h3>Reactions</h3>
            <div className="reactions-list">
              {safeParseActions(selectedCharacter.reactions).map((reaction, index) => (
                <div key={index} className="reaction-item">
                  <div className="reaction-name">{reaction.name || 'Unnamed Reaction'}</div>
                  <div className="reaction-description">{reaction.description || reaction.desc || 'No description'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legacy actions for user-created characters */}
        {selectedCharacter.stats && typeof selectedCharacter.stats === 'string' && (() => {
          try {
            const stats = JSON.parse(selectedCharacter.stats);
            return stats.actions && stats.actions.length > 0 && (
              <div className="character-actions">
                <h3>Actions</h3>
                <div className="actions-list">
                  {stats.actions.map((action, index) => (
                    <div key={index} className="action-item">
                      <div className="action-name">{action.name}</div>
                      <div className="action-description">{action.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          } catch (e) {
            return null;
          }
        })()}
      </>
    );
  }

  // Main component render
  if (loading) {
    return <div className="loading">Loading characters...</div>;
  }

  return (
    <div className="character-manager">
      <div className="character-sidebar">
        <div className="sidebar-header">
          <h2>Characters</h2>
          <button 
            className="create-btn" 
            onClick={() => {
              setIsCreating(true);
              setSelectedCharacter(null);
              setIsEditing(false);
              resetForm();
            }}
          >
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
                onClick={() => {
                  setSelectedCharacter(character);
                  setIsCreating(false);
                  setIsEditing(false);
                }}
              >
                <div className="character-name">
                  {character.name}
                  {character.is_official && <span className="official-badge">📖</span>}
                </div>
                <div className="character-type">
                  {character.character_type}
                  {character.challenge_rating && ` (CR ${character.challenge_rating})`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="character-detail-panel">
        {selectedCharacter && !isEditing && !isCreating ? (
          <div className="character-details">
            <div className="detail-header">
              <h2>{selectedCharacter.name}</h2>
              <span className="character-type-tag">
                {selectedCharacter.character_type}
                {selectedCharacter.is_official && ' (Official)'}
              </span>
              
              {!selectedCharacter.is_official && (
                <div className="detail-actions">
                  <button onClick={handleEditClick}>Edit</button>
                  <button className="delete-btn" onClick={handleDelete}>Delete</button>
                </div>
              )}
            </div>
            
            <div className="character-description">
              <h3>Description</h3>
              <p>{selectedCharacter.description}</p>
            </div>
            
            <div className="character-stats">
              <h3>Stats</h3>
              {renderCharacterStats()}
            </div>
          </div>
        ) : isCreating || isEditing ? (
          renderForm()
        ) : (
          <div className="no-selection">
            <p>Select a character from the list or create a new one</p>
          </div>
        )}
      </div>

      {/* Dice Roll Modal */}
      <DiceRollModal 
        rollResult={diceRollResult}
        onClose={closeDiceModal}
        actionName={rollActionName}
      />

      {error && (
        <div className="error-message" style={{position: 'fixed', top: '20px', right: '20px', zIndex: 1000}}>
          {error}
          <button onClick={() => setError(null)} style={{marginLeft: '10px'}}>×</button>
        </div>
      )}
    </div>
  );
};

export default CharacterManager;