/**
 * Nutritional Profiling & A+ to F Health Grading Engine
 * Evaluates available nutritional parameters to compute an informational health grade.
 * IMPORTANT: This is kept completely separate from statutory legal compliance.
 */

export const HEALTH_GRADES = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];

export const HEALTH_DISCLAIMER = 
  'This health grade is an automated informational assessment based on extracted nutritional parameters and documented dietary profiling models. It is not an official government rating, not an official FSSAI grading system, and does not constitute medical or clinical dietary advice.';

/**
 * Calculates the A+ to F health grade based on nutrient thresholds per 100g / per serve.
 * @param {Object} nutritionalData - Extracted nutritional facts
 * @returns {Object} Health rating assessment with score, grade, breakdown, and explanation
 */
export function calculateHealthGrade(nutritionalData = {}) {
  // If no nutrition panel or crucial fields are missing, return unavailable
  if (!nutritionalData || !nutritionalData.hasNutritionPanel) {
    return {
      available: false,
      grade: null,
      score: null,
      reason: 'Health rating unavailable: Insufficient nutritional information.',
      guidance: 'No nutritional panel was detected in the scanned packaging. To receive a health grade, please scan a clear view of the nutrition facts table.',
      disclaimer: HEALTH_DISCLAIMER,
      nutrientsUsed: {},
      pointsBreakdown: null,
    };
  }

  const {
    energyKcal,
    totalSugarG,
    addedSugarG,
    saturatedFatG,
    sodiumMg,
    proteinG,
    dietaryFibreG,
    servingSize,
  } = nutritionalData;

  // We require at least 2 key macronutrients (e.g. Energy and Sugar/Fat/Sodium) to avoid hallucinating a score
  const availableKeyFields = [energyKcal, totalSugarG, saturatedFatG, sodiumMg].filter(v => v !== null && v !== undefined);
  if (availableKeyFields.length < 2) {
    return {
      available: false,
      grade: null,
      score: null,
      reason: 'Health rating unavailable: Insufficient nutritional information.',
      guidance: 'Key macronutrient values (such as calories, sugars, saturated fats, or sodium) could not be extracted confidently.',
      disclaimer: HEALTH_DISCLAIMER,
      nutrientsUsed: nutritionalData,
      pointsBreakdown: null,
    };
  }

  // --- Profiling Algorithm (Transparent 100-point scale adapted from dietary health models) ---
  // Starts at baseline of 70 points
  let score = 70;
  const factors = [];

  // 1. Sugars Assessment
  const sugarValue = addedSugarG !== null ? addedSugarG : totalSugarG;
  if (sugarValue !== null) {
    if (sugarValue > 25) {
      score -= 25;
      factors.push({ name: 'Very High Sugar', impact: -25, detail: `${sugarValue}g sugars per 100g exceeds recommended threshold (>25g)` });
    } else if (sugarValue > 12.5) {
      score -= 15;
      factors.push({ name: 'High Sugar', impact: -15, detail: `${sugarValue}g sugars per 100g is moderate-to-high` });
    } else if (sugarValue > 5) {
      score -= 5;
      factors.push({ name: 'Moderate Sugar', impact: -5, detail: `${sugarValue}g sugars per 100g` });
    } else {
      score += 5;
      factors.push({ name: 'Low Sugar', impact: +5, detail: `Low sugar content (${sugarValue}g per 100g)` });
    }
  }

  // 2. Saturated Fat Assessment
  if (saturatedFatG !== null) {
    if (saturatedFatG > 10) {
      score -= 20;
      factors.push({ name: 'Very High Saturated Fat', impact: -20, detail: `${saturatedFatG}g saturated fat per 100g exceeds recommended limits (>10g)` });
    } else if (saturatedFatG > 4) {
      score -= 10;
      factors.push({ name: 'Moderate Saturated Fat', impact: -10, detail: `${saturatedFatG}g saturated fat per 100g` });
    } else {
      score += 5;
      factors.push({ name: 'Low Saturated Fat', impact: +5, detail: `Low saturated fat (${saturatedFatG}g per 100g)` });
    }
  }

  // 3. Sodium / Salt Assessment
  if (sodiumMg !== null) {
    if (sodiumMg > 900) {
      score -= 20;
      factors.push({ name: 'High Sodium', impact: -20, detail: `${sodiumMg}mg sodium per 100g exceeds high sodium mark (>900mg)` });
    } else if (sodiumMg > 400) {
      score -= 10;
      factors.push({ name: 'Moderate Sodium', impact: -10, detail: `${sodiumMg}mg sodium per 100g` });
    } else {
      score += 5;
      factors.push({ name: 'Low Sodium', impact: +5, detail: `Low sodium content (${sodiumMg}mg per 100g)` });
    }
  }

  // 4. Energy Density (Calories)
  if (energyKcal !== null) {
    if (energyKcal > 450) {
      score -= 10;
      factors.push({ name: 'High Energy Density', impact: -10, detail: `${energyKcal} kcal per 100g is calorically dense` });
    } else if (energyKcal < 200) {
      score += 5;
      factors.push({ name: 'Low Energy Density', impact: +5, detail: `Moderate/low caloric density (${energyKcal} kcal)` });
    }
  }

  // 5. Positive Nutrients: Protein
  if (proteinG !== null) {
    if (proteinG >= 10) {
      score += 15;
      factors.push({ name: 'Rich in Protein', impact: +15, detail: `High protein content (${proteinG}g per 100g)` });
    } else if (proteinG >= 5) {
      score += 8;
      factors.push({ name: 'Source of Protein', impact: +8, detail: `Moderate protein content (${proteinG}g per 100g)` });
    }
  }

  // 6. Positive Nutrients: Dietary Fibre
  if (dietaryFibreG !== null) {
    if (dietaryFibreG >= 6) {
      score += 15;
      factors.push({ name: 'High Dietary Fibre', impact: +15, detail: `Excellent fibre content (${dietaryFibreG}g per 100g)` });
    } else if (dietaryFibreG >= 3) {
      score += 8;
      factors.push({ name: 'Source of Dietary Fibre', impact: +8, detail: `Good fibre content (${dietaryFibreG}g per 100g)` });
    }
  }

  // Bound score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Map score to Grade
  let grade = 'C';
  let gradeSummary = '';
  let colorTheme = 'amber';

  if (score >= 90) {
    grade = 'A+';
    gradeSummary = 'Exceptional nutritional profile with very low sugars/fats and high beneficial nutrients.';
    colorTheme = 'emerald';
  } else if (score >= 80) {
    grade = 'A';
    gradeSummary = 'Wholesome nutritional profile with favorable macronutrient balance.';
    colorTheme = 'green';
  } else if (score >= 68) {
    grade = 'B';
    gradeSummary = 'Good nutritional profile suitable for regular consumption as part of a balanced diet.';
    colorTheme = 'teal';
  } else if (score >= 54) {
    grade = 'C';
    gradeSummary = 'Moderate nutritional profile with average sugar, fat, or sodium levels.';
    colorTheme = 'amber';
  } else if (score >= 40) {
    grade = 'D';
    gradeSummary = 'Sub-optimal nutritional profile due to elevated sugars, saturated fats, or sodium.';
    colorTheme = 'orange';
  } else if (score >= 25) {
    grade = 'E';
    gradeSummary = 'High in negative nutrients (sugars, saturated fat, or sodium). Recommended for occasional consumption.';
    colorTheme = 'rose';
  } else {
    grade = 'F';
    gradeSummary = 'Very high concentration of ultra-processed negative nutrients. Minimal positive dietary elements.';
    colorTheme = 'red';
  }

  return {
    available: true,
    grade,
    score,
    gradeSummary,
    colorTheme,
    factors,
    nutrientsUsed: {
      energyKcal,
      totalSugarG,
      addedSugarG,
      saturatedFatG,
      sodiumMg,
      proteinG,
      dietaryFibreG,
      servingSize: servingSize || '100g',
    },
    disclaimer: HEALTH_DISCLAIMER,
  };
}
