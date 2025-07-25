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
      if (actionsData === '[object Object]' || actionsData === 'undefined' || actionsData === 'null' || actionsData.trim() === '') {
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

  // Check if an action is an attack (contains attack-related keywords)
  const isAttackAction = (action) => {
    if (!action) return false;
    
    const actionText = (action.description || action.desc || '').toLowerCase();
    const actionName = (action.name || '').toLowerCase();
    
    // Check if it has attack_bonus (definitive indicator)
    if (action.attack_bonus || action.attack_bonus === 0) {
      return true;
    }
    
    // Check for attack-related keywords
    const attackKeywords = [
      'hit:', 'melee weapon attack', 'ranged weapon attack',
      'spell attack', 'weapon attack', 'to hit', 'damage:'
    ];
    
    // Check basic keywords first
    const hasAttackKeyword = attackKeywords.some(keyword => 
      actionText.includes(keyword) || actionName.includes(keyword)
    );
    
    if (hasAttackKeyword) return true;
    
    // Check for "+X to hit" pattern with proper regex escaping
    const attackBonusPattern = /[+\-]\d+\s*to\s*hit/i;
    if (attackBonusPattern.test(actionText) || attackBonusPattern.test(actionName)) {
      return true;
    }
    
    return false;
  };

  // Roll attack action with damage
  const handleAttackActionRoll = (action) => {
    const { name, attack_bonus, damage } = action;
    const actionDescription = action.description || action.desc || '';
    
    // Check if we have a valid attack bonus
    if (attack_bonus !== undefined && attack_bonus !== null && !isNaN(attack_bonus)) {
      // This is an attack with explicit attack bonus - roll to hit
      const attackRoll = rollFromNotation('1d20');
      const rollValue = attackRoll.rolls ? attackRoll.rolls[0] : attackRoll.total;
      const totalAttack = attackRoll.total + attack_bonus;
      
      let damageText = '';
      if (damage && Array.isArray(damage) && damage.length > 0) {
        const damageRolls = damage.map(d => {
          if (d.damage_dice || d) {
            const dice = d.damage_dice || d;
            const damageRoll = rollFromNotation(dice);
            const damageType = d.damage_type?.name || d.damage_type || '';
            return `${damageRoll.total} ${damageType}`;
          }
          return 'No damage dice';
        });
        damageText = ` | Damage: ${damageRolls.join(', ')}`;
      }
      
      setDiceRollResult({
        ...attackRoll,
        total: totalAttack,
        formatted: `Attack Roll: 1d20+${attack_bonus} = ${rollValue}+${attack_bonus} = ${totalAttack}${damageText}`
      });
      setRollActionName(name);
    } else {
      // Try to extract attack bonus from description text
      const attackBonusMatch = actionDescription.match(/[+\-](\d+)\s*to\s*hit/i);
      const extractedBonus = attackBonusMatch ? parseInt(attackBonusMatch[1]) : null;
      
      if (extractedBonus !== null) {
        // Found attack bonus in description
        const attackRoll = rollFromNotation('1d20');
        const rollValue = attackRoll.rolls ? attackRoll.rolls[0] : attackRoll.total;
        const totalAttack = attackRoll.total + extractedBonus;
        
        // Try to extract damage from description
        const damageMatch = actionDescription.match(/(\d+d\d+(?:[+\-]\d+)?)\s*(\w+)?\s*damage/i);
        let damageText = '';
        
        if (damageMatch) {
          const damageRoll = rollFromNotation(damageMatch[1]);
          const damageType = damageMatch[2] || '';
          damageText = ` | Damage: ${damageRoll.total} ${damageType}`;
        }
        
        setDiceRollResult({
          ...attackRoll,
          total: totalAttack,
          formatted: `Attack Roll: 1d20+${extractedBonus} = ${rollValue}+${extractedBonus} = ${totalAttack}${damageText}`
        });
        setRollActionName(name);
      } else {
        // Try to extract any dice notation from description for damage roll
        const diceMatch = actionDescription.match(/(\d+d\d+(?:[+-]\d+)?)/i);
        
        if (diceMatch) {
          const result = rollFromNotation(diceMatch[0]);
          if (result) {
            setDiceRollResult(result);
            setRollActionName(`${name} - Damage`);
            return;
          }
        }
        
        // Fallback to 1d20 for basic attack roll
        const result = rollFromNotation('1d20');
        setDiceRollResult(result);
        setRollActionName(`${name} - Attack Roll`);
      }
    }
  };

  // Close dice modal
  const closeDiceModal = () => {
    setDiceRollResult(null);
    setRollActionName('');
  };

  // Create a new character - FIXED VERSION
  const handleCreate = async () => {
  try {
    console.log('Creating character with form data:', formData); // Debug log
    
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
        // Send individual stat fields
        strength: formData.stats.strength,
        dexterity: formData.stats.dexterity,
        constitution: formData.stats.constitution,
        intelligence: formData.stats.intelligence,
        wisdom: formData.stats.wisdom,
        charisma: formData.stats.charisma,
        armor_class: formData.stats.armorClass,
        hit_points: formData.stats.hitPoints,
        // Make sure actions are properly stringified
        actions: formData.stats.actions && formData.stats.actions.length > 0 
          ? JSON.stringify(formData.stats.actions) 
          : null
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create character');
    }
    
    const data = await response.json();
    console.log('Character created successfully:', data); // Debug log
    
    // Refresh the character list
    await fetchCharacters();
    
    setIsCreating(false);
    resetForm();
    
    // Find and select the newly created character
    setTimeout(() => {
      const newCharacter = characters.find(char => char.id === data.id);
      if (newCharacter) {
        setSelectedCharacter(newCharacter);
      }
    }, 100);
    
  } catch (err) {
    console.error('Failed to create character:', err);
    setError('Failed to create character. Please try again.');
  }
};

