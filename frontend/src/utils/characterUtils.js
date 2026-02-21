// Helper function to safely parse JSON data (actions, abilities, etc.)
export const safeParseActions = (actionsData) => {
  if (!actionsData) return [];

  // If it's already an array, return it
  if (Array.isArray(actionsData)) return actionsData;

  // If it's a string, try to parse it
  if (typeof actionsData === 'string') {
    // Check for common invalid values
    if (actionsData === '[object Object]' || actionsData === 'undefined' || actionsData === 'null' || actionsData.trim() === '') {
      return [];
    }

    try {
      const parsed = JSON.parse(actionsData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  // If it's an object, wrap it in an array
  if (typeof actionsData === 'object') {
    return [actionsData];
  }

  return [];
};

// Check if an action is an attack (contains attack-related keywords)
export const isAttackAction = (action) => {
  if (!action) return false;

  const actionText = (action.description || action.desc || '').toLowerCase();
  const actionName = (action.name || '').toLowerCase();

  // Check if it has attack_bonus (definitive indicator)
  if (action.attack_bonus || action.attack_bonus === 0) {
    return true;
  }

  // Check for attack-related keywords
  const attackKeywords = [
    'hit:', 'melee weapon attack', 'ranged weapon attack',
    'spell attack', 'weapon attack', 'to hit', 'damage:'
  ];

  // Check basic keywords first
  const hasAttackKeyword = attackKeywords.some(keyword =>
    actionText.includes(keyword) || actionName.includes(keyword)
  );

  if (hasAttackKeyword) return true;

  // Check for "+X to hit" pattern with proper regex escaping
  const attackBonusPattern = /[+-]\d+\s*to\s*hit/i;
  if (attackBonusPattern.test(actionText) || attackBonusPattern.test(actionName)) {
    return true;
  }

  return false;
};

// Filter and sort characters alphabetically
export const filterAndSortCharacters = (characters, filter, searchTerm) => {
  return characters
    .filter(char => {
      // Filter by character type
      if (filter !== 'all' && char.character_type !== filter) {
        return false;
      }

      // Filter by search term
      if (searchTerm && !char.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort alphabetically by name (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
};

// Default form data for character creation
export const getDefaultFormData = () => ({
  name: '',
  character_type: 'NPC',
  description: '',
  stats: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    armorClass: 10,
    hitPoints: 10,
    actions: []
  }
});

// Build stats object from a character record (for editing)
export const buildStatsFromCharacter = (character) => {
  if (character.stats && typeof character.stats === 'string') {
    try {
      return JSON.parse(character.stats);
    } catch (e) {
      // Fall through to manual construction
    }
  }

  return {
    strength: character.strength || 10,
    dexterity: character.dexterity || 10,
    constitution: character.constitution || 10,
    intelligence: character.intelligence || 10,
    wisdom: character.wisdom || 10,
    charisma: character.charisma || 10,
    armorClass: character.armor_class || 10,
    hitPoints: character.hit_points || 10,
    actions: safeParseActions(character.actions)
  };
};

// Build request body for character create/update API calls
export const buildCharacterRequestBody = (formData) => ({
  name: formData.name,
  character_type: formData.character_type,
  description: formData.description,
  // Send individual stat fields
  strength: formData.stats.strength,
  dexterity: formData.stats.dexterity,
  constitution: formData.stats.constitution,
  intelligence: formData.stats.intelligence,
  wisdom: formData.stats.wisdom,
  charisma: formData.stats.charisma,
  armor_class: formData.stats.armorClass,
  hit_points: formData.stats.hitPoints,
  // Make sure actions are properly stringified
  actions: formData.stats.actions && formData.stats.actions.length > 0
    ? JSON.stringify(formData.stats.actions)
    : null
});
