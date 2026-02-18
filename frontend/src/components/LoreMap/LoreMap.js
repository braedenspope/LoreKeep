import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LoreMap.css';
import EventConditions from './EventConditions';
import config from '../../config';

const LoreMap = ({ initialEvents, initialConnections, onChange, loreMapId }) => {
  const [events, setEvents] = useState(initialEvents || []);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [connections, setConnections] = useState(initialConnections || []);
  
  // Canvas panning and viewport state
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // Event dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Connection creation state
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  
  // Character and battle map state
  const [characters, setCharacters] = useState([]);
  const [eventCharacters, setEventCharacters] = useState([]);
  const [eventStates, setEventStates] = useState({});
  const [battleMapFile, setBattleMapFile] = useState(null);
  const [battleMapPreview, setBattleMapPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

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

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX, worldY) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: worldX, y: worldY };
    
    return {
      x: worldX * viewport.scale + viewport.x + containerRect.left,
      y: worldY * viewport.scale + viewport.y + containerRect.top
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

  // Update parent component when data changes
  useEffect(() => {
    if (onChange) {
      onChange({
        id: loreMapId,
        events: events,
        connections: connections
      });
    }
  }, [events, connections, onChange, loreMapId]);

  // Initialize from props
  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setEvents(initialEvents);
    }
    if (initialConnections && initialConnections.length > 0) {
      setConnections(initialConnections);
    }
  }, [initialEvents, initialConnections]);

  // Fetch characters
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/characters`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCharacters(data);
        }
      } catch (err) {
        // Failed to fetch characters
      }
    };
    
    fetchCharacters();
  }, []);

  // Fetch event characters when editing an event
  useEffect(() => {
    if (editingEvent && editingEvent.id && editingEvent.id <= 1000000) {
      const fetchEventCharacters = async () => {
        try {
          const response = await fetch(`${config.apiUrl}/api/events/${editingEvent.id}/characters`, {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            setEventCharacters(data.map(ec => ec.character_id));
          }
        } catch (err) {
          setEventCharacters([]);
        }
      };
      
      fetchEventCharacters();
      
      if (editingEvent.battle_map_url) {
        setBattleMapPreview(`${config.apiUrl}${editingEvent.battle_map_url}`);
      }
    } else {
      setEventCharacters([]);
      setBattleMapPreview(null);
    }
  }, [editingEvent]);

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
  }, [isPanning, lastPanPoint, isDragging, draggedEvent, dragOffset, screenToWorld, events]);

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

  // Attach global mouse events
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Create a new event at viewport center
  const handleCreateEventAtCenter = () => {
    const centerPos = getViewportCenter();
    
    const newEvent = {
      id: Date.now(),
      title: 'New Event',
      description: '',
      location: '',
      isPartyLocation: false,
      position: centerPos,
      conditions: []
    };
    
    setEvents([...events, newEvent]);
    setSelectedEvent(newEvent);
  };

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

  // Enhanced event condition checking with detailed reasons
  const checkEventConditions = (event) => {
    let conditions = [];
    
    if (event.conditions) {
      if (Array.isArray(event.conditions)) {
        conditions = event.conditions;
      } else if (typeof event.conditions === 'string') {
        try {
          conditions = JSON.parse(event.conditions);
        } catch (e) {
          conditions = [];
        }
      } else if (typeof event.conditions === 'object') {
        conditions = [event.conditions];
      }
    }
    
    if (!conditions || conditions.length === 0) {
      return { accessible: true, reason: null };
    }
    
    for (let condition of conditions) {
      let isMet = false;
      let reason = '';
      
      switch (condition.type) {
        case 'event_completed':
          const isCompleted = eventStates[`event_${condition.target}_completed`] || false;
          isMet = condition.required ? isCompleted : !isCompleted;
          reason = condition.required 
            ? `Requires "${getEventName(condition.target)}" to be completed`
            : `Requires "${getEventName(condition.target)}" to NOT be completed`;
          break;
          
        case 'character_freed':
          const isFreed = eventStates[`character_${condition.target}_freed`] || false;
          isMet = condition.required ? isFreed : !isFreed;
          reason = condition.required 
            ? `Requires "${getCharacterName(condition.target)}" to be freed`
            : `Requires "${getCharacterName(condition.target)}" to NOT be freed`;
          break;
          
        case 'character_alive':
          const isAlive = eventStates[`character_${condition.target}_alive`] !== false;
          isMet = condition.required ? isAlive : !isAlive;
          reason = condition.required 
            ? `Requires "${getCharacterName(condition.target)}" to be alive`
            : `Requires "${getCharacterName(condition.target)}" to be dead`;
          break;
          
        case 'custom':
          const customState = eventStates[`custom_${condition.id}`] || false;
          isMet = condition.required ? customState : !customState;
          reason = condition.description || 'Custom condition not met';
          break;
          
        default:
          isMet = true;
      }
      
      if (!isMet) {
        return { accessible: false, reason };
      }
    }
    
    return { accessible: true, reason: null };
  };

  // Helper functions for condition checking
  const getEventName = (eventId) => {
    const event = events.find(e => e.id.toString() === eventId);
    return event ? event.title : 'Unknown Event';
  };

  const getCharacterName = (characterId) => {
    const character = characters.find(c => c.id.toString() === characterId);
    return character ? character.name : 'Unknown Character';
  };

  // Toggle event completion state
  const toggleEventCompleted = (eventId) => {
    const key = `event_${eventId}_completed`;
    setEventStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle event click
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    
    if (isCreatingConnection && connectionStart && connectionStart.id !== event.id) {
      const newConnection = {
        id: Date.now(),
        from: connectionStart.id,
        to: event.id,
        description: ''
      };
      
      setConnections([...connections, newConnection]);
      setIsCreatingConnection(false);
      setConnectionStart(null);
      return;
    }
    
    setSelectedEvent(event);
  };

  // Handle event double click
  const handleEventDoubleClick = (event, e) => {
    e.stopPropagation();
    
    if (isCreatingConnection) return;
    
    const eventToEdit = {
      ...event,
      conditions: event.conditions || []
    };
    
    setEditingEvent(eventToEdit);
    setBattleMapFile(null);
    
    if (event.battle_map_url) {
      setBattleMapPreview(`${config.apiUrl}${event.battle_map_url}`);
    } else {
      setBattleMapPreview(null);
    }
  };

  // Canvas click handler
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.closest('.lore-map-canvas')) {
      if (isCreatingConnection) {
        setIsCreatingConnection(false);
        setConnectionStart(null);
        return;
      }
      
      setSelectedEvent(null);
    }
  };

  // Enhanced battle map file upload with validation
  const handleBattleMapUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file using config utility
    const validation = config.validateImageFile(file);
    
    if (!validation.valid) {
      alert(`Upload failed: ${validation.error}`);
      e.target.value = ''; // Reset file input
      return;
    }
    
    setBattleMapFile(file);
    setUploadProgress(true);
    
    // Show loading state while creating preview
    setBattleMapPreview(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setBattleMapPreview(e.target.result);
      setUploadProgress(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file. Please try again.');
      setBattleMapFile(null);
      setUploadProgress(false);
    };
    reader.readAsDataURL(file);
  };

  // Remove battle map
  const handleRemoveBattleMap = async () => {
    if (editingEvent && editingEvent.id && editingEvent.id <= 1000000) {
      try {
        const response = await fetch(`${config.apiUrl}/api/events/${editingEvent.id}/battle-map`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          setBattleMapFile(null);
          setBattleMapPreview(null);
          setEditingEvent({
            ...editingEvent,
            battle_map_url: null
          });
        } else {
          throw new Error('Failed to remove battle map from server');
        }
      } catch (err) {
        alert(`Failed to remove battle map: ${err.message}`);
      }
    } else {
      setBattleMapFile(null);
      setBattleMapPreview(null);
      if (editingEvent) {
        setEditingEvent({
          ...editingEvent,
          battle_map_url: null
        });
      }
    }
  };

  // Handle conditions change for editing event
  const handleConditionsChange = (newConditions) => {
    if (!editingEvent) return;
    
    setEditingEvent({
      ...editingEvent,
      conditions: newConditions
    });
  };

  // FIXED: Add character to event with better error handling
  const handleAddCharacterToEvent = async (characterId) => {
    const parsedCharacterId = parseInt(characterId, 10);
    
    if (!editingEvent || !parsedCharacterId || eventCharacters.includes(parsedCharacterId)) {
      return;
    }
    
    try {
      // Check if this is a saved event (has a real ID from backend)
      if (editingEvent.id && editingEvent.id <= 1000000) {
        const response = await fetch(`${config.apiUrl}/api/events/${editingEvent.id}/characters`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            character_id: parsedCharacterId,
            role: 'present'
          })
        });
        
        if (response.ok) {
          setEventCharacters([...eventCharacters, parsedCharacterId]);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server responded with status ${response.status}`);
        }
      } else {
        setEventCharacters([...eventCharacters, parsedCharacterId]);
      }
    } catch (err) {
      alert(`Failed to add character: ${err.message}`);
    }
  };

  const handleRemoveCharacterFromEvent = async (characterId) => {
    if (!editingEvent) return;

    try {
      if (editingEvent.id && editingEvent.id <= 1000000) {
        const response = await fetch(`${config.apiUrl}/api/events/${editingEvent.id}/characters/${characterId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          setEventCharacters(eventCharacters.filter(id => id !== characterId));
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server responded with status ${response.status}`);
        }
      } else {
        setEventCharacters(eventCharacters.filter(id => id !== characterId));
      }
    } catch (err) {
      alert(`Failed to remove character: ${err.message}`);
    }
  };

  // Enhanced save event with better error handling
  const handleSaveEvent = async () => {
    if (!editingEvent) return;
    
    try {
      let updatedEvent = { ...editingEvent };
      
      if (editingEvent.id && editingEvent.id <= 1000000) {
        // Handle battle map upload with validation
        if (battleMapFile) {
          // Double-check file validation before upload
          const validation = config.validateImageFile(battleMapFile);
          if (!validation.valid) {
            alert(`Cannot save: ${validation.error}`);
            return;
          }
          
          const formData = new FormData();
          formData.append('battle_map', battleMapFile);
          
          const uploadResponse = await fetch(`${config.apiUrl}/api/events/${editingEvent.id}/battle-map`, {
            method: 'POST',
            credentials: 'include',
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            updatedEvent.battle_map_url = uploadData.battle_map_url;
          } else {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || 'Failed to upload battle map');
          }
        }
        
        // Save other event data
        const response = await fetch(`${config.apiUrl}/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: updatedEvent.title,
            description: updatedEvent.description,
            location: updatedEvent.location,
            position: updatedEvent.position,
            is_party_location: updatedEvent.isPartyLocation,
            conditions: updatedEvent.conditions,
            battle_map_url: updatedEvent.battle_map_url
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update event');
        }
        
        const backendEvent = await response.json();
        updatedEvent = {
          ...updatedEvent,
          battle_map_url: backendEvent.battle_map_url
        };
      }
      
      // Update local state
      setEvents(events.map(evt => 
        evt.id === editingEvent.id ? updatedEvent : evt
      ));
      
      if (selectedEvent && selectedEvent.id === editingEvent.id) {
        setSelectedEvent(updatedEvent);
      }
      
      setEditingEvent(null);
      setBattleMapFile(null);
      setBattleMapPreview(null);
      
      alert('Event saved successfully!');
      
    } catch (err) {
      alert(`Failed to save event: ${err.message}`);
    }
  };

  // Cancel event editing
  const handleCancelEdit = () => {
    setEditingEvent(null);
    setBattleMapFile(null);
    setBattleMapPreview(null);
    setEventCharacters([]);
    setUploadProgress(false);
  };

  // Delete an event
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    if (!window.confirm(`Are you sure you want to delete "${selectedEvent.title}"?`)) {
      return;
    }
    
    setEvents(events.filter(e => e.id !== selectedEvent.id));
    setConnections(connections.filter(
      c => c.from !== selectedEvent.id && c.to !== selectedEvent.id
    ));
    
    setSelectedEvent(null);
  };

  // Render connections between events
  const renderConnections = () => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;

    return connections.map((connection, index) => {
      const fromEvent = events.find(e => e.id === connection.from);
      const toEvent = events.find(e => e.id === connection.to);

      if (!fromEvent || !toEvent) return null;

      // Event node dimensions (must match CSS: width 150px + 12px padding each side + 2px border each side)
      const nodeWidth = 178;
      const nodeHeight = 50;

      // Center of each event in world coordinates
      const fromCenterX = fromEvent.position.x + nodeWidth / 2;
      const fromCenterY = fromEvent.position.y + nodeHeight / 2;
      const toCenterX = toEvent.position.x + nodeWidth / 2;
      const toCenterY = toEvent.position.y + nodeHeight / 2;

      // Direction vector from "from" center to "to" center
      const dx = toCenterX - fromCenterX;
      const dy = toCenterY - fromCenterY;

      // Find the edge intersection point for a rectangle centered at (0,0)
      const getEdgePoint = (cx, cy, halfW, halfH, dirX, dirY) => {
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

      const halfW = nodeWidth / 2;
      const halfH = nodeHeight / 2;

      // From-event: edge closest to to-event (direction: dx, dy)
      const fromEdge = getEdgePoint(fromCenterX, fromCenterY, halfW, halfH, dx, dy);
      // To-event: edge closest to from-event (direction: -dx, -dy)
      const toEdge = getEdgePoint(toCenterX, toCenterY, halfW, halfH, -dx, -dy);

      // Convert to screen coordinates
      const fromScreenX = fromEdge.x * viewport.scale + viewport.x;
      const fromScreenY = fromEdge.y * viewport.scale + viewport.y;
      const toScreenX = toEdge.x * viewport.scale + viewport.x;
      const toScreenY = toEdge.y * viewport.scale + viewport.y;

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

  return (
    <div className="lore-map-container">
      {/* Left sidebar with controls */}
      <div className="lore-map-sidebar">
        <div className="sidebar-controls">
          <h3>Map Controls</h3>
          
          <button 
            className="control-btn primary"
            onClick={handleCreateEventAtCenter}
            title="Create new event at center of view"
          >
            📝 New Event
          </button>
          
          <button 
            className="control-btn secondary"
            onClick={handleResetView}
            title="Reset view to show all events"
          >
            🔍 Fit All
          </button>
          
          <button 
            className="control-btn secondary"
            onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
            title="Reset to origin"
          >
            🏠 Reset View
          </button>
          
          {selectedEvent && (
            <>
              <hr />
              <div className="selected-event-controls">
                <h4>Selected Event</h4>
                <p><strong>{selectedEvent.title}</strong></p>
                <button 
                  className="control-btn primary"
                  onClick={() => handleEventDoubleClick(selectedEvent, { stopPropagation: () => {} })}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="control-btn secondary"
                  onClick={() => {
                    if (!selectedEvent) return;
                    setIsCreatingConnection(true);
                    setConnectionStart(selectedEvent);
                    setSelectedEvent(null);
                  }}
                >
                  🔗 Connect
                </button>
                <button 
                  className="control-btn secondary"
                  onClick={handleDeleteEvent}
                >
                  🗑️ Delete
                </button>
                <button 
                  className="control-btn secondary"
                  onClick={() => toggleEventCompleted(selectedEvent.id)}
                >
                  {eventStates[`event_${selectedEvent.id}_completed`] ? '☑️ Complete' : '⬜ Incomplete'}
                </button>
              </div>
            </>
          )}
          
          <hr />
          <div className="viewport-info">
            <h4>Viewport Info</h4>
            <p>Scale: {(viewport.scale * 100).toFixed(0)}%</p>
            <p>Position: ({Math.round(viewport.x)}, {Math.round(viewport.y)})</p>
            <small>Right-click and drag to pan</small>
            <small>Mouse wheel to zoom</small>
          </div>
        </div>
      </div>
      
      {/* Main canvas area */}
      <div className="lore-map-main">
        <div 
          ref={containerRef}
          className="lore-map-canvas-container"
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          onClick={handleCanvasClick}
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
              zIndex: 5
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
            {renderConnections()}
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
                <div
                  key={event.id}
                  data-event-id={event.id}
                  className={`event-node 
                    ${event.isPartyLocation ? 'party-location' : ''} 
                    ${selectedEvent?.id === event.id ? 'selected' : ''} 
                    ${connectionStart?.id === event.id ? 'connection-source' : ''}
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
                  onClick={(e) => handleEventClick(event, e)}
                  onDoubleClick={(e) => handleEventDoubleClick(event, e)}
                  title={!conditionStatus.accessible ? conditionStatus.reason : event.description}
                >
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
      
      {/* Event editing modal */}
      {editingEvent && (
        <div className="event-edit-modal-overlay">
          <div className="event-edit-modal">
            <div className="event-edit-header">
              <h2>Edit Event</h2>
              <button className="modal-close-btn" onClick={handleCancelEdit}>×</button>
            </div>
            
            <div className="event-edit-content">
              <div className="event-edit-left">
                <div className="form-group">
                  <label>Event Title:</label>
                  <input 
                    type="text" 
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Location:</label>
                  <input 
                    type="text" 
                    value={editingEvent.location}
                    onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Description:</label>
                  <textarea 
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                    rows="6"
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={editingEvent.isPartyLocation}
                      onChange={(e) => setEditingEvent({...editingEvent, isPartyLocation: e.target.checked})}
                    />
                    Party is currently here
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={eventStates[`event_${editingEvent.id}_completed`] || false}
                      onChange={() => toggleEventCompleted(editingEvent.id)}
                    />
                    Mark as completed
                  </label>
                </div>
                
                {/* FIXED: Characters Section with better error handling */}
                <div className="characters-section">
                  <h3>Characters Present</h3>
                  <div className="character-select">
                    <select 
                      value="" 
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddCharacterToEvent(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Add a character...</option>
                      {characters
                        .filter(char => !eventCharacters.includes(char.id))
                        .map(char => (
                          <option key={char.id} value={char.id}>
                            {char.name} ({char.character_type})
                            {char.is_official && ' - Official'}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div className="character-list">
                    {eventCharacters.length === 0 ? (
                      <p className="no-characters">No characters assigned to this event</p>
                    ) : (
                      <ul className="character-name-list">
                        {eventCharacters.map(charId => {
                          const character = characters.find(c => c.id === charId);
                          if (!character) return null;
                          
                          return (
                            <li key={charId} className="character-list-item">
                              <span className="character-name">{character.name}</span>
                              <span className="character-type">
                                ({character.character_type}
                                {character.is_official && ' - Official'})
                              </span>
                              <button 
                                className="remove-character-btn"
                                onClick={() => handleRemoveCharacterFromEvent(charId)}
                                title="Remove character"
                              >
                                ×
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="event-edit-right">
                {/* Enhanced Battle Map Section */}
                <div className="battle-map-section">
                  <h3>Battle Map</h3>
                  <div className="battle-map-upload">
                    <input
                      type="file"
                      id="battle-map-input"
                      accept="image/*"
                      onChange={handleBattleMapUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="battle-map-input" className="upload-btn">
                      Choose Battle Map Image
                    </label>
                    <div className="upload-help">
                      <small>Supported: PNG, JPG, GIF, WebP • Max size: 16MB</small>
                    </div>
                  </div>
                  
                  {uploadProgress && (
                    <div className="upload-progress">
                      Loading preview...
                    </div>
                  )}
                  
                  {battleMapPreview && (
                    <div className="battle-map-preview">
                      <img src={battleMapPreview} alt="Battle Map Preview" />
                      <button 
                        className="remove-map-btn"
                        onClick={handleRemoveBattleMap}
                      >
                        Remove Map
                      </button>
                      {battleMapFile && (
                        <div className="file-info">
                          <small>{battleMapFile.name} ({(battleMapFile.size / 1024 / 1024).toFixed(1)}MB)</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Event Conditions */}
                <EventConditions
                  conditions={editingEvent.conditions || []}
                  onConditionsChange={handleConditionsChange}
                  availableEvents={events.filter(e => e.id !== editingEvent.id)}
                  availableCharacters={characters}
                />
              </div>
            </div>
            
            <div className="event-edit-actions">
              <button onClick={handleSaveEvent} className="save-btn">Save Changes</button>
              <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoreMap;