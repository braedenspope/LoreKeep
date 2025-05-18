// LoreMap.jsx - Add more functionality and data handling
import React, { useState, useEffect, useRef } from 'react';
import './LoreMap.css';

const LoreMap = ({ initialEvents, initialConnections, onChange, loreMapId }) => {
  const [events, setEvents] = useState(initialEvents || []);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventPosition, setNewEventPosition] = useState({ x: 0, y: 0 });
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    location: '',
    isPartyLocation: false,
  });
  const [connections, setConnections] = useState(initialConnections || []);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  
  const canvasRef = useRef(null);

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

  // Add these to your state variables
  const [characters, setCharacters] = useState([]);
  const [eventCharacters, setEventCharacters] = useState([]);

  // Add this useEffect to fetch characters
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/characters', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCharacters(data);
        }
      } catch (err) {
        console.error('Failed to fetch characters:', err);
      }
    };
    
    fetchCharacters();
  }, []);

  // Add this when an event is selected
  useEffect(() => {
    if (selectedEvent && selectedEvent.id) {
      const fetchEventCharacters = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/events/${selectedEvent.id}/characters`, {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            setEventCharacters(data.map(ec => ec.character_id));
          }
        } catch (err) {
          console.error('Failed to fetch event characters:', err);
        }
      };
      
      fetchEventCharacters();
    } else {
      setEventCharacters([]);
    }
  }, [selectedEvent]);

  // Add character to event
  const handleAddCharacterToEvent = async (characterId) => {
    if (!selectedEvent || !characterId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/events/${selectedEvent.id}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          character_id: characterId,
          role: 'present'
        })
      });
      
      if (response.ok) {
        setEventCharacters([...eventCharacters, characterId]);
      }
    } catch (err) {
      console.error('Failed to add character to event:', err);
    }
  };

  // Remove character from event
  const handleRemoveCharacterFromEvent = async (characterId) => {
    if (!selectedEvent) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/events/${selectedEvent.id}/characters/${characterId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setEventCharacters(eventCharacters.filter(id => id !== characterId));
      }
    } catch (err) {
      console.error('Failed to remove character from event:', err);
    }
  };

  // Canvas right-click for new event
  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    
    // If in connection mode, cancel it
    if (isCreatingConnection) {
      setIsCreatingConnection(false);
      setConnectionStart(null);
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNewEventPosition({ x, y });
    setIsCreatingEvent(true);
  };

  // Handle event click
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    
    // If in connection creation mode, complete the connection
    if (isCreatingConnection && connectionStart && connectionStart.id !== event.id) {
      // Create a new connection
      const newConnection = {
        id: Date.now(), // Temporary ID, will be replaced when saved to backend
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

  // Start creating a connection
  const handleAddConnection = () => {
    if (!selectedEvent) return;
    
    setIsCreatingConnection(true);
    setConnectionStart(selectedEvent);
    setSelectedEvent(null);
  };

  // Delete an event
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    // Remove the event
    setEvents(events.filter(e => e.id !== selectedEvent.id));
    
    // Remove connections to/from this event
    setConnections(connections.filter(
      c => c.from !== selectedEvent.id && c.to !== selectedEvent.id
    ));
    
    setSelectedEvent(null);
  };

  // Handle event drag start
  const handleEventDragStart = (e, event) => {
    e.stopPropagation();
    
    // Don't start dragging if in connection mode
    if (isCreatingConnection) return;
    
    setIsDragging(true);
    setDraggedEvent(event);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (isDragging && draggedEvent) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      setEvents(events.map(evt => 
        evt.id === draggedEvent.id 
          ? { ...evt, position: { x, y } } 
          : evt
      ));
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedEvent(null);
    }
  };

  // Create a new event
  const handleCreateEvent = () => {
    const newEvent = {
      id: Date.now(), // Temporary ID, will be replaced when saved to backend
      ...newEventData,
      position: newEventPosition,
    };
    
    setEvents([...events, newEvent]);
    setIsCreatingEvent(false);
    setNewEventData({
      title: '',
      description: '',
      location: '',
      isPartyLocation: false,
    });
  };

  // Update event
  const handleUpdateEvent = () => {
    if (!selectedEvent) return;
    
    setEvents(events.map(evt => 
      evt.id === selectedEvent.id 
        ? { ...selectedEvent } 
        : evt
    ));
    
    setSelectedEvent(null);
  };

  // Handle canvas click to deselect 
  const handleCanvasClick = () => {
    // If in connection mode, cancel it
    if (isCreatingConnection) {
      setIsCreatingConnection(false);
      setConnectionStart(null);
      return;
    }
    
    setSelectedEvent(null);
  };

  // Cancel event creation
  const handleCancelCreate = () => {
    setIsCreatingEvent(false);
  };

  // Draw connections between events
  const renderConnections = () => {
    return connections.map((connection, index) => {
      const fromEvent = events.find(e => e.id === connection.from);
      const toEvent = events.find(e => e.id === connection.to);
      
      if (!fromEvent || !toEvent) return null;
      
      return (
        <line
          key={index}
          x1={fromEvent.position.x + 75}
          y1={fromEvent.position.y + 25}
          x2={toEvent.position.x + 75}
          y2={toEvent.position.y + 25}
          stroke={connectionStart && connectionStart.id === fromEvent.id ? "#3498db" : "#666"}
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  };

  return (
    <div className="lore-map-container">
      <div 
        className="lore-map-canvas" 
        ref={canvasRef}
        onContextMenu={handleCanvasContextMenu}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <svg width="100%" height="100%">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
          {renderConnections()}
          
          {/* Show temp connection line when creating */}
          {isCreatingConnection && connectionStart && (
            <line
              x1={connectionStart.position.x + 75}
              y1={connectionStart.position.y + 25}
              x2={isDragging ? draggedEvent.position.x + 75 : window.event?.clientX - canvasRef.current.getBoundingClientRect().left}
              y2={isDragging ? draggedEvent.position.y + 25 : window.event?.clientY - canvasRef.current.getBoundingClientRect().top}
              stroke="#3498db"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </svg>
        
        {events.map(event => (
          <div
            key={event.id}
            className={`event-node ${event.isPartyLocation ? 'party-location' : ''} ${selectedEvent?.id === event.id ? 'selected' : ''} ${connectionStart?.id === event.id ? 'connection-source' : ''}`}
            style={{
              left: `${event.position.x}px`,
              top: `${event.position.y}px`,
            }}
            onClick={(e) => handleEventClick(event, e)}
            onMouseDown={(e) => handleEventDragStart(e, event)}
          >
            <h3>{event.title}</h3>
            <div className="event-location">{event.location}</div>
          </div>
        ))}
        
        {isCreatingConnection && (
          <div className="connection-help-text">
            Click on another event to create a connection, or right-click to cancel.
          </div>
        )}
      </div>
      
      {selectedEvent && (
        <div className="event-details-panel">
          <h3>
            <input 
              type="text" 
              value={selectedEvent.title}
              onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})}
            />
          </h3>
          <div className="form-group">
            <label>Location:</label>
            <input 
              type="text" 
              value={selectedEvent.location}
              onChange={(e) => setSelectedEvent({...selectedEvent, location: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea 
              value={selectedEvent.description}
              onChange={(e) => setSelectedEvent({...selectedEvent, description: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>
              <input 
                type="checkbox" 
                checked={selectedEvent.isPartyLocation}
                onChange={(e) => setSelectedEvent({...selectedEvent, isPartyLocation: e.target.checked})}
              />
              Party is here
            </label>
          </div>

          <div className="event-characters">
      `      <h4>Characters Present</h4>
            <div className="character-select">
              <select 
                value="" 
                onChange={(e) => {
                  if (e.target.value) handleAddCharacterToEvent(parseInt(e.target.value, 10));
                }}
              >
                <option value="">Add a character...</option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
            </div>
            
            <div className="character-list">
              {eventCharacters.map(charId => {
                const character = characters.find(c => c.id === charId);
                if (!character) return null;
                
                return (
                  <div key={charId} className="event-character-item">
                    <span>{character.name}</span>
                    <span className="character-type-badge">{character.character_type}</span>
                    <button 
                      className="remove-character-btn"
                      onClick={() => handleRemoveCharacterFromEvent(charId)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="event-action-buttons">
            <button onClick={handleUpdateEvent}>Update Event</button>
            <button onClick={handleAddConnection}>Add Connection</button>
            <button className="delete-button" onClick={handleDeleteEvent}>Delete Event</button>
          </div>
        </div>
      )}
      
      {isCreatingEvent && (
        <div className="create-event-modal">
          <h3>Create New Event</h3>
          <div className="form-group">
            <label>Title:</label>
            <input 
              type="text" 
              value={newEventData.title} 
              onChange={(e) => setNewEventData({...newEventData, title: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Location:</label>
            <input 
              type="text" 
              value={newEventData.location} 
              onChange={(e) => setNewEventData({...newEventData, location: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea 
              value={newEventData.description} 
              onChange={(e) => setNewEventData({...newEventData, description: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>
              <input 
                type="checkbox" 
                checked={newEventData.isPartyLocation} 
                onChange={(e) => setNewEventData({...newEventData, isPartyLocation: e.target.checked})}
              />
              Party is here
            </label>
          </div>
          <div className="modal-actions">
            <button onClick={handleCreateEvent}>Create</button>
            <button onClick={handleCancelCreate}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoreMap;