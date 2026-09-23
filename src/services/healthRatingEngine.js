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

  // --- Balanced Multi-Factor Scoring (Baseline 55 points) ---
  let score = 55;
  const positives = [];
  const concerns = [];
  const factors = [];
  let maxGradeCap = 'A+'; // Enforces caps only on extreme critical hazards

  const capGradeTo = (cap) => {
    const order = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];
    if (order.indexOf(cap) > order.indexOf(maxGradeCap)) {
      maxGradeCap = cap;
    }
  };

  const hasPositiveNutrients = (proteinG !== null && proteinG !== undefined && proteinG >= 4.0) ||
                               (dietaryFibreG !== null && dietaryFibreG !== undefined && dietaryFibreG >= 2.0);

  // 1. Sugars: Prioritize Added Sugars over Total Sugars
  if (addedSugarG !== null && addedSugarG !== undefined) {
    if (addedSugarG > 30) {
      score -= 30;
      concerns.push(`Excessive added sugar (${addedSugarG}g/100g)`);
      factors.push({ name: 'Added Sugar', impact: -30, detail: `Excessive added sugar concentration (${addedSugarG}g/100g)` });
      capGradeTo('D');
    } else if (addedSugarG > 20) {
      score -= 20;
      concerns.push(`High added sugar (${addedSugarG}g/100g)`);
      factors.push({ name: 'Added Sugar', impact: -20, detail: `High added sugar (${addedSugarG}g/100g)` });
      capGradeTo('C');
    } else if (addedSugarG > 8) {
      if (!hasPositiveNutrients) {
        score -= 22;
        concerns.push(`High liquid/empty added sugar (${addedSugarG}g/100g)`);
        factors.push({ name: 'Added Sugar', impact: -22, detail: `High liquid/empty added sugar (${addedSugarG}g/100g)` });
        capGradeTo('D');
      } else {
        score -= 10;
        concerns.push(`Moderate added sugar (${addedSugarG}g/100g)`);
        factors.push({ name: 'Added Sugar', impact: -10, detail: `Moderate added sugar (${addedSugarG}g/100g)` });
      }
    } else if (addedSugarG > 4) {
      score -= 4;
      factors.push({ name: 'Added Sugar', impact: -4, detail: `Low-to-moderate added sugar (${addedSugarG}g/100g)` });
    } else {
      score += 8;
      positives.push(`Low / zero added sugar (${addedSugarG}g/100g)`);
      factors.push({ name: 'Added Sugar', impact: 8, detail: `Minimal or zero added sugar (${addedSugarG}g/100g)` });
    }
  } else if (totalSugarG !== null && totalSugarG !== undefined) {
    if (totalSugarG > 40) {
      score -= 25;
      concerns.push(`Excessive total sugar (${totalSugarG}g/100g)`);
      factors.push({ name: 'Total Sugar', impact: -25, detail: `Excessive total sugar (${totalSugarG}g/100g)` });
      capGradeTo('D');
    } else if (totalSugarG > 25) {
      score -= 16;
      concerns.push(`High total sugar (${totalSugarG}g/100g)`);
      factors.push({ name: 'Total Sugar', impact: -16, detail: `High total sugar content (${totalSugarG}g/100g)` });
    } else if (totalSugarG > 10) {
      if (!hasPositiveNutrients) {
        score -= 18;
        concerns.push(`Elevated sugar with low protein/fibre (${totalSugarG}g/100g)`);
        factors.push({ name: 'Total Sugar', impact: -18, detail: `Elevated sugar with low protein/fibre (${totalSugarG}g/100g)` });
        capGradeTo('D');
      } else {
        score -= 8;
        concerns.push(`Moderate sugar content (${totalSugarG}g/100g)`);
        factors.push({ name: 'Total Sugar', impact: -8, detail: `Moderate total sugars (${totalSugarG}g/100g)` });
      }
    } else if (totalSugarG > 5) {
      score -= 3;
      factors.push({ name: 'Total Sugar', impact: -3, detail: `Modest total sugar (${totalSugarG}g/100g)` });
    } else {
      score += 6;
      positives.push(`Low sugar content (${totalSugarG}g/100g)`);
      factors.push({ name: 'Total Sugar', impact: 6, detail: `Low sugar content (${totalSugarG}g/100g)` });
    }
  }

  // 2. Saturated Fat (Balanced & Proportionate)
  if (saturatedFatG !== null && saturatedFatG !== undefined) {
    if (saturatedFatG > 16) {
      score -= 24;
      concerns.push(`Very high saturated fat (${saturatedFatG}g/100g)`);
      factors.push({ name: 'Saturated Fat', impact: -24, detail: `Very high saturated fat content (${saturatedFatG}g/100g)` });
      capGradeTo('D');
    } else if (saturatedFatG > 10) {
      score -= 15;
      concerns.push(`High saturated fat (${saturatedFatG}g/100g)`);
      factors.push({ name: 'Saturated Fat', impact: -15, detail: `Elevated saturated fat (${saturatedFatG}g/100g)` });
    } else if (saturatedFatG > 5) {
      score -= 8;
      concerns.push(`Moderate saturated fat (${saturatedFatG}g/100g)`);
      factors.push({ name: 'Saturated Fat', impact: -8, detail: `Moderate saturated fat (${saturatedFatG}g/100g)` });
    } else if (saturatedFatG > 2.5) {
      score -= 3;
      factors.push({ name: 'Saturated Fat', impact: -3, detail: `Modest saturated fat (${saturatedFatG}g/100g)` });
    } else {
      if (hasPositiveNutrients || ((addedSugarG === null || addedSugarG === undefined || addedSugarG <= 4) && (totalSugarG === null || totalSugarG === undefined || totalSugarG <= 6))) {
        score += 6;
        positives.push(`Low saturated fat (${saturatedFatG}g/100g)`);
        factors.push({ name: 'Saturated Fat', impact: 6, detail: `Low saturated fat (${saturatedFatG}g/100g)` });
      }
    }
  }

  // 3. Trans Fat (Strict Zero Tolerance)
  if (transFatG !== null && transFatG !== undefined && transFatG > 0.2) {
    score -= 25;
    concerns.push(`Contains industrial trans fats (${transFatG}g/100g)`);
    factors.push({ name: 'Trans Fat', impact: -25, detail: `Contains trans fats (${transFatG}g/100g)` });
    capGradeTo('E');
  }

  // 4. Sodium / Salt (Balanced Public Health Standard)
  if (sodiumMg !== null && sodiumMg !== undefined) {
    if (sodiumMg > 1200) {
      score -= 25;
      concerns.push(`Very high sodium (${sodiumMg}mg/100g)`);
      factors.push({ name: 'Sodium / Salt', impact: -25, detail: `Very high sodium (${sodiumMg}mg/100g)` });
      capGradeTo('D');
    } else if (sodiumMg > 750) {
      score -= 15;
      concerns.push(`High sodium (${sodiumMg}mg/100g)`);
      factors.push({ name: 'Sodium / Salt', impact: -15, detail: `Elevated sodium content (${sodiumMg}mg/100g)` });
    } else if (sodiumMg > 400) {
      score -= 8;
      concerns.push(`Moderate sodium (${sodiumMg}mg/100g)`);
      factors.push({ name: 'Sodium / Salt', impact: -8, detail: `Moderate sodium (${sodiumMg}mg/100g)` });
    } else if (sodiumMg > 150) {
      score -= 2;
      factors.push({ name: 'Sodium / Salt', impact: -2, detail: `Low-to-moderate sodium (${sodiumMg}mg/100g)` });
    } else {
      if (hasPositiveNutrients || ((addedSugarG === null || addedSugarG === undefined || addedSugarG <= 4) && (totalSugarG === null || totalSugarG === undefined || totalSugarG <= 6))) {
        score += 6;
        positives.push(`Low sodium (${sodiumMg}mg/100g)`);
        factors.push({ name: 'Sodium / Salt', impact: 6, detail: `Low sodium content (${sodiumMg}mg/100g)` });
      }
    }
  }

  // 5. Energy Density (Contextual Adjustment)
  if (energyKcal !== null && energyKcal !== undefined) {
    if (energyKcal > 520) {
      score -= 5;
      concerns.push(`High energy density (${energyKcal} kcal/100g)`);
      factors.push({ name: 'Energy Density', impact: -5, detail: `Calorie-dense food (${energyKcal} kcal/100g)` });
    } else if (energyKcal > 400) {
      score -= 2;
      factors.push({ name: 'Energy Density', impact: -2, detail: `Moderate-high calories (${energyKcal} kcal/100g)` });
    } else if (energyKcal < 150 && ((addedSugarG !== null && addedSugarG !== undefined && addedSugarG <= 5) || (totalSugarG !== null && totalSugarG !== undefined && totalSugarG <= 6))) {
      score += 4;
      positives.push(`Low caloric density (${energyKcal} kcal/100g)`);
      factors.push({ name: 'Energy Density', impact: 4, detail: `Low caloric density (${energyKcal} kcal/100g)` });
    }
  }

  // 6. Positive Factor: Protein
  if (proteinG !== null && proteinG !== undefined) {
    if (proteinG >= 20) {
      score += 18;
      positives.push(`Rich in protein (${proteinG}g/100g)`);
      factors.push({ name: 'Protein', impact: 18, detail: `Rich protein density (${proteinG}g/100g)` });
    } else if (proteinG >= 12) {
      score += 12;
      positives.push(`High protein content (${proteinG}g/100g)`);
      factors.push({ name: 'Protein', impact: 12, detail: `High protein source (${proteinG}g/100g)` });
    } else if (proteinG >= 6) {
      score += 6;
      positives.push(`Good source of protein (${proteinG}g/100g)`);
      factors.push({ name: 'Protein', impact: 6, detail: `Source of protein (${proteinG}g/100g)` });
    }
  }

  // 7. Positive Factor: Dietary Fibre
  if (dietaryFibreG !== null && dietaryFibreG !== undefined) {
    if (dietaryFibreG >= 8) {
      score += 18;
      positives.push(`Rich in dietary fibre (${dietaryFibreG}g/100g)`);
      factors.push({ name: 'Dietary Fibre', impact: 18, detail: `Rich in dietary fibre (${dietaryFibreG}g/100g)` });
    } else if (dietaryFibreG >= 5) {
      score += 12;
      positives.push(`High dietary fibre (${dietaryFibreG}g/100g)`);
      factors.push({ name: 'Dietary Fibre', impact: 12, detail: `High dietary fibre (${dietaryFibreG}g/100g)` });
    } else if (dietaryFibreG >= 2.5) {
      score += 6;
      positives.push(`Source of dietary fibre (${dietaryFibreG}g/100g)`);
      factors.push({ name: 'Dietary Fibre', impact: 6, detail: `Source of dietary fibre (${dietaryFibreG}g/100g)` });
    }
  }

  // 8. Ingredient Quality & Whole Food Analysis
  if (ingredientsRaw && typeof ingredientsRaw === 'string') {
    CONCERN_INGREDIENTS.forEach(ci => {
      if (ci.pattern.test(ingredientsRaw)) {
        score -= 8;
        concerns.push(ci.label);
        factors.push({ name: 'Additives / Fats', impact: -8, detail: ci.label });
      }
    });

    if (/(?:100%|whole\s*grain|roasted|organic|raw|peanuts|almonds|oats)\b/i.test(ingredientsRaw) && !/added\s*sugar|corn\s*syrup|palm\s*oil|hydrogenated/i.test(ingredientsRaw)) {
      score += 10;
      positives.push('Clean whole-food ingredient profile');
      factors.push({ name: 'Ingredient Purity', impact: 10, detail: 'Clean whole-food composition with minimal industrial processing' });
    }
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine Grade with balanced, forgiving thresholds
  let calculatedGrade = 'F';
  if (score >= 88) calculatedGrade = 'A+';
  else if (score >= 75) calculatedGrade = 'A';
  else if (score >= 60) calculatedGrade = 'B';
  else if (score >= 45) calculatedGrade = 'C';
  else if (score >= 30) calculatedGrade = 'D';
  else if (score >= 18) calculatedGrade = 'E';
  else calculatedGrade = 'F';

  // Apply maximum grade cap from extreme hazards
  const order = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];
  let finalGrade = calculatedGrade;
  if (order.indexOf(calculatedGrade) < order.indexOf(maxGradeCap)) {
    finalGrade = maxGradeCap;
  }

  // Generate dynamic evidence-based explanation reflecting positive & negative balances
  let whyThisGrade = '';
  if (finalGrade === 'A+' || finalGrade === 'A') {
    whyThisGrade = 'High nutritional quality with strong protein or fibre density, minimal added sugar, and wholesome dietary balance.';
  } else if (finalGrade === 'B') {
    whyThisGrade = 'Nutritionally sound product with positive dietary characteristics (protein/fibre), balanced against modest energy density, sugar, or sodium.';
  } else if (finalGrade === 'C') {
    whyThisGrade = 'Mixed nutritional profile: meaningful positive nutrients offset by noticeable added sugars, saturated fats, or sodium levels.';
  } else if (finalGrade === 'D') {
    whyThisGrade = 'Significant nutritional concerns due to elevated concentrations of added sugars, saturated fats, or sodium with limited offset.';
  } else {
    whyThisGrade = 'Very high concentration of negative nutrients (excessive added sugars, saturated fats, or sodium) with minimal positive dietary elements.';
  }

  return {
    available: true,
    grade: finalGrade,
    score: Math.round(score),
    gradeSummary: whyThisGrade,
    whyThisGrade,
    positives,
    concerns,
    factors,
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