// 4. FIXED handleUpdate function
const handleUpdate = async () => {
  if (!selectedCharacter) return;
  
  try {
    console.log('Updating character with form data:', formData); // Debug log
    
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
        // Send individual stat fields
        strength: formData.stats.strength,
        dexterity: formData.stats.dexterity,
        constitution: formData.stats.constitution,
        intelligence: formData.stats.intelligence,
        wisdom: formData.stats.wisdom,
        charisma: formData.stats.charisma,
        armor_class: formData.stats.armorClass,
        hit_points: formData.stats.hitPoints,
        // Make sure actions are properly stringified
        actions: formData.stats.actions && formData.stats.actions.length > 0 
          ? JSON.stringify(formData.stats.actions) 
          : null
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update character');
    }
    
    const data = await response.json();
    console.log('Character updated successfully:', data); // Debug log
    
    // Refresh the character list
    await fetchCharacters();
    
    setIsEditing(false);
    
    // Find and select the updated character
    setTimeout(() => {
      const updatedCharacter = characters.find(char => char.id === selectedCharacter.id);
      if (updatedCharacter) {
        setSelectedCharacter(updatedCharacter);
      }
    }, 100);
    
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

  // Start editing character - FIXED VERSION
  const handleEditClick = () => {
    if (!selectedCharacter) return;
    
    console.log('Editing character:', selectedCharacter); // Debug log
    
    // Handle both old format (stats as JSON string) and new format (individual columns)
    let stats;
    
    if (selectedCharacter.stats && typeof selectedCharacter.stats === 'string') {
      // Old format - parse the JSON string
      try {
        stats = JSON.parse(selectedCharacter.stats);
        console.log('Parsed stats from JSON string:', stats); // Debug log
      } catch (e) {
        console.warn('Could not parse stats JSON, using defaults:', e);
        stats = {
          strength: selectedCharacter.strength || 10,
          dexterity: selectedCharacter.dexterity || 10,
          constitution: selectedCharacter.constitution || 10,
          intelligence: selectedCharacter.intelligence || 10,
          wisdom: selectedCharacter.wisdom || 10,
          charisma: selectedCharacter.charisma || 10,
          armorClass: selectedCharacter.armor_class || 10,
          hitPoints: selectedCharacter.hit_points || 10,
          actions: []
        };
      }
    } else {
      // New format - build stats object from individual columns
      console.log('Building stats from individual columns'); // Debug log
      console.log('Character actions field:', selectedCharacter.actions); // Debug log
      
      stats = {
        strength: selectedCharacter.strength || 10,
        dexterity: selectedCharacter.dexterity || 10,
        constitution: selectedCharacter.constitution || 10,
        intelligence: selectedCharacter.intelligence || 10,
        wisdom: selectedCharacter.wisdom || 10,
        charisma: selectedCharacter.charisma || 10,
        armorClass: selectedCharacter.armor_class || 10,
        hitPoints: selectedCharacter.hit_points || 10,
        actions: safeParseActions(selectedCharacter.actions)
      };
    }
    
    console.log('Final stats for editing:', stats); // Debug log
    
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

  // Helper function to render character stats with clickable dice rolling
  function renderCharacterStats() {
  if (!selectedCharacter) return null;
  
  return (
    <>
      {/* Existing stats grid code... */}
      <div className="stats-grid">
        <div 
          className="stat-item clickable" 
          onClick={() => handleAbilityRoll('Strength', selectedCharacter.strength || 10)}
          title="Click to roll Strength check"
        >
          <span className="stat-label">STR</span>
          <span className="stat-value">{selectedCharacter.strength || 10}</span>
        </div>
        <div 
          className="stat-item clickable" 
          onClick={() => handleAbilityRoll('Dexterity', selectedCharacter.dexterity || 10)}
          title="Click to roll Dexterity check"
        >
          <span className="stat-label">DEX</span>
          <span className="stat-value">{selectedCharacter.dexterity || 10}</span>
        </div>
        <div 
          className="stat-item clickable" 
          onClick={() => handleAbilityRoll('Constitution', selectedCharacter.constitution || 10)}
          title="Click to roll Constitution check"
        >
          <span className="stat-label">CON</span>
          <span className="stat-value">{selectedCharacter.constitution || 10}</span>
        </div>
        <div 
          className="stat-item clickable" 
          onClick={() => handleAbilityRoll('Intelligence', selectedCharacter.intelligence || 10)}
          title="Click to roll Intelligence check"
        >
          <span className="stat-label">INT</span>
          <span className="stat-value">{selectedCharacter.intelligence || 10}</span>
        </div>
        <div 
          className="stat-item clickable" 
          onClick={() => handleAbilityRoll('Wisdom', selectedCharacter.wisdom || 10)}
          title="Click to roll Wisdom check"
        >
          <span className="stat-label">WIS</span>
          <span className="stat-value">{selectedCharacter.wisdom || 10}</span>
        </div>
        <div 
          className="stat-item clickable" 
          onClick={() => handleAbilityRoll('Charisma', selectedCharacter.charisma || 10)}
          title="Click to roll Charisma check"
        >
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
            <span className="stat-value">{formatChallengeRating(selectedCharacter.challenge_rating)}</span>
          </div>
        )}
      </div>

      {/* Show additional monster info for official monsters */}
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

      {/* FIXED: Custom character actions - check actions field directly */}
      {(() => {
        console.log('Checking actions for character:', selectedCharacter.name);
        console.log('Actions field:', selectedCharacter.actions);
        
        const actionsToShow = safeParseActions(selectedCharacter.actions);
        console.log('Parsed actions:', actionsToShow);
        
        if (actionsToShow && actionsToShow.length > 0) {
          return (
            <div className="character-actions">
              <h3>Actions</h3>
              <div className="actions-list">
                {actionsToShow.map((action, index) => (
                  <div key={index} className="action-item">
                    <div className="action-name">{action.name || 'Unnamed Action'}</div>
                    <div className="action-description">{action.description || 'No description'}</div>
                    {isAttackAction(action) && (
                      <button 
                        className="roll-btn"
                        onClick={() => handleAttackActionRoll(action)}
                        title="Roll this attack"
                      >
                        🎲 Roll Attack
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Official monster special abilities */}
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

      {/* Official monster actions */}
      {selectedCharacter.is_official && selectedCharacter.actions && (
        <div className="character-actions">
          <h3>Monster Actions</h3>
          <div className="actions-list">
            {safeParseActions(selectedCharacter.actions).map((action, index) => (
              <div key={index} className="action-item">
                <div className="action-name">{action.name || 'Unnamed Action'}</div>
                <div className="action-description">{action.description || action.desc || 'No description'}</div>
                {isAttackAction(action) && (
                  <button 
                    className="roll-btn"
                    onClick={() => handleAttackActionRoll(action)}
                    title="Roll this attack"
                  >
                    🎲 Roll Attack
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legendary Actions */}
      {selectedCharacter.legendary_actions && (
        <div className="character-legendary-actions">
          <h3>Legendary Actions</h3>
          <div className="legendary-actions-list">
            {safeParseActions(selectedCharacter.legendary_actions).map((action, index) => (
              <div key={index} className="legendary-action-item">
                <div className="legendary-action-name">{action.name || 'Unnamed Action'}</div>
                <div className="legendary-action-description">{action.description || action.desc || 'No description'}</div>
                {isAttackAction(action) && (
                  <button 
                    className="roll-btn"
                    onClick={() => handleAttackActionRoll(action)}
                    title="Roll this legendary attack"
                  >
                    🎲 Roll Attack
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reactions */}
      {selectedCharacter.reactions && (
        <div className="character-reactions">
          <h3>Reactions</h3>
          <div className="reactions-list">
            {safeParseActions(selectedCharacter.reactions).map((reaction, index) => (
              <div key={index} className="reaction-item">
                <div className="reaction-name">{reaction.name || 'Unnamed Reaction'}</div>
                <div className="reaction-description">{reaction.description || reaction.desc || 'No description'}</div>
                {isAttackAction(reaction) && (
                  <button 
                    className="roll-btn"
                    onClick={() => handleAttackActionRoll(reaction)}
                    title="Roll this reaction attack"
                  >
                    🎲 Roll Attack
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
                  {character.challenge_rating && ` (CR ${formatChallengeRating(character.challenge_rating)})`}
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