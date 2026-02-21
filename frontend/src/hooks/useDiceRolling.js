import { useState } from 'react';
import { rollAbilityCheck, rollFromNotation } from '../utils/diceUtils';

const useDiceRolling = () => {
  const [diceRollResult, setDiceRollResult] = useState(null);
  const [rollActionName, setRollActionName] = useState('');

  const handleAbilityRoll = (abilityName, abilityScore) => {
    const result = rollAbilityCheck(abilityScore);
    setDiceRollResult(result);
    setRollActionName(`${abilityName} Check`);
  };

  const handleAttackActionRoll = (action) => {
    const { name, attack_bonus, damage } = action;
    const actionDescription = action.description || action.desc || '';

    // Check if we have a valid attack bonus
    if (attack_bonus !== undefined && attack_bonus !== null && !isNaN(attack_bonus)) {
      // This is an attack with explicit attack bonus - roll to hit
      const attackRoll = rollFromNotation('1d20');
      const rollValue = attackRoll.rolls ? attackRoll.rolls[0] : attackRoll.total;
      const totalAttack = attackRoll.total + attack_bonus;

      let damageText = '';
      if (damage && Array.isArray(damage) && damage.length > 0) {
        const damageRolls = damage.map(d => {
          if (d.damage_dice || d) {
            const dice = d.damage_dice || d;
            const damageRoll = rollFromNotation(dice);
            const damageType = d.damage_type?.name || d.damage_type || '';
            return `${damageRoll.total} ${damageType}`;
          }
          return 'No damage dice';
        });
        damageText = ` | Damage: ${damageRolls.join(', ')}`;
      }

      setDiceRollResult({
        ...attackRoll,
        total: totalAttack,
        formatted: `Attack Roll: 1d20+${attack_bonus} = ${rollValue}+${attack_bonus} = ${totalAttack}${damageText}`
      });
      setRollActionName(name);
    } else {
      // Try to extract attack bonus from description text
      const attackBonusMatch = actionDescription.match(/[+-](\d+)\s*to\s*hit/i);
      const extractedBonus = attackBonusMatch ? parseInt(attackBonusMatch[1]) : null;

      if (extractedBonus !== null) {
        // Found attack bonus in description
        const attackRoll = rollFromNotation('1d20');
        const rollValue = attackRoll.rolls ? attackRoll.rolls[0] : attackRoll.total;
        const totalAttack = attackRoll.total + extractedBonus;

        // Try to extract damage from description
        const damageMatch = actionDescription.match(/(\d+d\d+(?:[+-]\d+)?)\s*(\w+)?\s*damage/i);
        let damageText = '';

        if (damageMatch) {
          const damageRoll = rollFromNotation(damageMatch[1]);
          const damageType = damageMatch[2] || '';
          damageText = ` | Damage: ${damageRoll.total} ${damageType}`;
        }

        setDiceRollResult({
          ...attackRoll,
          total: totalAttack,
          formatted: `Attack Roll: 1d20+${extractedBonus} = ${rollValue}+${extractedBonus} = ${totalAttack}${damageText}`
        });
        setRollActionName(name);
      } else {
        // Try to extract any dice notation from description for damage roll
        const diceMatch = actionDescription.match(/(\d+d\d+(?:[+-]\d+)?)/i);

        if (diceMatch) {
          const result = rollFromNotation(diceMatch[0]);
          if (result) {
            setDiceRollResult(result);
            setRollActionName(`${name} - Damage`);
            return;
          }
        }

        // Fallback to 1d20 for basic attack roll
        const result = rollFromNotation('1d20');
        setDiceRollResult(result);
        setRollActionName(`${name} - Attack Roll`);
      }
    }
  };

  const closeDiceModal = () => {
    setDiceRollResult(null);
    setRollActionName('');
  };

  return {
    diceRollResult,
    rollActionName,
    handleAbilityRoll,
    handleAttackActionRoll,
    closeDiceModal
  };
};

export default useDiceRolling;
