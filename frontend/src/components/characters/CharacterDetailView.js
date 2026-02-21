import React from 'react';
import './CharacterManager.css';
import CharacterStats from './CharacterStats';

const CharacterDetailView = ({ character, onEdit, onDelete, onAbilityRoll, onAttackActionRoll }) => {
  return (
    <div className="character-details">
      <div className="detail-header">
        <h2>{character.name}</h2>
        <span className="character-type-tag">
          {character.character_type}
          {character.is_official && ' (Official)'}
        </span>

        {!character.is_official && (
          <div className="detail-actions">
            <button onClick={onEdit}>Edit</button>
            <button className="delete-btn" onClick={onDelete}>Delete</button>
          </div>
        )}
      </div>

      <div className="character-description">
        <h3>Description</h3>
        <p>{character.description}</p>
      </div>

      <div className="character-stats">
        <h3>Stats</h3>
        <CharacterStats
          character={character}
          onAbilityRoll={onAbilityRoll}
          onAttackActionRoll={onAttackActionRoll}
        />
      </div>
    </div>
  );
};

export default CharacterDetailView;
