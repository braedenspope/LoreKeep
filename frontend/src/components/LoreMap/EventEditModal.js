import React from 'react';
import './LoreMap.css';
import EventConditions from './EventConditions';

const EventEditModal = ({
  editingEvent,
  setEditingEvent,
  eventStates,
  characters,
  eventCharacters,
  events,
  battleMapPreview,
  battleMapFile,
  uploadProgress,
  onAddCharacter,
  onRemoveCharacter,
  onBattleMapUpload,
  onRemoveBattleMap,
  onConditionsChange,
  onToggleCompleted,
  onSave,
  onCancel
}) => {
  return (
    <div className="event-edit-modal-overlay">
      <div className="event-edit-modal">
        <div className="event-edit-header">
          <h2>Edit Event</h2>
          <button className="modal-close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="event-edit-content">
          <div className="event-edit-left">
            <div className="form-group">
              <label>Event Title:</label>
              <input
                type="text"
                value={editingEvent.title}
                onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Location:</label>
              <input
                type="text"
                value={editingEvent.location}
                onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={editingEvent.description}
                onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                rows="6"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={editingEvent.isPartyLocation}
                  onChange={(e) => setEditingEvent({...editingEvent, isPartyLocation: e.target.checked})}
                />
                Party is currently here
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={eventStates[`event_${editingEvent.id}_completed`] || false}
                  onChange={() => onToggleCompleted(editingEvent.id)}
                />
                Mark as completed
              </label>
            </div>

            {/* Characters Section */}
            <div className="characters-section">
              <h3>Characters Present</h3>
              <div className="character-select">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onAddCharacter(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Add a character...</option>
                  {characters
                    .filter(char => !eventCharacters.includes(char.id))
                    .map(char => (
                      <option key={char.id} value={char.id}>
                        {char.name} ({char.character_type})
                        {char.is_official && ' - Official'}
                      </option>
                    ))}
                </select>
              </div>

              <div className="character-list">
                {eventCharacters.length === 0 ? (
                  <p className="no-characters">No characters assigned to this event</p>
                ) : (
                  <ul className="character-name-list">
                    {eventCharacters.map(charId => {
                      const character = characters.find(c => c.id === charId);
                      if (!character) {
                        console.warn('Character not found:', charId);
                        return null;
                      }

                      return (
                        <li key={charId} className="character-list-item">
                          <span className="character-name">{character.name}</span>
                          <span className="character-type">
                            ({character.character_type}
                            {character.is_official && ' - Official'})
                          </span>
                          <button
                            className="remove-character-btn"
                            onClick={() => onRemoveCharacter(charId)}
                            title="Remove character"
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="event-edit-right">
            {/* Enhanced Battle Map Section */}
            <div className="battle-map-section">
              <h3>Battle Map</h3>
              <div className="battle-map-upload">
                <input
                  type="file"
                  id="battle-map-input"
                  accept="image/*"
                  onChange={onBattleMapUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="battle-map-input" className="upload-btn">
                  Choose Battle Map Image
                </label>
                <div className="upload-help">
                  <small>Supported: PNG, JPG, GIF, WebP • Max size: 16MB</small>
                </div>
              </div>

              {uploadProgress && (
                <div className="upload-progress">
                  Loading preview...
                </div>
              )}

              {battleMapPreview && (
                <div className="battle-map-preview">
                  <img src={battleMapPreview} alt="Battle Map Preview" />
                  <button
                    className="remove-map-btn"
                    onClick={onRemoveBattleMap}
                  >
                    Remove Map
                  </button>
                  {battleMapFile && (
                    <div className="file-info">
                      <small>{battleMapFile.name} ({(battleMapFile.size / 1024 / 1024).toFixed(1)}MB)</small>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Event Conditions */}
            <EventConditions
              conditions={editingEvent.conditions || []}
              onConditionsChange={onConditionsChange}
              availableEvents={events.filter(e => e.id !== editingEvent.id)}
              availableCharacters={characters}
            />
          </div>
        </div>

        <div className="event-edit-actions">
          <button onClick={onSave} className="save-btn">Save Changes</button>
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EventEditModal;
