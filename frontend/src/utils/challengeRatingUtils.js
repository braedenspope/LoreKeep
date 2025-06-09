// frontend/src/utils/challengeRatingUtils.js
// Utility functions for displaying challenge ratings properly

/**
 * Format challenge rating for display - converts decimals to fractions
 * @param {string|number} cr - The challenge rating value
 * @returns {string} - Formatted challenge rating
 */
export const formatChallengeRating = (cr) => {
  if (!cr && cr !== 0) return 'Unknown';
  
  // Convert to string if it's a number
  const crStr = String(cr).trim();
  
  // If it's already a fraction, return as-is
  if (crStr.includes('/')) {
    return crStr;
  }
  
  // Convert decimal values to fractions
  const crNum = parseFloat(crStr);
  
  if (isNaN(crNum)) return crStr;
  
  // Map common decimal values to fractions
  const fractionMap = {
    0: '0',
    0.125: '1/8',
    0.25: '1/4',
    0.5: '1/2'
  };
  
  // Check if it's a known fraction
  if (fractionMap.hasOwnProperty(crNum)) {
    return fractionMap[crNum];
  }
  
  // For whole numbers 1 and above, return as-is
  if (crNum >= 1 && Number.isInteger(crNum)) {
    return String(crNum);
  }
  
  // For other decimals, try to convert to simple fractions
  if (crNum < 1) {
    // Try to find a simple fraction representation
    const denominators = [2, 3, 4, 5, 6, 8, 10, 16];
    
    for (const denom of denominators) {
      const numerator = Math.round(crNum * denom);
      if (Math.abs((numerator / denom) - crNum) < 0.001) {
        // Simplify the fraction
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(numerator, denom);
        const simplifiedNum = numerator / divisor;
        const simplifiedDenom = denom / divisor;
        
        if (simplifiedDenom === 1) {
          return String(simplifiedNum);
        }
        return `${simplifiedNum}/${simplifiedDenom}`;
      }
    }
  }
  
  // Fallback to original string
  return crStr;
};

/**
 * Get challenge rating for sorting purposes
 * @param {string|number} cr - The challenge rating value
 * @returns {number} - Numeric value for sorting
 */
export const getChallengeRatingValue = (cr) => {
  if (!cr && cr !== 0) return -1;
  
  const crStr = String(cr).trim();
  
  // Handle fractions
  if (crStr.includes('/')) {
    const [numerator, denominator] = crStr.split('/').map(Number);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }
  
  // Handle regular numbers
  const crNum = parseFloat(crStr);
  return isNaN(crNum) ? -1 : crNum;
};

/**
 * Sort challenge ratings properly (0, 1/8, 1/4, 1/2, 1, 2, etc.)
 * @param {Array} items - Array of items with challenge_rating property
 * @returns {Array} - Sorted array
 */
export const sortByChallengeRating = (items) => {
  return [...items].sort((a, b) => {
    const aValue = getChallengeRatingValue(a.challenge_rating);
    const bValue = getChallengeRatingValue(b.challenge_rating);
    return aValue - bValue;
  });
};