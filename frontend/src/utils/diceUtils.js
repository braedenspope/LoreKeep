// Create this file: frontend/src/utils/diceUtils.js

// Roll a single die
export const rollDie = (sides) => {
  return Math.floor(Math.random() * sides) + 1;
};

// Roll multiple dice
export const rollDice = (count, sides) => {
  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides));
  }
  return rolls;
};

// Calculate ability modifier from ability score
export const getAbilityModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

// Format modifier for display (+3, -1, etc.)
export const formatModifier = (modifier) => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

// Parse dice notation (like "1d20+3" or "2d6")
export const parseDiceNotation = (notation) => {
  const match = notation.match(/(\d+)d(\d+)(?:([+-])(\d+))?/i);
  if (!match) return null;
  
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] && match[4] ? 
      (match[3] === '+' ? parseInt(match[4], 10) : -parseInt(match[4], 10)) : 0
  };
};

// Roll dice from notation
export const rollFromNotation = (notation) => {
  const parsed = parseDiceNotation(notation);
  if (!parsed) return null;
  
  const rolls = rollDice(parsed.count, parsed.sides);
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + parsed.modifier;
  
  return {
    rolls,
    modifier: parsed.modifier,
    total,
    notation
  };
};

// Roll ability check (1d20 + ability modifier)
export const rollAbilityCheck = (abilityScore) => {
  const modifier = getAbilityModifier(abilityScore);
  const roll = rollDie(20);
  return {
    roll,
    modifier,
    total: roll + modifier,
    formatted: `1d20${formatModifier(modifier)} = ${roll}${formatModifier(modifier)} = ${roll + modifier}`
  };
};