import React from 'react';
import './LoreMap.css';

const LoreMapSidebar = ({
  selectedEvent,
  eventStates,
  onCreateEvent,
  onResetView,
  onResetViewport,
  onEditEvent,
  onStartConnection,
  onDeleteEvent,
  onToggleCompleted
}) => {
  return (
    <div className="lore-map-toolbar">
      <div className="toolbar-row">
        <button
          className="toolbar-btn primary"
          onClick={onCreateEvent}
          title="Create new event at center of view"
        >
          📝 New Event
        </button>

        <button
          className="toolbar-btn secondary"
          onClick={onResetView}
          title="Fit all events in view"
        >
          🔍 Fit All
        </button>

        <button
          className="toolbar-btn secondary"
          onClick={onResetViewport}
          title="Reset to origin"
        >
          🏠 Reset
        </button>
      </div>

      {selectedEvent && (
        <div className="toolbar-row selected-row">
          <span className="toolbar-selected-label" title={selectedEvent.title}>
            {selectedEvent.title}
          </span>
          <button
            className="toolbar-btn primary"
            onClick={() => onEditEvent(selectedEvent)}
            title="Edit event"
          >
            ✏️ Edit
          </button>
          <button
            className="toolbar-btn secondary"
            onClick={() => onStartConnection(selectedEvent)}
            title="Create connection"
          >
            🔗 Connect
          </button>
          <button
            className="toolbar-btn secondary"
            onClick={onDeleteEvent}
            title="Delete event"
          >
            🗑️ Delete
          </button>
          <button
            className="toolbar-btn secondary"
            onClick={() => onToggleCompleted(selectedEvent.id)}
            title="Toggle completion"
          >
            {eventStates[`event_${selectedEvent.id}_completed`] ? '☑️' : '⬜'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LoreMapSidebar;
