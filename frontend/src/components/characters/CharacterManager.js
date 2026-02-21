import React, { useState, useEffect } from 'react';
import './CharacterManager.css';
import DiceRollModal from '../common/DiceRollModal';
import useCharacters from '../../hooks/useCharacters';
import useCharacterForm from '../../hooks/useCharacterForm';
import useDiceRolling from '../../hooks/useDiceRolling';
import { filterAndSortCharacters } from '../../utils/characterUtils';
import CharacterSidebar from './CharacterSidebar';
import CharacterDetailView from './CharacterDetailView';
import CharacterForm from './CharacterForm';

const CharacterManager = ({ user }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { characters, loading, error, setError, fetchCharacters, createCharacter, updateCharacter, deleteCharacter } = useCharacters();
  const { formData, isCreating, isEditing, setIsCreating, setIsEditing, handleFormChange, handleStatChange, handleAddAction, handleActionChange, handleRemoveAction, resetForm, startCreating, startEditing, cancelForm } = useCharacterForm();
  const { diceRollResult, rollActionName, handleAbilityRoll, handleAttackActionRoll, closeDiceModal } = useDiceRolling();

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const filteredCharacters = filterAndSortCharacters(characters, filter, searchTerm);

  const handleCreate = async () => {
    try {
      const data = await createCharacter(formData);
      setIsCreating(false);
      resetForm();

      // Find and select the newly created character
      setTimeout(() => {
        const newCharacter = characters.find(char => char.id === data.id);
        if (newCharacter) {
          setSelectedCharacter(newCharacter);
        }
      }, 100);
    } catch (err) {
      setError('Failed to create character. Please try again.');
    }
  };

  const handleUpdate = async () => {
    if (!selectedCharacter) return;

    try {
      await updateCharacter(selectedCharacter.id, formData);
      setIsEditing(false);

      // Find and select the updated character
      setTimeout(() => {
        const updatedCharacter = characters.find(char => char.id === selectedCharacter.id);
        if (updatedCharacter) {
          setSelectedCharacter(updatedCharacter);
        }
      }, 100);
    } catch (err) {
      setError('Failed to update character. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCharacter) return;

    try {
      const deleted = await deleteCharacter(selectedCharacter);
      if (deleted) {
        setSelectedCharacter(null);
      }
    } catch (err) {
      setError('Failed to delete character. Please try again.');
    }
  };

  const handleEditClick = () => {
    if (!selectedCharacter) return;
    startEditing(selectedCharacter);
  };

  const handleSelectCharacter = (character) => {
    setSelectedCharacter(character);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    startCreating();
    setSelectedCharacter(null);
  };

  if (loading) {
    return <div className="loading">Loading characters...</div>;
  }

  return (
    <div className="character-manager">
      <CharacterSidebar
        characters={filteredCharacters}
        selectedCharacterId={selectedCharacter?.id}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
        onSelectCharacter={handleSelectCharacter}
        onCreateNew={handleCreateNew}
      />

      <div className="character-detail-panel">
        {selectedCharacter && !isEditing && !isCreating ? (
          <CharacterDetailView
            character={selectedCharacter}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onAbilityRoll={handleAbilityRoll}
            onAttackActionRoll={handleAttackActionRoll}
          />
        ) : isCreating || isEditing ? (
          <CharacterForm
            formData={formData}
            isEditing={isEditing}
            onFormChange={handleFormChange}
            onStatChange={handleStatChange}
            onAddAction={handleAddAction}
            onActionChange={handleActionChange}
            onRemoveAction={handleRemoveAction}
            onSubmit={isEditing ? handleUpdate : handleCreate}
            onCancel={cancelForm}
          />
        ) : (
          <div className="no-selection">
            <p>Select a character from the list or create a new one</p>
          </div>
        )}
      </div>

      {/* Dice Roll Modal */}
      <DiceRollModal
        rollResult={diceRollResult}
        onClose={closeDiceModal}
        actionName={rollActionName}
      />

      {error && (
        <div className="error-message" style={{position: 'fixed', top: '20px', right: '20px', zIndex: 1000}}>
          {error}
          <button onClick={() => setError(null)} style={{marginLeft: '10px'}}>×</button>
        </div>
      )}
    </div>
  );
};

export default CharacterManager;
