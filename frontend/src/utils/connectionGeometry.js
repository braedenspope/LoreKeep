// Event node dimensions (must match CSS: width 150px + 12px padding each side + 2px border each side)
export const NODE_WIDTH = 178;
export const NODE_HEIGHT = 50;

// Find the edge intersection point for a rectangle centered at (cx, cy)
export const getEdgePoint = (cx, cy, halfW, halfH, dirX, dirY) => {
  if (dirX === 0 && dirY === 0) return { x: cx, y: cy };

  const absDx = Math.abs(dirX);
  const absDy = Math.abs(dirY);

  // Compare slopes to determine which edge is hit
  let t;
  if (absDx * halfH > absDy * halfW) {
    // Hits left or right edge
    t = halfW / absDx;
  } else {
    // Hits top or bottom edge
    t = halfH / absDy;
  }

  return {
    x: cx + dirX * t,
    y: cy + dirY * t
  };
};

// Compute connection line endpoints between two events, returning screen coordinates
export const computeConnectionEndpoints = (fromEvent, toEvent, viewport) => {
  const halfW = NODE_WIDTH / 2;
  const halfH = NODE_HEIGHT / 2;

  // Center of each event in world coordinates
  const fromCenterX = fromEvent.position.x + halfW;
  const fromCenterY = fromEvent.position.y + halfH;
  const toCenterX = toEvent.position.x + halfW;
  const toCenterY = toEvent.position.y + halfH;

  // Direction vector from "from" center to "to" center
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  // From-event: edge closest to to-event (direction: dx, dy)
  const fromEdge = getEdgePoint(fromCenterX, fromCenterY, halfW, halfH, dx, dy);
  // To-event: edge closest to from-event (direction: -dx, -dy)
  const toEdge = getEdgePoint(toCenterX, toCenterY, halfW, halfH, -dx, -dy);

  // Convert to screen coordinates
  return {
    fromScreenX: fromEdge.x * viewport.scale + viewport.x,
    fromScreenY: fromEdge.y * viewport.scale + viewport.y,
    toScreenX: toEdge.x * viewport.scale + viewport.x,
    toScreenY: toEdge.y * viewport.scale + viewport.y
  };
};
