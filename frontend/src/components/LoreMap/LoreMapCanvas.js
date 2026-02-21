import React from 'react';
import './LoreMap.css';
import EventNode from './EventNode';
import ConnectionRenderer from './ConnectionRenderer';

const LoreMapCanvas = ({
  containerRef,
  canvasRef,
  viewport,
  events,
  connections,
  selectedEvent,
  connectionStart,
  eventStates,
  isCreatingConnection,
  onMouseDown,
  onCanvasClick,
  onEventClick,
  onEventDoubleClick,
  checkEventConditions
}) => {
  return (
    <div className="lore-map-main">
      <div
        ref={containerRef}
        className="lore-map-canvas-container"
        onMouseDown={onMouseDown}
        onContextMenu={(e) => e.preventDefault()}
        onClick={onCanvasClick}
      >
        {/* SVG for connections - positioned relative to container */}
        <svg
          className="connections-svg"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#8b4513" />
            </marker>
          </defs>
          <ConnectionRenderer
            connections={connections}
            events={events}
            connectionStart={connectionStart}
            containerRef={containerRef}
          />
        </svg>

        <div
          ref={canvasRef}
          className="lore-map-canvas infinite"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Event nodes with enhanced condition indicators */}
          {events.map(event => {
            const conditionStatus = checkEventConditions(event);
            const isCompleted = eventStates[`event_${event.id}_completed`] || false;

            return (
              <EventNode
                key={event.id}
                event={event}
                isSelected={selectedEvent?.id === event.id}
                isConnectionSource={connectionStart?.id === event.id}
                isCompleted={isCompleted}
                conditionStatus={conditionStatus}
                onClick={onEventClick}
                onDoubleClick={onEventDoubleClick}
              />
            );
          })}

          {/* Grid background */}
          <div className="grid-background" />
        </div>

        {isCreatingConnection && (
          <div className="connection-help-text">
            Click on another event to create a connection, or click elsewhere to cancel.
          </div>
        )}
      </div>
    </div>
  );
};

export default LoreMapCanvas;
