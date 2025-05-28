// LoreMap.jsx - Complete updated version with battle maps and character management
import React, { useState, useEffect, useRef } from 'react';
import './LoreMap.css';
import EventConditions from './EventConditions';
import config from '../../config';

const LoreMap = ({ initialEvents, initialConnections, onChange, loreMapId }) => {
  const [events, setEvents] = useState(initialEvents || []);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
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
  const [characters, setCharacters] = useState([]);
  const [eventCharacters, setEventCharacters] = useState([]);
  const [eventStates, setEventStates] = useState({});
  const [battleMapFile, setBattleMapFile] = useState(null);
  const [battleMapPreview, setBattleMapPreview] = useState(null);
  
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
        console.error('Failed to fetch characters:', err);
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
          console.error('Failed to fetch event characters:', err);
        }
      };
      
      fetchEventCharacters();
      
      // Set battle map preview if event has one
      if (editingEvent.battle_map_url) {
        setBattleMapPreview(`${config.apiUrl}${editingEvent.battle_map_url}`);
      }
    } else {
      setEventCharacters([]);
      setBattleMapPreview(null);
    }
  }, [editingEvent]);

  // Check if event conditions are met
  const checkEventConditions = (event) => {
    let conditions = [];
    
    // Handle different types of conditions data
    if (event.conditions) {
      if (Array.isArray(event.conditions)) {
        // Already an array
        conditions = event.conditions;
      } else if (typeof event.conditions === 'string') {
        // It's a JSON string, parse it
        try {
          conditions = JSON.parse(event.conditions);
        } catch (e) {
          console.warn('Failed to parse conditions:', event.conditions);
          conditions = [];
        }
      } else if (typeof event.conditions === 'object') {
        // It's already an object but not an array
        conditions = [event.conditions];
      }
    }
    
    if (!conditions || conditions.length === 0) {
      return true;
    }
    
    return conditions.every(condition => {
      switch (condition.type) {
        case 'event_completed':
          const isCompleted = eventStates[`event_${condition.target}_completed`] || false;
          return condition.required ? isCompleted : !isCompleted;
          
        case 'character_freed':
          const isFreed = eventStates[`character_${condition.target}_freed`] || false;
          return condition.required ? isFreed : !isFreed;
          
        case 'character_alive':
          const isAlive = eventStates[`character_${condition.target}_alive`] !== false;
          return condition.required ? isAlive : !isAlive;
          
        case 'custom':
          const customState = eventStates[`custom_${condition.id}`] || false;
          return condition.required ? customState : !customState;
          
        default:
          return true;
      }
    });
  };

  // Toggle event completion state
  const toggleEventCompleted = (eventId) => {
    const key = `event_${eventId}_completed`;
    setEventStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle single click - just select/highlight
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    
    // If in connection creation mode, complete the connection
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

  // Handle double click - open edit modal
  const handleEventDoubleClick = (event, e) => {
    e.stopPropagation();
    
    if (isCreatingConnection) return; // Don't open edit in connection mode
    
    // Parse the event data properly
    const eventToEdit = {
      ...event,
      conditions: event.conditions || []
    };
    
    setEditingEvent(eventToEdit);
    setBattleMapFile(null);
    
    // Set battle map preview if event has one
    if (event.battle_map_url) {
      setBattleMapPreview(`${config.apiUrl}${event.battle_map_url}`);
    } else {
      setBattleMapPreview(null);
    }
  };

  // Handle battle map file upload
  const handleBattleMapUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBattleMapFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBattleMapPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
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
        }
      } catch (err) {
        console.error('Failed to remove battle map:', err);
      }
    } else {
      // For new events, just clear locally
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

  // Add character to event
  const handleAddCharacterToEvent = async (characterId) => {
    if (!editingEvent || !characterId || eventCharacters.includes(characterId)) return;
    
    try {
      if (editingEvent.id && editingEvent.id <= 1000000) {
        const response = await fetch(`${config.apiUrl}/api/events/${editingEvent.id}/characters`, {
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
      } else {
        // For new events, just add to local state
        setEventCharacters([...eventCharacters, characterId]);
      }
    } catch (err) {
      console.error('Failed to add character to event:', err);
    }
  };

  // Remove character from event
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
        }
      } else {
        // For new events, just remove from local state
        setEventCharacters(eventCharacters.filter(id => id !== characterId));
      }
    } catch (err) {
      console.error('Failed to remove character from event:', err);
    }
  };

  // Save event changes
  const handleSaveEvent = async () => {
    if (!editingEvent) return;
    
    try {
      let updatedEvent = { ...editingEvent };
      
      // Only process if this is an existing event (not a new temporary one)
      if (editingEvent.id && editingEvent.id <= 1000000) {
        // Handle battle map upload if there's a new file
        if (battleMapFile) {
          const formData = new FormData();
          formData.append('battle_map', battleMapFile);
          
          // Upload the battle map
          const uploadResponse = await fetch(`${config.apiUrl}/api/events/${editingEvent.id}/battle-map`, {
            method: 'POST',
            credentials: 'include',
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            updatedEvent.battle_map_url = uploadData.battle_map_url;
          } else {
            throw new Error('Failed to upload battle map');
          }
        }
        
        // Update the event details in the backend
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
          throw new Error('Failed to update event');
        }
        
        const backendEvent = await response.json();
        updatedEvent = {
          ...updatedEvent,
          battle_map_url: backendEvent.battle_map_url
        };
        
        console.log('Event updated successfully, characters attached:', eventCharacters.length);
        
      } else {
        // For new events that haven't been saved to backend yet
        console.log('Saving new event with characters:', eventCharacters.length);
      }
      
      // Update the event in the events array
      setEvents(events.map(evt => 
        evt.id === editingEvent.id ? updatedEvent : evt
      ));
      
      // If it's a selected event, update that too
      if (selectedEvent && selectedEvent.id === editingEvent.id) {
        setSelectedEvent(updatedEvent);
      }
      
      // Clear editing state
      setEditingEvent(null);
      setBattleMapFile(null);
      setBattleMapPreview(null);
      
      alert('Event saved successfully!');
      
    } catch (err) {
      console.error('Failed to save event:', err);
      alert(`Failed to save event changes: ${err.message}`);
    }
  };

  // Cancel event editing
  const handleCancelEdit = () => {
    setEditingEvent(null);
    setBattleMapFile(null);
    setBattleMapPreview(null);
    setEventCharacters([]);
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
    
    if (!window.confirm(`Are you sure you want to delete "${selectedEvent.title}"?`)) {
      return;
    }
    
    // Remove the event
    setEvents(events.filter(e => e.id !== selectedEvent.id));
    
    // Remove connections to/from this event
    setConnections(connections.filter(
      c => c.from !== selectedEvent.id && c.to !== selectedEvent.id
    ));
    
    setSelectedEvent(null);
  };

  // Canvas right-click for new event
  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    
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

  // Handle event drag start
  const handleEventDragStart = (e, event) => {
    e.stopPropagation();
    
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
      id: Date.now(),
      ...newEventData,
      position: newEventPosition,
      conditions: []
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

  // Handle canvas click to deselect 
  const handleCanvasClick = () => {
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
          stroke={connectionStart && connectionStart.id === fromEvent.id ? "#3498db" : "#8b4513"}
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  };

  // Get character names for display
  const getCharacterNames = (characterIds) => {
    return characterIds
      .map(id => characters.find(c => c.id === id)?.name)
      .filter(name => name)
      .join(', ');
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
              <polygon points="0 0, 10 3.5, 0 7" fill="#8b4513" />
            </marker>
          </defs>
          {renderConnections()}
        </svg>
        
        {events.map(event => {
          const isAccessible = checkEventConditions(event);
          const isCompleted = eventStates[`event_${event.id}_completed`] || false;
          
          return (
            <div
              key={event.id}
              className={`event-node 
                ${event.isPartyLocation ? 'party-location' : ''} 
                ${selectedEvent?.id === event.id ? 'selected' : ''} 
                ${connectionStart?.id === event.id ? 'connection-source' : ''}
                ${!isAccessible ? 'conditional-locked' : ''}
                ${isCompleted ? 'completed' : ''}
              `}
              style={{
                left: `${event.position.x}px`,
                top: `${event.position.y}px`,
              }}
              onClick={(e) => handleEventClick(event, e)}
              onDoubleClick={(e) => handleEventDoubleClick(event, e)}
              onMouseDown={(e) => handleEventDragStart(e, event)}
            >
              <h3>{event.title}</h3>
              <div className="event-location">{event.location}</div>
              
              {/* Show condition indicators */}
              {!isAccessible && (
                <div className="condition-indicator locked">🔒</div>
              )}
              {isCompleted && (
                <div className="condition-indicator completed">✓</div>
              )}
              {event.conditions && event.conditions.length > 0 && (
                <div className="condition-indicator has-conditions">⚙️</div>
              )}
              {event.battle_map_url && (
                <div className="condition-indicator has-map">🗺️</div>
              )}
            </div>
          );
        })}
        
        {isCreatingConnection && (
          <div className="connection-help-text">
            Click on another event to create a connection, or right-click to cancel.
          </div>
        )}
      </div>
      
      {/* Simple selection panel - only shows when event is selected but not editing */}
      {selectedEvent && !editingEvent && (
        <div className="event-selection-panel">
          <h3>{selectedEvent.title}</h3>
          <p>{selectedEvent.location}</p>
          <div className="selection-actions">
            <button onClick={() => handleEventDoubleClick(selectedEvent, { stopPropagation: () => {} })}>
              Edit Event
            </button>
            <button onClick={handleAddConnection}>Add Connection</button>
            <button onClick={handleDeleteEvent} className="delete-button">
              Delete Event
            </button>
            <button onClick={() => toggleEventCompleted(selectedEvent.id)}>
              {eventStates[`event_${selectedEvent.id}_completed`] ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
          </div>
        </div>
      )}
      
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
                
                {/* Characters Section */}
                <div className="characters-section">
                  <h3>Characters Present</h3>
                  <div className="character-select">
                    <select 
                      value="" 
                      onChange={(e) => {
                        if (e.target.value) {
                          console.log('Adding character:', e.target.value);
                          handleAddCharacterToEvent(parseInt(e.target.value, 10));
                        }
                      }}
                    >
                      <option value="">Add a character...</option>
                      {characters
                        .filter(char => !eventCharacters.includes(char.id))
                        .map(char => (
                          <option key={char.id} value={char.id}>{char.name} ({char.character_type})</option>
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
                          if (!character) {
                            console.log('Character not found for ID:', charId);
                            return null;
                          }
                          
                          return (
                            <li key={charId} className="character-list-item">
                              <span className="character-name">{character.name}</span>
                              <span className="character-type">({character.character_type})</span>
                              <button 
                                className="remove-character-btn"
                                onClick={() => {
                                  console.log('Removing character:', charId);
                                  handleRemoveCharacterFromEvent(charId);
                                }}
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
                  
                  {/* Debug info */}
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Debug: {eventCharacters.length} characters attached. 
                    Event ID: {editingEvent.id}. 
                    Characters: [{eventCharacters.join(', ')}]
                  </div>
                </div>
              </div>
              
              <div className="event-edit-right">
                {/* Battle Map Section */}
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
                  </div>
                  
                  {battleMapPreview && (
                    <div className="battle-map-preview">
                      <img src={battleMapPreview} alt="Battle Map Preview" />
                      <button 
                        className="remove-map-btn"
                        onClick={handleRemoveBattleMap}
                      >
                        Remove Map
                      </button>
                    </div>
                  )}
                  
                  {/* Debug info */}
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Debug: Battle map URL: {editingEvent.battle_map_url || 'None'}
                    {battleMapFile && <div>New file selected: {battleMapFile.name}</div>}
                  </div>
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
      
      {/* Event creation modal */}
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