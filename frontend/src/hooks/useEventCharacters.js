import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import config from '../config';

const useEventCharacters = (editingEvent) => {
  const { showNotification } = useNotification();
  const [characters, setCharacters] = useState([]);
  const [eventCharacters, setEventCharacters] = useState([]);

  // Fetch all characters on mount
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

  // Fetch event characters when editingEvent changes
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
    } else {
      setEventCharacters([]);
    }
  }, [editingEvent]);

  const handleAddCharacterToEvent = async (characterId) => {
    const parsedCharacterId = parseInt(characterId, 10);

    if (!editingEvent || !parsedCharacterId || eventCharacters.includes(parsedCharacterId)) {
      return;
    }

    try {
      // Check if this is a saved event (has a real ID from backend)
      if (editingEvent.id && editingEvent.id <= 1000000) {
        console.log('Adding character to saved event:', editingEvent.id, 'character:', parsedCharacterId);

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
      showNotification(`Failed to add character: ${err.message}`, 'error');
    }
  };

  const handleRemoveCharacterFromEvent = async (characterId) => {
    if (!editingEvent) return;

    try {
      if (editingEvent.id && editingEvent.id <= 1000000) {
        console.log('Removing character from saved event:', editingEvent.id, 'character:', characterId);

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
      showNotification(`Failed to remove character: ${err.message}`, 'error');
    }
  };

  return {
    characters,
    eventCharacters,
    setEventCharacters,
    handleAddCharacterToEvent,
    handleRemoveCharacterFromEvent
  };
};

export default useEventCharacters;
