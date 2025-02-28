import React, { useState, useEffect, useRef } from 'react';
import './LoreMap.css';

// Sample data structure for testing
const sampleEvents = [
  {
    id: 1,
    title: 'Campaign Start',
    description: 'The party meets at a tavern in Waterdeep',
    location: 'Waterdeep',
    position: { x: 300, y: 100 },
    isPartyLocation: true,
  },
  {
    id: 2,
    title: 'Meeting the Quest Giver',
    description: 'Lord Neverember offers a quest to investigate strange happenings',
    location: 'Castle Ward',
    position: { x: 400, y: 200 },
    isPartyLocation: false,
  },
  {
    id: 3,
    title: 'Journey to the Ruins',
    description: 'The party travels to ancient ruins outside the city',
    location: 'Trade Way',
    position: { x: 250, y: 300 },
    isPartyLocation: false,
  },
];

const LoreMap = () => {
  const [events, setEvents] = useState(sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventPosition, setNewEventPosition] = useState({ x: 0, y: 0 });
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    location: '',
    isPartyLocation: false,
  });
  const [connections, setConnections] = useState([
    { from: 1, to: 2 },
    { from: 2, to: 3 },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);

  // Handle canvas right-click to create new event
  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNewEventPosition({ x, y });
    setIsCreatingEvent(true);
  };

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  // Handle event drag start
  const handleEventDragStart = (e, event) => {
    e.stopPropagation();
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
      id: events.length + 1,
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
          stroke="#666"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  };

  return (
    <div className="lore-map-container">
      <h2>Lore Map</h2>
      
      <div 
        className="lore-map-canvas" 
        ref={canvasRef}
        onContextMenu={handleCanvasContextMenu}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
        </svg>
        
        {events.map(event => (
          <div
            key={event.id}
            className={`event-node ${event.isPartyLocation ? 'party-location' : ''} ${selectedEvent?.id === event.id ? 'selected' : ''}`}
            style={{
              left: `${event.position.x}px`,
              top: `${event.position.y}px`,
            }}
            onClick={() => handleEventClick(event)}
            onMouseDown={(e) => handleEventDragStart(e, event)}
          >
            <h3>{event.title}</h3>
            <div className="event-location">{event.location}</div>
          </div>
        ))}
      </div>
      
      {selectedEvent && (
        <div className="event-details-panel">
          <h3>{selectedEvent.title}</h3>
          <p><strong>Location:</strong> {selectedEvent.location}</p>
          <p>{selectedEvent.description}</p>
          {selectedEvent.isPartyLocation && (
            <div className="party-badge">Current Party Location</div>
          )}
          <button>Edit Event</button>
          <button>Add Connection</button>
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