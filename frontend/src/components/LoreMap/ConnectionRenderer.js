import React from 'react';
import { getEdgePoint } from '../../utils/connectionGeometry';

const CONNECTION_COLORS = {
  default: '#8b4513',
  success: '#4a6741',
  failure: '#7b2d26',
  optional: '#5a7a8a'
};

const ConnectionRenderer = ({ connections, events, connectionStart, containerRef, onConnectionClick }) => {
  const containerRect = containerRef.current?.getBoundingClientRect();
  if (!containerRect) return null;

  return connections.map((connection, index) => {
    const fromEvent = events.find(e => e.id === connection.from);
    const toEvent = events.find(e => e.id === connection.to);

    if (!fromEvent || !toEvent) return null;

    // Look up actual DOM nodes to get real rendered dimensions
    const fromNode = containerRef.current.querySelector(`[data-event-id="${fromEvent.id}"]`);
    const toNode = containerRef.current.querySelector(`[data-event-id="${toEvent.id}"]`);

    if (!fromNode || !toNode) return null;

    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();

    // Compute centers relative to the container
    const fromCenterX = fromRect.left - containerRect.left + fromRect.width / 2;
    const fromCenterY = fromRect.top - containerRect.top + fromRect.height / 2;
    const toCenterX = toRect.left - containerRect.left + toRect.width / 2;
    const toCenterY = toRect.top - containerRect.top + toRect.height / 2;

    // Direction vector
    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    // Use actual half-dimensions for each node
    const fromEdge = getEdgePoint(fromCenterX, fromCenterY, fromRect.width / 2, fromRect.height / 2, dx, dy);
    const toEdge = getEdgePoint(toCenterX, toCenterY, toRect.width / 2, toRect.height / 2, -dx, -dy);

    const connType = connection.connection_type || 'default';
    const strokeColor = connectionStart && connectionStart.id === fromEvent.id
      ? '#5a7a8a'
      : (CONNECTION_COLORS[connType] || CONNECTION_COLORS.default);

    const markerId = `arrowhead-${connType}`;
    const midX = (fromEdge.x + toEdge.x) / 2;
    const midY = (fromEdge.y + toEdge.y) / 2;

    return (
      <g key={index}>
        {/* Invisible wider hit area for clicking */}
        {onConnectionClick && (
          <line
            x1={fromEdge.x}
            y1={fromEdge.y}
            x2={toEdge.x}
            y2={toEdge.y}
            stroke="transparent"
            strokeWidth="12"
            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onConnectionClick(connection, e);
            }}
          />
        )}
        <line
          x1={fromEdge.x}
          y1={fromEdge.y}
          x2={toEdge.x}
          y2={toEdge.y}
          stroke={strokeColor}
          strokeWidth="2"
          markerEnd={`url(#${markerId})`}
          style={{ pointerEvents: 'none' }}
        />
        {connection.description && (
          <text
            x={midX}
            y={midY - 8}
            textAnchor="middle"
            className="connection-label-text"
            style={{ pointerEvents: 'none' }}
          >
            {connection.description}
          </text>
        )}
      </g>
    );
  });
};

export { CONNECTION_COLORS };
export default ConnectionRenderer;
