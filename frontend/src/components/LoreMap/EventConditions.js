import React, { useState } from 'react';
import './EventConditions.css';

const EventConditions = ({ conditions, onConditionsChange, availableEvents, availableCharacters }) => {
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [newCondition, setNewCondition] = useState({
    type: 'event_completed',
    target: '',
    description: '',
    required: true
  });

  // Add safety checks for props
  const safeConditions = Array.isArray(conditions) ? conditions : [];
  const safeAvailableEvents = Array.isArray(availableEvents) ? availableEvents : [];
  const safeAvailableCharacters = Array.isArray(availableCharacters) ? availableCharacters : [];

  // Add a new condition
  const handleAddCondition = () => {
    if (!newCondition.target) return;
    
    const conditionToAdd = {
      id: Date.now(),
      ...newCondition,
      description: newCondition.description || generateDescription(newCondition)
    };
    
    onConditionsChange([...safeConditions, conditionToAdd]);
    setNewCondition({
      type: 'event_completed',
      target: '',
      description: '',
      required: true
    });
    setShowAddCondition(false);
  };

  // Remove a condition
  const handleRemoveCondition = (conditionId) => {
    onConditionsChange(safeConditions.filter(c => c.id !== conditionId));
  };

  // Generate description for condition
  const generateDescription = (condition) => {
    const targetName = getTargetName(condition.target, condition.type);
    
    switch (condition.type) {
      case 'event_completed':
        return condition.required 
          ? `Event "${targetName}" must be completed`
          : `Event "${targetName}" must NOT be completed`;
      case 'character_freed':
        return condition.required
          ? `Character "${targetName}" must be freed`
          : `Character "${targetName}" must NOT be freed`;
      case 'character_alive':
        return condition.required
          ? `Character "${targetName}" must be alive`
          : `Character "${targetName}" must be dead`;
      case 'custom':
        return condition.description || 'Custom condition';
      default:
        return 'Unknown condition';
    }
  };

  // Get target name for display
  const getTargetName = (targetId, type) => {
    if (type === 'event_completed') {
      const event = safeAvailableEvents.find(e => e.id.toString() === targetId);
      return event ? event.title : 'Unknown Event';
    } else if (type === 'character_freed' || type === 'character_alive') {
      const character = safeAvailableCharacters.find(c => c.id.toString() === targetId);
      return character ? character.name : 'Unknown Character';
    }
    return targetId;
  };

  return (
    <div className="event-conditions">
      <div className="conditions-header">
        <h4>Event Conditions</h4>
        <button 
          className="add-condition-btn"
          onClick={() => setShowAddCondition(true)}
        >
          Add Condition
        </button>
      </div>

      {safeConditions.length === 0 ? (
        <p className="no-conditions">No conditions set. This event is always accessible.</p>
      ) : (
        <div className="conditions-list">
          {safeConditions.map(condition => (
            <div key={condition.id} className="condition-item">
              <div className="condition-content">
                <span className={`condition-type ${condition.type}`}>
                  {condition.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="condition-description">
                  {condition.description}
                </span>
              </div>
              <button 
                className="remove-condition-btn"
                onClick={() => handleRemoveCondition(condition.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddCondition && (
        <div className="add-condition-modal">
          <div className="add-condition-form">
            <h5>Add New Condition</h5>
            
            <div className="form-group">
              <label>Condition Type:</label>
              <select 
                value={newCondition.type}
                onChange={(e) => setNewCondition({...newCondition, type: e.target.value, target: ''})}
              >
                <option value="event_completed">Event Completed</option>
                <option value="character_freed">Character Freed</option>
                <option value="character_alive">Character Alive</option>
                <option value="custom">Custom Condition</option>
              </select>
            </div>

            {newCondition.type === 'event_completed' && (
              <div className="form-group">
                <label>Event:</label>
                <select 
                  value={newCondition.target}
                  onChange={(e) => setNewCondition({...newCondition, target: e.target.value})}
                >
                  <option value="">Select an event...</option>
                  {safeAvailableEvents.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(newCondition.type === 'character_freed' || newCondition.type === 'character_alive') && (
              <div className="form-group">
                <label>Character:</label>
                <select 
                  value={newCondition.target}
                  onChange={(e) => setNewCondition({...newCondition, target: e.target.value})}
                >
                  <option value="">Select a character...</option>
                  {safeAvailableCharacters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newCondition.type === 'custom' && (
              <div className="form-group">
                <label>Custom Condition:</label>
                <input
                  type="text"
                  placeholder="Describe the condition..."
                  value={newCondition.description}
                  onChange={(e) => setNewCondition({...newCondition, description: e.target.value, target: 'custom'})}
                />
              </div>
            )}

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={newCondition.required}
                  onChange={(e) => setNewCondition({...newCondition, required: e.target.checked})}
                />
                Condition must be true (uncheck if condition must be false)
              </label>
            </div>

            <div className="condition-preview">
              <strong>Preview:</strong> {generateDescription(newCondition)}
            </div>

            <div className="modal-actions">
              <button onClick={handleAddCondition} disabled={!newCondition.target}>
                Add Condition
              </button>
              <button onClick={() => setShowAddCondition(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventConditions;