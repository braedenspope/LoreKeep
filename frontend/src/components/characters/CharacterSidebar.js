import React from 'react';
import './CharacterManager.css';
import { formatChallengeRating } from '../../utils/challengeRatingUtils';

const CharacterSidebar = ({
  characters,
  selectedCharacterId,
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  onSelectCharacter,
  onCreateNew
}) => {
  return (
    <div className="character-sidebar">
      <div className="sidebar-header">
        <h2>Characters</h2>
        <button className="create-btn" onClick={onCreateNew}>
          Create New
        </button>
      </div>

      <div className="filter-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="character-filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => onFilterChange('all')}
          >
            All
          </button>
          <button
            className={filter === 'PC' ? 'active' : ''}
            onClick={() => onFilterChange('PC')}
          >
            PCs
          </button>
          <button
            className={filter === 'NPC' ? 'active' : ''}
            onClick={() => onFilterChange('NPC')}
          >
            NPCs
          </button>
          <button
            className={filter === 'Monster' ? 'active' : ''}
            onClick={() => onFilterChange('Monster')}
          >
            Monsters
          </button>
        </div>
      </div>

      <div className="character-list">
        {characters.length === 0 ? (
          <div className="no-characters">
            No characters match your criteria
          </div>
        ) : (
          characters.map(character => (
            <div
              key={character.id}
              className={`character-item ${selectedCharacterId === character.id ? 'selected' : ''}`}
              onClick={() => onSelectCharacter(character)}
            >
              <div className="character-name">
                {character.name}
                {character.is_official && <span className="official-badge">📖</span>}
              </div>
              <div className="character-type">
                {character.character_type}
                {character.challenge_rating && ` (CR ${formatChallengeRating(character.challenge_rating)})`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CharacterSidebar;
