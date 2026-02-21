import React from 'react';
import { getEdgePoint } from '../../utils/connectionGeometry';

const ConnectionRenderer = ({ connections, events, connectionStart, containerRef }) => {
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

    return (
      <line
        key={index}
        x1={fromEdge.x}
        y1={fromEdge.y}
        x2={toEdge.x}
        y2={toEdge.y}
        stroke={connectionStart && connectionStart.id === fromEvent.id ? "#3498db" : "#8b4513"}
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    );
  });
};

export default ConnectionRenderer;
