import React from 'react';
import { computeConnectionEndpoints } from '../../utils/connectionGeometry';

const ConnectionRenderer = ({ connections, events, viewport, connectionStart }) => {
  return connections.map((connection, index) => {
    const fromEvent = events.find(e => e.id === connection.from);
    const toEvent = events.find(e => e.id === connection.to);

    if (!fromEvent || !toEvent) return null;

    const { fromScreenX, fromScreenY, toScreenX, toScreenY } = computeConnectionEndpoints(fromEvent, toEvent, viewport);

    return (
      <line
        key={index}
        x1={fromScreenX}
        y1={fromScreenY}
        x2={toScreenX}
        y2={toScreenY}
        stroke={connectionStart && connectionStart.id === fromEvent.id ? "#3498db" : "#8b4513"}
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    );
  });
};

export default ConnectionRenderer;
