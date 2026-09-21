/**
 * Food vs Non-Food Classification Engine
 * Evaluates whether an item is a food product, non-food product, or requires manual review.
 */

export const CLASSIFICATION_STATUS = {
  FOOD: 'FOOD PRODUCT DETECTED',
  NON_FOOD: 'NON-FOOD PRODUCT',
  UNCERTAIN: 'UNCERTAIN — REQUIRES REVIEW',
};

// Common food ingredient keywords & indicators
const FOOD_KEYWORDS = [
  'ingredients', 'nutrition', 'nutritional information', 'energy', 'calories', 'protein',
  'carbohydrate', 'sugar', 'added sugar', 'fat', 'saturated fat', 'trans fat', 'sodium',
  'fibre', 'dietary fiber', 'serving size', 'per 100g', 'per 100ml', 'per serve',
  'mfg date', 'mfd', 'exp date', 'expiry', 'best before', 'use by', 'packed on', 'pkd',
  'fssai', 'lic no', 'license no', 'vegetarian', 'non-vegetarian', 'veg logo',
  'net weight', 'net qty', 'net quantity', 'wheat', 'milk', 'sugar', 'salt', 'oil',
  'flour', 'cocoa', 'spice', 'water', 'tea', 'coffee', 'juice', 'biscuit', 'snack',
  'cereal', 'sauce', 'butter', 'cheese', 'rice', 'dal', 'pulse', 'chocolate'
];

// Common non-food keywords & indicators
const NON_FOOD_KEYWORDS = [
  'shampoo', 'conditioner', 'detergent', 'soap', 'body wash', 'lotion', 'cream', 'face wash',
  'cosmetic', 'perfume', 'deodorant', 'toothpaste', 'brush', 'battery', 'charger', 'cable',
  'electronic', 'appliance', 'hardware', 'tool', 'stationery', 'notebook', 'pen', 'pencil',
  'clothing', 'shirt', 'trouser', 'fabric', 'shoe', 'cleaner', 'bleach', 'disinfectant',
  'insecticide', 'pesticide', 'paint', 'varnish', 'lubricant', 'motor oil', 'medicine',
  'tablet', 'capsule', 'syrup', 'ointment', 'pharmaceutical'
];

/**
 * Classifies a product based on extracted text, image tags, and packaging clues.
 * @param {Object} data - Extracted data or text from scan
 * @returns {Object} Classification result with status, confidence, and reasoning
 */
export function classifyProduct(data = {}) {
  const text = (typeof data === 'string' ? data : (data.rawText || data.productName || '')).toLowerCase();
  
  if (!text || text.trim().length < 5) {
    return {
      status: CLASSIFICATION_STATUS.UNCERTAIN,
      confidence: 0.2,
      category: 'Unknown',
      isFood: false,
      reason: 'Insufficient packaging text or image clarity to confidently classify the product.',
      guidance: 'Unable to confidently classify this product. Please upload clearer packaging images or review the result manually.'
    };
  }

  let foodScore = 0;
  let nonFoodScore = 0;
  const matchedFoodTokens = [];
  const matchedNonFoodTokens = [];

  FOOD_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) {
      foodScore += (keyword === 'fssai' || keyword === 'nutrition' || keyword === 'ingredients') ? 3 : 1;
      matchedFoodTokens.push(keyword);
    }
  });

  NON_FOOD_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) {
      nonFoodScore += 3;
      matchedNonFoodTokens.push(keyword);
    }
  });

  // Explicit non-food dominance
  if (nonFoodScore > 3 && nonFoodScore > foodScore) {
    return {
      status: CLASSIFICATION_STATUS.NON_FOOD,
      confidence: Math.min(0.95, 0.5 + (nonFoodScore * 0.1)),
      category: 'Non-Food / Household / Personal Care',
      isFood: false,
      reason: `Detected non-food indicators (${matchedNonFoodTokens.slice(0, 3).join(', ')}).`,
      guidance: 'This product does not appear to be a food product. LabelSure is designed for food product analysis only. Please scan a valid food product.'
    };
  }

  // Clear food signals
  if (foodScore >= 3 && foodScore > nonFoodScore) {
    return {
      status: CLASSIFICATION_STATUS.FOOD,
      confidence: Math.min(0.98, 0.6 + (foodScore * 0.05)),
      category: 'Packaged Food & Beverage',
      isFood: true,
      reason: `Detected food labelling markers (${matchedFoodTokens.slice(0, 4).join(', ')}).`,
      guidance: 'Valid food product detected. Proceeding to compliance and nutritional analysis.'
    };
  }

  // Borderline or mixed signals
  return {
    status: CLASSIFICATION_STATUS.UNCERTAIN,
    confidence: 0.45,
    category: 'Uncertain Product Category',
    isFood: false,
    reason: 'Mixed or insufficient packaging indicators to confirm if this is a packaged food product.',
    guidance: 'Unable to confidently classify this product. Please upload clearer packaging images or review the result manually.'
  };
}
