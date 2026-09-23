/**
 * Strict Nutritional Profiling & A+ to F Health Grading Engine
 * Evaluates verified nutritional parameters and ingredient composition against strict public health benchmarks.
 * IMPORTANT: Strictly decoupled from statutory regulatory compliance.
 */

export const HEALTH_GRADES = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];

export const HEALTH_DISCLAIMER = 
  'This health grade is an automated preliminary assessment based on available nutritional facts and ingredient composition. It is not an official government certification, not an FSSAI rating, and does not constitute clinical dietary advice.';

// Ultra-processed / high-concern ingredient patterns
const CONCERN_INGREDIENTS = [
  { pattern: /palm\s*(?:oil|fat|kernel)|hydrogenated|partially\s*hydrogenated|trans\s*fat/i, label: 'Contains palm oil or hydrogenated fats' },
  { pattern: /high\s*fructose|corn\s*syrup|invert\s*sugar|glucose-fructose|maltodextrin|dextrose/i, label: 'Contains refined high-glycemic syrups' },
  { pattern: /artificial\s*(?:sweetener|colour|flavor|flavour)|aspartame|sucralose|acesulfame|saccharin/i, label: 'Contains artificial additives or intense sweeteners' },
  { pattern: /monosodium\s*glutamate|\bmsg\b|flavour\s*enhancer/i, label: 'Contains added flavor enhancers / MSG' },
];

/**
 * Calculates a strict, evidence-based A+ to F health grade based on nutrient thresholds per 100g.
 * @param {Object} nutritionalData - Extracted nutritional facts
 * @param {string} [ingredientsRaw=''] - Extracted raw ingredients text
 * @param {string} [foodClassification='Food Product'] - Food classification string
 * @returns {Object} Strict health rating assessment with score, grade, positives, concerns, and explanation
 */
