import React from 'react';
import './CharacterManager.css';
import { safeParseActions, isAttackAction } from '../../utils/characterUtils';
import { formatChallengeRating } from '../../utils/challengeRatingUtils';

const CharacterStats = ({ character, onAbilityRoll, onAttackActionRoll }) => {
  if (!character) return null;

  return (
    <>
      {/* Ability score grid */}
      <div className="stats-grid">
        <div
          className="stat-item clickable"
          onClick={() => onAbilityRoll('Strength', character.strength || 10)}
          title="Click to roll Strength check"
        >
          <span className="stat-label">STR</span>
          <span className="stat-value">{character.strength || 10}</span>
        </div>
        <div
          className="stat-item clickable"
          onClick={() => onAbilityRoll('Dexterity', character.dexterity || 10)}
          title="Click to roll Dexterity check"
        >
          <span className="stat-label">DEX</span>
          <span className="stat-value">{character.dexterity || 10}</span>
        </div>
        <div
          className="stat-item clickable"
          onClick={() => onAbilityRoll('Constitution', character.constitution || 10)}
          title="Click to roll Constitution check"
        >
          <span className="stat-label">CON</span>
          <span className="stat-value">{character.constitution || 10}</span>
        </div>
        <div
          className="stat-item clickable"
          onClick={() => onAbilityRoll('Intelligence', character.intelligence || 10)}
          title="Click to roll Intelligence check"
        >
          <span className="stat-label">INT</span>
          <span className="stat-value">{character.intelligence || 10}</span>
        </div>
        <div
          className="stat-item clickable"
          onClick={() => onAbilityRoll('Wisdom', character.wisdom || 10)}
          title="Click to roll Wisdom check"
        >
          <span className="stat-label">WIS</span>
          <span className="stat-value">{character.wisdom || 10}</span>
        </div>
        <div
          className="stat-item clickable"
          onClick={() => onAbilityRoll('Charisma', character.charisma || 10)}
          title="Click to roll Charisma check"
        >
          <span className="stat-label">CHA</span>
          <span className="stat-value">{character.charisma || 10}</span>
        </div>
      </div>

      <div className="combat-stats">
        <div className="combat-stat">
          <span className="stat-label">AC</span>
          <span className="stat-value">{character.armor_class || 10}</span>
        </div>
        <div className="combat-stat">
          <span className="stat-label">HP</span>
          <span className="stat-value">{character.hit_points || 1}</span>
        </div>
        {character.challenge_rating && (
          <div className="combat-stat">
            <span className="stat-label">CR</span>
            <span className="stat-value">{formatChallengeRating(character.challenge_rating)}</span>
          </div>
        )}
      </div>

      {/* Show additional monster info for official monsters */}
      {character.is_official && character.character_type === 'Monster' && (
        <div className="monster-info">
          {character.creature_type && (
            <div className="creature-info">
              <strong>Type:</strong> {character.creature_type}
            </div>
          )}
          {character.senses && (
            <div className="creature-senses">
              <strong>Senses:</strong> {character.senses}
            </div>
          )}
          {character.languages && (
            <div className="creature-languages">
              <strong>Languages:</strong> {character.languages}
            </div>
          )}
          {character.damage_resistances && (
            <div className="creature-resistances">
              <strong>Damage Resistances:</strong> {character.damage_resistances}
            </div>
          )}
          {character.damage_immunities && (
            <div className="creature-immunities">
              <strong>Damage Immunities:</strong> {character.damage_immunities}
            </div>
          )}
          {character.condition_immunities && (
            <div className="creature-condition-immunities">
              <strong>Condition Immunities:</strong> {character.condition_immunities}
            </div>
          )}
        </div>
      )}

      {/* Custom actions */}
      {(() => {
        const actionsToShow = safeParseActions(character.actions);

        if (actionsToShow && actionsToShow.length > 0) {
          return (
            <div className="character-actions">
              <h3>Actions</h3>
              <div className="actions-list">
                {actionsToShow.map((action, index) => (
                  <div key={index} className="action-item">
                    <div className="action-name">{action.name || 'Unnamed Action'}</div>
                    <div className="action-description">{action.description || 'No description'}</div>
                    {isAttackAction(action) && (
                      <button
                        className="roll-btn"
                        onClick={() => onAttackActionRoll(action)}
                        title="Roll this attack"
                      >
                        🎲 Roll Attack
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Official monster special abilities */}
      {character.special_abilities && (
        <div className="character-special-abilities">
          <h3>Special Abilities</h3>
          <div className="abilities-list">
            {safeParseActions(character.special_abilities).map((ability, index) => (
              <div key={index} className="ability-item">
                <div className="ability-name">{ability.name || 'Unnamed Ability'}</div>
                <div className="ability-description">{ability.description || ability.desc || 'No description'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official monster actions */}
      {character.is_official && character.actions && (
        <div className="character-actions">
          <h3>Monster Actions</h3>
          <div className="actions-list">
            {safeParseActions(character.actions).map((action, index) => (
              <div key={index} className="action-item">
                <div className="action-name">{action.name || 'Unnamed Action'}</div>
                <div className="action-description">{action.description || action.desc || 'No description'}</div>
                {isAttackAction(action) && (
                  <button
                    className="roll-btn"
                    onClick={() => onAttackActionRoll(action)}
                    title="Roll this attack"
                  >
                    🎲 Roll Attack
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legendary Actions */}
      {character.legendary_actions && (
        <div className="character-legendary-actions">
          <h3>Legendary Actions</h3>
          <div className="legendary-actions-list">
            {safeParseActions(character.legendary_actions).map((action, index) => (
              <div key={index} className="legendary-action-item">
                <div className="legendary-action-name">{action.name || 'Unnamed Action'}</div>
                <div className="legendary-action-description">{action.description || action.desc || 'No description'}</div>
                {isAttackAction(action) && (
                  <button
                    className="roll-btn"
                    onClick={() => onAttackActionRoll(action)}
                    title="Roll this legendary attack"
                  >
                    🎲 Roll Attack
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reactions */}
      {character.reactions && (
        <div className="character-reactions">
          <h3>Reactions</h3>
          <div className="reactions-list">
            {safeParseActions(character.reactions).map((reaction, index) => (
              <div key={index} className="reaction-item">
                <div className="reaction-name">{reaction.name || 'Unnamed Reaction'}</div>
                <div className="reaction-description">{reaction.description || reaction.desc || 'No description'}</div>
                {isAttackAction(reaction) && (
                  <button
                    className="roll-btn"
                    onClick={() => onAttackActionRoll(reaction)}
                    title="Roll this reaction attack"
                  >
                    🎲 Roll Attack
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default CharacterStats;
