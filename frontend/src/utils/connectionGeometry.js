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
