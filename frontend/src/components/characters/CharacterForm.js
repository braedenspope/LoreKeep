import React from 'react';
import './CharacterManager.css';

const CharacterForm = ({
  formData,
  isEditing,
  onFormChange,
  onStatChange,
  onAddAction,
  onActionChange,
  onRemoveAction,
  onSubmit,
  onCancel
}) => {
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
          onChange={onFormChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="character_type">Character Type</label>
        <select
          id="character_type"
          name="character_type"
          value={formData.character_type}
          onChange={onFormChange}
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
          onChange={onFormChange}
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
            onChange={(e) => onStatChange('strength', e.target.value)}
            min="1"
          />
        </div>

        <div className="stat-item">
          <label htmlFor="dexterity">DEX</label>
          <input
            type="number"
            id="dexterity"
            value={formData.stats.dexterity}
            onChange={(e) => onStatChange('dexterity', e.target.value)}
            min="1"
          />
        </div>

        <div className="stat-item">
          <label htmlFor="constitution">CON</label>
          <input
            type="number"
            id="constitution"
            value={formData.stats.constitution}
            onChange={(e) => onStatChange('constitution', e.target.value)}
            min="1"
          />
        </div>

        <div className="stat-item">
          <label htmlFor="intelligence">INT</label>
          <input
            type="number"
            id="intelligence"
            value={formData.stats.intelligence}
            onChange={(e) => onStatChange('intelligence', e.target.value)}
            min="1"
          />
        </div>

        <div className="stat-item">
          <label htmlFor="wisdom">WIS</label>
          <input
            type="number"
            id="wisdom"
            value={formData.stats.wisdom}
            onChange={(e) => onStatChange('wisdom', e.target.value)}
            min="1"
          />
        </div>

        <div className="stat-item">
          <label htmlFor="charisma">CHA</label>
          <input
            type="number"
            id="charisma"
            value={formData.stats.charisma}
            onChange={(e) => onStatChange('charisma', e.target.value)}
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
            onChange={(e) => onStatChange('armorClass', e.target.value)}
            min="1"
          />
        </div>

        <div className="combat-stat">
          <label htmlFor="hitPoints">HP</label>
          <input
            type="number"
            id="hitPoints"
            value={formData.stats.hitPoints}
            onChange={(e) => onStatChange('hitPoints', e.target.value)}
            min="1"
          />
        </div>
      </div>

      <h3>Actions</h3>
      <button type="button" className="add-action-btn" onClick={onAddAction}>
        Add Action
      </button>

      {formData.stats.actions.map((action, index) => (
        <div key={index} className="action-form-item">
          <div className="action-header">
            <h4>Action {index + 1}</h4>
            <button
              type="button"
              className="remove-action-btn"
              onClick={() => onRemoveAction(index)}
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
              onChange={(e) => onActionChange(index, 'name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor={`action-desc-${index}`}>Description</label>
            <input
              type="text"
              id={`action-desc-${index}`}
              value={action.description}
              onChange={(e) => onActionChange(index, 'description', e.target.value)}
            />
          </div>
        </div>
      ))}

      <div className="form-actions">
        <button type="button" onClick={onSubmit}>
          {isEditing ? 'Update Character' : 'Create Character'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CharacterForm;
