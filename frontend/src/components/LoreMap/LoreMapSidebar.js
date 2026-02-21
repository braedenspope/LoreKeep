import React from 'react';
import './LoreMap.css';

const LoreMapSidebar = ({
  selectedEvent,
  eventStates,
  viewport,
  onCreateEvent,
  onResetView,
  onResetViewport,
  onEditEvent,
  onStartConnection,
  onDeleteEvent,
  onToggleCompleted
}) => {
  return (
    <div className="lore-map-sidebar">
      <div className="sidebar-controls">
        <h3>Map Controls</h3>

        <button
          className="control-btn primary"
          onClick={onCreateEvent}
          title="Create new event at center of view"
        >
          📝 New Event
        </button>

        <button
          className="control-btn secondary"
          onClick={onResetView}
          title="Reset view to show all events"
        >
          🔍 Fit All
        </button>

        <button
          className="control-btn secondary"
          onClick={onResetViewport}
          title="Reset to origin"
        >
          🏠 Reset View
        </button>

        {selectedEvent && (
          <>
            <hr />
            <div className="selected-event-controls">
              <h4>Selected Event</h4>
              <p><strong>{selectedEvent.title}</strong></p>
              <button
                className="control-btn primary"
                onClick={() => onEditEvent(selectedEvent)}
              >
                ✏️ Edit
              </button>
              <button
                className="control-btn secondary"
                onClick={() => onStartConnection(selectedEvent)}
              >
                🔗 Connect
              </button>
              <button
                className="control-btn secondary"
                onClick={onDeleteEvent}
              >
                🗑️ Delete
              </button>
              <button
                className="control-btn secondary"
                onClick={() => onToggleCompleted(selectedEvent.id)}
              >
                {eventStates[`event_${selectedEvent.id}_completed`] ? '☑️ Complete' : '⬜ Incomplete'}
              </button>
            </div>
          </>
        )}

        <hr />
        <div className="viewport-info">
          <h4>Viewport Info</h4>
          <p>Scale: {(viewport.scale * 100).toFixed(0)}%</p>
          <p>Position: ({Math.round(viewport.x)}, {Math.round(viewport.y)})</p>
          <small>Right-click and drag to pan</small>
          <small>Mouse wheel to zoom</small>
        </div>
      </div>
    </div>
  );
};

export default LoreMapSidebar;
