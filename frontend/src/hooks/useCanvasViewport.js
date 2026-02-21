import { useState, useRef, useCallback, useEffect } from 'react';

const useCanvasViewport = ({ events, setEvents, isCreatingConnection }) => {
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Event dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX, screenY) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: screenX, y: screenY };

    // Get position relative to the canvas container
    const relativeX = screenX - containerRect.left;
    const relativeY = screenY - containerRect.top;

    // Convert to world coordinates
    return {
      x: (relativeX - viewport.x) / viewport.scale,
      y: (relativeY - viewport.y) / viewport.scale
    };
  }, [viewport]);

  // Get the center of the current viewport in world coordinates
  const getViewportCenter = useCallback(() => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: 0, y: 0 };

    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    return {
      x: (centerX - viewport.x) / viewport.scale,
      y: (centerY - viewport.y) / viewport.scale
    };
  }, [viewport]);

  // Handle mouse down for panning and dragging
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();

    if (e.button === 2) { // Right mouse button - start panning
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Left mouse button - check if clicking on an event for dragging
    const target = e.target.closest('.event-node');
    if (target && !isCreatingConnection) {
      const eventId = parseInt(target.dataset.eventId);
      const event = events.find(e => e.id === eventId);

      if (event) {
        setIsDragging(true);
        setDraggedEvent(event);

        // Calculate offset from event position to mouse
        const worldMouse = screenToWorld(e.clientX, e.clientY);
        setDragOffset({
          x: worldMouse.x - event.position.x,
          y: worldMouse.y - event.position.y,
        });
      }
    }
  }, [events, isCreatingConnection, screenToWorld]);

  // Handle mouse move for panning and dragging
  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;

      setViewport(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (isDragging && draggedEvent) {
      const worldPos = screenToWorld(e.clientX, e.clientY);

      setEvents(events.map(evt =>
        evt.id === draggedEvent.id
          ? {
              ...evt,
              position: {
                x: worldPos.x - dragOffset.x,
                y: worldPos.y - dragOffset.y
              }
            }
          : evt
      ));
    }
  }, [isPanning, lastPanPoint, isDragging, draggedEvent, dragOffset, screenToWorld, events, setEvents]);

  // Handle mouse up to stop panning and dragging
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedEvent(null);
  }, []);

  // Handle wheel for zooming
  const handleWheel = useCallback((e) => {
    e.preventDefault();

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, viewport.scale * scaleFactor));

    // Zoom towards mouse position
    const newX = mouseX - (mouseX - viewport.x) * (newScale / viewport.scale);
    const newY = mouseY - (mouseY - viewport.y) * (newScale / viewport.scale);

    setViewport({
      x: newX,
      y: newY,
      scale: newScale
    });
  }, [viewport]);

  // Attach global mouse events and non-passive wheel listener
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleMouseMove, handleMouseUp, handleWheel]);

  // Reset viewport to show all events
  const handleResetView = () => {
    if (events.length === 0) {
      setViewport({ x: 0, y: 0, scale: 1 });
      return;
    }

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Calculate bounds of all events
    const positions = events.map(e => e.position);
    const minX = Math.min(...positions.map(p => p.x)) - 100;
    const maxX = Math.max(...positions.map(p => p.x)) + 250; // Account for event width
    const minY = Math.min(...positions.map(p => p.y)) - 100;
    const maxY = Math.max(...positions.map(p => p.y)) + 100;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate scale to fit all events with padding
    const scaleX = (containerRect.width * 0.8) / contentWidth;
    const scaleY = (containerRect.height * 0.8) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale larger than 1:1

    // Center the content
    setViewport({
      x: containerRect.width / 2 - centerX * scale,
      y: containerRect.height / 2 - centerY * scale,
      scale: scale
    });
  };

  const handleResetViewport = () => {
    setViewport({ x: 0, y: 0, scale: 1 });
  };

  return {
    viewport,
    setViewport,
    containerRef,
    canvasRef,
    handleMouseDown,
    handleResetView,
    handleResetViewport,
    getViewportCenter
  };
};

export default useCanvasViewport;
