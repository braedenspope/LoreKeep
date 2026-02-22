import React from 'react';
import './LoreMap.css';

const EventNode = ({
  event,
  isSelected,
  isConnectionSource,
  isCompleted,
  conditionStatus,
  onClick,
  onDoubleClick
}) => {
  return (
    <div
      data-event-id={event.id}
      className={`event-node
        ${event.isPartyLocation ? 'party-location' : ''}
        ${isSelected ? 'selected' : ''}
        ${isConnectionSource ? 'connection-source' : ''}
        ${!conditionStatus.accessible ? 'conditional-locked' : ''}
        ${isCompleted ? 'completed' : ''}
      `}
      style={{
        position: 'absolute',
        left: `${event.position.x}px`,
        top: `${event.position.y}px`,
        zIndex: 10,
        opacity: conditionStatus.accessible ? 1 : 0.6
      }}
      onClick={(e) => onClick(event, e)}
      onDoubleClick={(e) => onDoubleClick(event, e)}
      title={!conditionStatus.accessible ? conditionStatus.reason : event.description}
    >
      {event.order_number && (
        <div className="event-order-badge">{event.order_number}</div>
      )}
      <h3>{event.title}</h3>
      <div className="event-location">{event.location}</div>

      {/* Enhanced condition indicators */}
      {!conditionStatus.accessible && (
        <div className="condition-indicator locked" title={conditionStatus.reason}>🔒</div>
      )}
      {isCompleted && (
        <div className="condition-indicator completed" title="Event completed">✅</div>
      )}
      {event.conditions && event.conditions.length > 0 && conditionStatus.accessible && (
        <div className="condition-indicator has-conditions" title="Has conditions (met)">⚙️</div>
      )}
      {event.battle_map_url && (
        <div className="condition-indicator has-map" title="Has battle map">🗺️</div>
      )}
    </div>
  );
};

export default EventNode;
