// Create this file: frontend/src/components/common/DiceRollModal.js

import React from 'react';
import './DiceRollModal.css';

const DiceRollModal = ({ rollResult, onClose, actionName }) => {
  if (!rollResult) return null;

  return (
    <div className="dice-modal-overlay" onClick={onClose}>
      <div className="dice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dice-modal-header">
          <h3>{actionName || 'Dice Roll'}</h3>
          <button className="dice-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="dice-modal-content">
          {rollResult.notation && (
            <div className="dice-notation">{rollResult.notation}</div>
          )}
          
          {rollResult.rolls && (
            <div className="dice-rolls">
              <span className="dice-label">Rolls:</span>
              {rollResult.rolls.map((roll, index) => (
                <span key={index} className="individual-roll">
                  {roll}
                </span>
              ))}
            </div>
          )}
          
          {rollResult.modifier !== undefined && rollResult.modifier !== 0 && (
            <div className="dice-modifier">
              <span className="dice-label">Modifier:</span>
              <span className={`modifier ${rollResult.modifier >= 0 ? 'positive' : 'negative'}`}>
                {rollResult.modifier >= 0 ? '+' : ''}{rollResult.modifier}
              </span>
            </div>
          )}
          
          <div className="dice-total">
            <span className="dice-label">Total:</span>
            <span className="total-value">{rollResult.total}</span>
          </div>
          
          {rollResult.formatted && (
            <div className="dice-breakdown">{rollResult.formatted}</div>
          )}
        </div>
        
        <div className="dice-modal-actions">
          <button onClick={onClose} className="dice-close-btn">Close</button>
        </div>
      </div>
    </div>
  );
};

export default DiceRollModal;