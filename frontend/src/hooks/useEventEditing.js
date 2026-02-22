import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import config from '../config';

const useEventEditing = ({ events, setEvents, connections, setConnections, selectedEvent, setSelectedEvent, characters }) => {
  const { showConfirm } = useNotification();
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventStates, setEventStates] = useState({});

  // Initialize eventStates from persisted is_completed on events
  useEffect(() => {
    const initialStates = {};
    events.forEach(event => {
      if (event.is_completed) {
        initialStates[`event_${event.id}_completed`] = true;
      }
    });
    setEventStates(prev => ({ ...prev, ...initialStates }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper functions for condition checking
  const getEventName = (eventId) => {
    const event = events.find(e => e.id.toString() === eventId);
    return event ? event.title : 'Unknown Event';
  };

  const getCharacterName = (characterId) => {
    const character = characters.find(c => c.id.toString() === characterId);
    return character ? character.name : 'Unknown Character';
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

  // Toggle event completion state and persist to backend
  const toggleEventCompleted = async (eventId) => {
    const key = `event_${eventId}_completed`;
    const newValue = !eventStates[key];

    // Optimistic update
    setEventStates(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Persist to backend
    try {
      await fetch(`${config.apiUrl}/api/events/${eventId}/toggle-complete`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      // Revert on failure
      setEventStates(prev => ({
        ...prev,
        [key]: !newValue
      }));
    }
  };

  // Handle event double click to open editing modal
  const handleEventDoubleClick = (event, e) => {
    e.stopPropagation();

    const eventToEdit = {
      ...event,
      conditions: event.conditions || []
    };

    setEditingEvent(eventToEdit);
  };

  // Cancel event editing
  const handleCancelEdit = () => {
    setEditingEvent(null);
  };

  // Delete an event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    const confirmed = await showConfirm(`Are you sure you want to delete "${selectedEvent.title}"?`);
    if (!confirmed) return;

    setEvents(events.filter(e => e.id !== selectedEvent.id));
    setConnections(connections.filter(
      c => c.from !== selectedEvent.id && c.to !== selectedEvent.id
    ));

    setSelectedEvent(null);
  };

  return {
    editingEvent,
    setEditingEvent,
    eventStates,
    checkEventConditions,
    toggleEventCompleted,
    handleEventDoubleClick,
    handleCancelEdit,
    handleDeleteEvent
  };
};

export default useEventEditing;
