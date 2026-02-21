import React, { useMemo, useCallback } from 'react';
import './Minimap.css';

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 140;
const PADDING = 200;

const Minimap = ({ events, viewport, containerRef, selectedEvent, onNavigate }) => {
  // Compute world bounding box from all events
  const worldBounds = useMemo(() => {
    if (!events || events.length === 0) {
      return { minX: -500, minY: -500, maxX: 500, maxY: 500 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const event of events) {
      const { x, y } = event.position;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    return {
      minX: minX - PADDING,
      minY: minY - PADDING,
      maxX: maxX + PADDING,
      maxY: maxY + PADDING
    };
  }, [events]);

  const worldWidth = worldBounds.maxX - worldBounds.minX;
  const worldHeight = worldBounds.maxY - worldBounds.minY;
  const minimapScale = Math.min(MINIMAP_WIDTH / worldWidth, MINIMAP_HEIGHT / worldHeight);

  // Convert world coords to minimap coords
  const worldToMinimap = useCallback((wx, wy) => ({
    x: (wx - worldBounds.minX) * minimapScale,
    y: (wy - worldBounds.minY) * minimapScale
  }), [worldBounds, minimapScale]);

  // Compute viewport rectangle in minimap coords
  const viewportRect = useMemo(() => {
    const container = containerRef?.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const visibleLeft = -viewport.x / viewport.scale;
    const visibleTop = -viewport.y / viewport.scale;
    const visibleWidth = rect.width / viewport.scale;
    const visibleHeight = rect.height / viewport.scale;

    const topLeft = worldToMinimap(visibleLeft, visibleTop);
    const size = {
      width: visibleWidth * minimapScale,
      height: visibleHeight * minimapScale
    };

    return {
      left: topLeft.x,
      top: topLeft.y,
      width: size.width,
      height: size.height
    };
  }, [viewport, containerRef, worldToMinimap, minimapScale]);

  // Click to navigate
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!onNavigate) return;

    const minimapRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - minimapRect.left;
    const clickY = e.clientY - minimapRect.top;

    // Convert minimap coords back to world coords
    const worldX = clickX / minimapScale + worldBounds.minX;
    const worldY = clickY / minimapScale + worldBounds.minY;

    onNavigate(worldX, worldY);
  }, [onNavigate, minimapScale, worldBounds]);

  return (
    <div className="minimap" onClick={handleClick} onMouseDown={(e) => e.stopPropagation()}>
      <span className="minimap-label">Map</span>

      {events.map(event => {
        const pos = worldToMinimap(event.position.x, event.position.y);
        const isSelected = selectedEvent?.id === event.id;
        const isParty = event.isPartyLocation;

        let className = 'minimap-event-dot';
        if (isSelected) className += ' selected';
        else if (isParty) className += ' party-location';

        return (
          <div
            key={event.id}
            className={className}
            style={{ left: pos.x, top: pos.y }}
          />
        );
      })}

      {viewportRect && (
        <div
          className="minimap-viewport-rect"
          style={{
            left: viewportRect.left,
            top: viewportRect.top,
            width: viewportRect.width,
            height: viewportRect.height
          }}
        />
      )}
    </div>
  );
};

export default Minimap;