export function calculateHealthGrade(nutritionalData = {}, ingredientsRaw = '', foodClassification = 'Food Product') {
  const classStr = String(foodClassification || '').toUpperCase();
  const isNonFood = classStr.includes('NON-FOOD') || classStr.includes('NON_FOOD') || classStr.includes('COMMODITY');
  const isUncertain = !isNonFood && (classStr.includes('UNCERTAIN') || classStr.includes('UNKNOWN'));

  // 1. NON-FOOD Guard: Strictly omit health grading and letters
  if (isNonFood) {
    return {
      available: false,
      isNonFood: true,
      grade: null,
      score: null,
      status: 'NOT_APPLICABLE',
      reason: 'Health grading is not applicable to this product.',
      guidance: 'Nutritional profiling, A+ to F grading, and nutrient quality scores are restricted exclusively to human food and beverage products.',
      disclaimer: HEALTH_DISCLAIMER,
      positives: [],
      concerns: [],
      whyThisGrade: 'Health grading is not applicable to non-food commodities.',
      nutrientsUsed: {},
    };
  }

  // 2. UNCERTAIN Guard: Require classification confirmation before grading
  if (isUncertain) {
    return {
      available: false,
      isUncertain: true,
      grade: null,
      score: null,
      status: 'UNAVAILABLE',
      reason: 'Health rating unavailable: Product type could not be determined confidently.',
      guidance: 'Mixed or insufficient packaging indicators were detected. Please upload clearer packaging images or verify product classification.',
      disclaimer: HEALTH_DISCLAIMER,
      positives: [],
      concerns: [],
      whyThisGrade: 'Product type could not be determined confidently.',
      nutrientsUsed: {},
    };
  }

  // 3. FOOD with missing or insufficient nutrition panel
  if (!nutritionalData || !nutritionalData.hasNutritionPanel) {
    return {
      available: false,
      isFood: true,
      grade: null,
      score: null,
      status: 'UNAVAILABLE',
      reason: 'Health rating unavailable: Insufficient nutritional information.',
      guidance: 'No nutritional panel was detected in the scanned packaging. To receive a health grade, please provide a clear view of the nutrition facts table.',
      disclaimer: HEALTH_DISCLAIMER,
      positives: [],
      concerns: ['No nutritional facts panel detected'],
      whyThisGrade: 'Nutritional information is insufficient to evaluate dietary quality.',
      nutrientsUsed: {},
    };
  }

  const {
    energyKcal,
    totalSugarG,
    addedSugarG,
    saturatedFatG,
    transFatG,
    sodiumMg,
    proteinG,
    dietaryFibreG,
    servingSize,
  } = nutritionalData;

  // Require at least 2 key macronutrients to avoid blind guessing
  const availableKeyFields = [energyKcal, totalSugarG, saturatedFatG, sodiumMg].filter(v => v !== null && v !== undefined);
  if (availableKeyFields.length < 2) {
    return {
      available: false,
      grade: null,
      score: null,
      reason: 'Health rating unavailable: Insufficient nutritional information.',
      guidance: 'Essential macronutrient values (calories, sugars, saturated fats, or sodium) could not be extracted with sufficient confidence.',
      disclaimer: HEALTH_DISCLAIMER,
      positives: [],
      concerns: ['Essential macronutrient data missing'],
      whyThisGrade: 'Insufficient nutritional facts to generate a reliable health grade.',
      nutrientsUsed: nutritionalData,
    };
  }

  // --- Strict Multi-Factor Scoring (Baseline 50 points) ---
  let score = 50;
  const positives = [];
  const concerns = [];
  let maxGradeCap = 'A+'; // Enforces caps when negative factors are high

  const capGradeTo = (cap) => {
    const order = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];
    if (order.indexOf(cap) > order.indexOf(maxGradeCap)) {
      maxGradeCap = cap;
    }
  };

  // 1. Sugars (Strict WHO / Dietary Guidelines threshold per 100g)
  const sugarVal = addedSugarG !== null ? addedSugarG : totalSugarG;
  if (sugarVal !== null) {
    if (sugarVal > 35) {
      score -= 35;
      concerns.push(`Excessive sugar (${sugarVal}g/100g)`);
      capGradeTo('D');
    } else if (sugarVal > 22) {
      score -= 25;
      concerns.push(`High sugar content (${sugarVal}g/100g)`);
      capGradeTo('C');
    } else if (sugarVal > 10) {
      score -= 12;
      concerns.push(`Moderate sugar (${sugarVal}g/100g)`);
      capGradeTo('B');
    } else if (sugarVal > 5) {
      score -= 4;
    } else {
      score += 10;
      positives.push(`Low sugar (${sugarVal}g/100g)`);
    }
  }

  // 2. Saturated Fat (Threshold per 100g)
  if (saturatedFatG !== null) {
    if (saturatedFatG > 12) {
      score -= 30;
      concerns.push(`High saturated fat (${saturatedFatG}g/100g)`);
      capGradeTo('D');
    } else if (saturatedFatG > 5) {
      score -= 18;
      concerns.push(`Elevated saturated fat (${saturatedFatG}g/100g)`);
      capGradeTo('C');
    } else if (saturatedFatG > 2) {
      score -= 8;
      concerns.push(`Moderate saturated fat (${saturatedFatG}g/100g)`);
      capGradeTo('B');
    } else {
      score += 8;
      positives.push(`Low saturated fat (${saturatedFatG}g/100g)`);
    }
  }

  // 3. Trans Fat (Strict Zero Tolerance)
  if (transFatG !== null && transFatG > 0.2) {
    score -= 30;
    concerns.push(`Contains trans fats (${transFatG}g/100g)`);
    capGradeTo('E');
  }

  // 4. Sodium / Salt (Threshold per 100g)
  if (sodiumMg !== null) {
    if (sodiumMg > 900) {
      score -= 25;
      concerns.push(`High sodium (${sodiumMg}mg/100g)`);
      capGradeTo('D');
    } else if (sodiumMg > 500) {
      score -= 15;
      concerns.push(`Elevated sodium (${sodiumMg}mg/100g)`);
      capGradeTo('C');
    } else if (sodiumMg > 250) {
      score -= 6;
      concerns.push(`Moderate sodium (${sodiumMg}mg/100g)`);
      capGradeTo('B');
    } else {
      score += 8;
      positives.push(`Low sodium (${sodiumMg}mg/100g)`);
    }
  }

  // 5. Energy Density (Calories)
  if (energyKcal !== null) {
    if (energyKcal > 480) {
      score -= 12;
      concerns.push(`High caloric density (${energyKcal} kcal/100g)`);
    } else if (energyKcal > 350) {
      score -= 6;
    } else if (energyKcal < 200) {
      score += 6;
      positives.push(`Low caloric density (${energyKcal} kcal/100g)`);
    }
  }

  // 6. Positive Factor: Protein
  if (proteinG !== null) {
    if (proteinG >= 15) {
      score += 15;
      positives.push(`Rich in protein (${proteinG}g/100g)`);
    } else if (proteinG >= 8) {
      score += 8;
      positives.push(`Good source of protein (${proteinG}g/100g)`);
    }
  }

  // 7. Positive Factor: Dietary Fibre
  if (dietaryFibreG !== null) {
    if (dietaryFibreG >= 7) {
      score += 15;
      positives.push(`High dietary fibre (${dietaryFibreG}g/100g)`);
    } else if (dietaryFibreG >= 3.5) {
      score += 8;
      positives.push(`Source of dietary fibre (${dietaryFibreG}g/100g)`);
    }
  }

  // 8. Ingredient Quality Analysis
  if (ingredientsRaw && typeof ingredientsRaw === 'string') {
    CONCERN_INGREDIENTS.forEach(ci => {
      if (ci.pattern.test(ingredientsRaw)) {
        score -= 10;
        concerns.push(ci.label);
        capGradeTo('C');
      }
    });

    if (/^([a-z\s]+)(?:100%|whole|roasted|organic|raw)\b/i.test(ingredientsRaw) && !/sugar|syrup|oil|fat|flavour/i.test(ingredientsRaw)) {
      score += 10;
      positives.push('Clean whole-food ingredient composition');
    }
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine Grade with strict thresholds
  let calculatedGrade = 'F';
  if (score >= 92) calculatedGrade = 'A+';
  else if (score >= 80) calculatedGrade = 'A';
  else if (score >= 65) calculatedGrade = 'B';
  else if (score >= 48) calculatedGrade = 'C';
  else if (score >= 32) calculatedGrade = 'D';
  else if (score >= 18) calculatedGrade = 'E';
  else calculatedGrade = 'F';

  // Apply maximum grade cap from negative factors
  const order = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];
  let finalGrade = calculatedGrade;
  if (order.indexOf(calculatedGrade) < order.indexOf(maxGradeCap)) {
    finalGrade = maxGradeCap;
  }

  // Generate dynamic evidence-based explanation
  let whyThisGrade = '';
  if (finalGrade === 'A+' || finalGrade === 'A') {
    whyThisGrade = 'High nutritional quality with wholesome macronutrient balance, minimal sugar, and low saturated fat.';
  } else if (finalGrade === 'B') {
    whyThisGrade = 'Generally sound nutritional profile suitable for a balanced diet, with modest sugar or sodium.';
  } else if (finalGrade === 'C') {
    whyThisGrade = 'Moderate dietary concerns: elevated sugar, saturated fat, sodium, or refined ingredients offset the positive nutrients.';
  } else if (finalGrade === 'D') {
    whyThisGrade = 'High nutritional concern due to significantly elevated sugars, saturated fats, or sodium levels.';
  } else {
    whyThisGrade = 'Very high concentration of negative nutrients (sugars, saturated fats, or sodium) with minimal positive dietary elements.';
  }

  return {
    available: true,
    grade: finalGrade,
    score,
    gradeSummary: whyThisGrade,
    whyThisGrade,
    positives,
    concerns,
    nutrientsUsed: {
      energyKcal,
      totalSugarG,
      addedSugarG,
      saturatedFatG,
      transFatG,
      sodiumMg,
      proteinG,
      dietaryFibreG,
      servingSize: servingSize || '100g',
    },
    disclaimer: HEALTH_DISCLAIMER,
  };
}
