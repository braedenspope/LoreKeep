import React, { useState, useEffect, useCallback } from 'react';
import './LoreMap.css';
import useCanvasViewport from '../../hooks/useCanvasViewport';
import useEventEditing from '../../hooks/useEventEditing';
import useBattleMap from '../../hooks/useBattleMap';
import useEventCharacters from '../../hooks/useEventCharacters';
import { useNotification } from '../../context/NotificationContext';
import LoreMapSidebar from './LoreMapSidebar';
import LoreMapCanvas from './LoreMapCanvas';
import EventEditModal from './EventEditModal';
import config from '../../config';

const LoreMap = ({ initialEvents, initialConnections, onChange, loreMapId }) => {
  const { showNotification } = useNotification();
  const [events, setEvents] = useState(initialEvents || []);
  const [connections, setConnections] = useState(initialConnections || []);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);

  const { viewport, setViewport, containerRef, canvasRef, handleMouseDown, handleResetView, handleResetViewport, getViewportCenter } = useCanvasViewport({ events, setEvents, isCreatingConnection });

  const { editingEvent, setEditingEvent, eventStates, toggleEventCompleted, handleEventDoubleClick, handleCancelEdit, handleDeleteEvent } = useEventEditing({ events, setEvents, connections, setConnections, selectedEvent, setSelectedEvent, characters: [] });

  const { battleMapFile, battleMapPreview, uploadProgress, setBattleMapFile, handleBattleMapUpload, handleRemoveBattleMap, initPreview, reset: resetBattleMap } = useBattleMap();

  const { characters, eventCharacters, setEventCharacters, handleAddCharacterToEvent, handleRemoveCharacterFromEvent } = useEventCharacters(editingEvent);

  // Re-create useEventEditing with characters once they're loaded
  // We pass characters into the condition checker via a wrapper
  const checkEventConditionsWithCharacters = (event) => {
    // Inline condition checking that has access to characters
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

    const getEventName = (eventId) => {
      const evt = events.find(e => e.id.toString() === eventId);
      return evt ? evt.title : 'Unknown Event';
    };

    const getCharacterName = (characterId) => {
      const character = characters.find(c => c.id.toString() === characterId);
      return character ? character.name : 'Unknown Character';
    };

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

  // Initialize battle map preview when editing event changes
  useEffect(() => {
    if (editingEvent) {
      setBattleMapFile(null);
      if (editingEvent.battle_map_url) {
        initPreview(editingEvent.battle_map_url);
      } else {
        resetBattleMap();
      }
    }
  }, [editingEvent]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Navigate to a world position from minimap click
  const handleMinimapNavigate = useCallback((worldX, worldY) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setViewport(prev => ({
      ...prev,
      x: rect.width / 2 - worldX * prev.scale,
      y: rect.height / 2 - worldY * prev.scale
    }));
  }, [containerRef, setViewport]);

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

  // Handle conditions change for editing event
  const handleConditionsChange = (newConditions) => {
    if (!editingEvent) return;

    setEditingEvent({
      ...editingEvent,
      conditions: newConditions
    });
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
            showNotification(`Cannot save: ${validation.error}`, 'error');
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
      resetBattleMap();

      showNotification('Event saved successfully!', 'success');

    } catch (err) {
      showNotification(`Failed to save event: ${err.message}`, 'error');
    }
  };

  // Full cancel that resets battle map and characters too
  const handleFullCancelEdit = () => {
    handleCancelEdit();
    resetBattleMap();
    setEventCharacters([]);
  };

  // Start connection from selected event
  const handleStartConnection = (event) => {
    if (!event) return;
    setIsCreatingConnection(true);
    setConnectionStart(event);
    setSelectedEvent(null);
  };

  // Edit event handler (bridges sidebar to double-click handler)
  const handleEditEvent = (event) => {
    handleEventDoubleClick(event, { stopPropagation: () => {} });
  };

  return (
    <div className="lore-map-container">
      <LoreMapSidebar
        selectedEvent={selectedEvent}
        eventStates={eventStates}
        viewport={viewport}
        onCreateEvent={handleCreateEventAtCenter}
        onResetView={handleResetView}
        onResetViewport={handleResetViewport}
        onEditEvent={handleEditEvent}
        onStartConnection={handleStartConnection}
        onDeleteEvent={handleDeleteEvent}
        onToggleCompleted={toggleEventCompleted}
      />

      <LoreMapCanvas
        containerRef={containerRef}
        canvasRef={canvasRef}
        viewport={viewport}
        events={events}
        connections={connections}
        selectedEvent={selectedEvent}
        connectionStart={connectionStart}
        eventStates={eventStates}
        isCreatingConnection={isCreatingConnection}
        onMouseDown={handleMouseDown}
        onCanvasClick={handleCanvasClick}
        onEventClick={handleEventClick}
        onEventDoubleClick={handleEventDoubleClick}
        checkEventConditions={checkEventConditionsWithCharacters}
        onMinimapNavigate={handleMinimapNavigate}
      />

      {/* Event editing modal */}
      {editingEvent && (
        <EventEditModal
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
          eventStates={eventStates}
          characters={characters}
          eventCharacters={eventCharacters}
          events={events}
          battleMapPreview={battleMapPreview}
          battleMapFile={battleMapFile}
          uploadProgress={uploadProgress}
          onAddCharacter={handleAddCharacterToEvent}
          onRemoveCharacter={handleRemoveCharacterFromEvent}
          onBattleMapUpload={handleBattleMapUpload}
          onRemoveBattleMap={() => handleRemoveBattleMap(editingEvent, setEditingEvent)}
          onConditionsChange={handleConditionsChange}
          onToggleCompleted={toggleEventCompleted}
          onSave={handleSaveEvent}
          onCancel={handleFullCancelEdit}
        />
      )}
    </div>
  );
};

export default LoreMap;
