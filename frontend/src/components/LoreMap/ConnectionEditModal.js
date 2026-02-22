import React, { useState } from 'react';
import './LoreMap.css';

const CONNECTION_TYPES = {
  default: { label: 'Default', color: '#8b4513', description: 'Standard progression' },
  success: { label: 'Success', color: '#4a6741', description: 'Positive outcome path' },
  failure: { label: 'Failure', color: '#7b2d26', description: 'Negative outcome path' },
  optional: { label: 'Optional', color: '#5a7a8a', description: 'Side quest path' }
};

const ConnectionEditModal = ({ connection, events, onSave, onDelete, onCancel }) => {
  const [label, setLabel] = useState(connection.description || '');
  const [connectionType, setConnectionType] = useState(connection.connection_type || 'default');

  const fromEvent = events.find(e => e.id === connection.from);
  const toEvent = events.find(e => e.id === connection.to);
  const typeInfo = CONNECTION_TYPES[connectionType] || CONNECTION_TYPES.default;

  const handleSave = () => {
    onSave({
      ...connection,
      description: label,
      connection_type: connectionType
    });
  };

  return (
    <div className="connection-edit-modal-overlay" onClick={onCancel}>
      <div className="connection-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-edit-header">
          <h2>Edit Connection</h2>
          <button className="modal-close-btn" onClick={onCancel}>&times;</button>
        </div>

        <div className="connection-edit-body">
          <div className="form-group">
            <label style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              {fromEvent?.title || 'Unknown'} &rarr; {toEvent?.title || 'Unknown'}
            </label>
          </div>

          <div className="form-group">
            <label>Label:</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. If players succeed..."
            />
          </div>

          <div className="form-group">
            <label>Connection Type:</label>
            <select
              value={connectionType}
              onChange={(e) => setConnectionType(e.target.value)}
            >
              {Object.entries(CONNECTION_TYPES).map(([key, info]) => (
                <option key={key} value={key}>{info.label} - {info.description}</option>
              ))}
            </select>

            <div className="connection-type-preview">
              <div className="connection-color-swatch" style={{ backgroundColor: typeInfo.color }} />
              <span className="connection-type-label">{typeInfo.description}</span>
            </div>
          </div>
        </div>

        <div className="connection-edit-actions">
          <button className="connection-delete-btn" onClick={() => onDelete(connection)}>
            Delete Connection
          </button>
          <div className="connection-save-group">
            <button onClick={onCancel} className="cancel-btn">Cancel</button>
            <button onClick={handleSave} className="save-btn">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CONNECTION_TYPES };
export default ConnectionEditModal;
