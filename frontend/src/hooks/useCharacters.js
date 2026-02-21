import { useState, useCallback } from 'react';
import { buildCharacterRequestBody } from '../utils/characterUtils';
import config from '../config';

const useCharacters = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCharacters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/api/characters`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load characters');
      }

      const data = await response.json();
      setCharacters(data);
    } catch (err) {
      setError('Failed to load characters. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCharacter = async (formData) => {
    const response = await fetch(`${config.apiUrl}/api/characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(buildCharacterRequestBody(formData))
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create character');
    }

    const data = await response.json();
    await fetchCharacters();
    return data;
  };

  const updateCharacter = async (id, formData) => {
    const response = await fetch(`${config.apiUrl}/api/characters/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(buildCharacterRequestBody(formData))
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update character');
    }

    await fetchCharacters();
  };

  const deleteCharacter = async (character) => {
    if (!window.confirm(`Are you sure you want to delete ${character.name}?`)) {
      return false;
    }

    const response = await fetch(`${config.apiUrl}/api/characters/${character.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to delete character');
    }

    setCharacters(characters.filter(char => char.id !== character.id));
    return true;
  };

  return {
    characters,
    loading,
    error,
    setError,
    fetchCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter
  };
};

export default useCharacters;
