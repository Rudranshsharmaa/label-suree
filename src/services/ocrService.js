/**
 * Packaging OCR & Field Extraction Engine
 * Extracts, parses, and normalizes food packaging declarations from multi-image inputs.
 */

export const PACKAGING_VIEWS = [
  { id: 'front', label: 'Front Package Photo', description: 'Product name, brand, net quantity, veg/non-veg logo' },
  { id: 'back', label: 'Back Package Photo', description: 'Ingredients, nutritional table, manufacturer, MRP, dates, FSSAI lic.' },
];

/**
 * Deduplicates multiline text by trimming and preserving unique semantic lines.
 */
function cleanAndDeduplicateLines(text) {
  if (!text) return '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const seen = new Set();
  const unique = [];
  for (const line of lines) {
    const norm = line.toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      unique.push(line);
    }
  }
  return unique.join('\n');
}

/**
 * Parses raw extracted text from front and back packaging images to identify and normalize key declarations.
 * @param {Array<{view: string, text: string, imageUrl?: string, confidence?: number}>} imageResults
 * @param {Object} [qrData=null] Optional separate QR code payload
 * @returns {Object} Structured extracted packaging fields
 */
export function parsePackagingText(imageResults = [], qrData = null) {
  const frontResult = imageResults.find(r => r.view === 'front') || { text: '' };
  const backResult = imageResults.find(r => r.view === 'back') || { text: '' };

  const rawCombinedText = cleanAndDeduplicateLines(
    [frontResult.text || '', backResult.text || ''].join('\n')
  );
  const normalizedText = rawCombinedText;

  // 1. MRP & Tax Detection
  const mrpRegex = /(?:mrp|m\.r\.p\.?|max\s*retail\s*price|price)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i;
  const mrpTaxRegex = /(?:incl\.?|inclusive)\s*(?:of)?\s*(?:all)?\s*taxes/i;
  const mrpMatch = normalizedText.match(mrpRegex);
  const mrpTaxMatch = normalizedText.match(mrpTaxRegex);

  const mrpData = {
    value: mrpMatch ? parseFloat(mrpMatch[1]) : null,
    formatted: mrpMatch ? `₹ ${mrpMatch[1]}` : null,
    inclusiveOfTaxes: !!mrpTaxMatch,
    detectedVia: mrpMatch ? 'Packaging OCR' : null,
    sourceView: findSourceView(imageResults, mrpRegex),
    status: mrpMatch ? 'DETECTED' : 'NOT_FOUND',
    display: mrpMatch ? `₹ ${mrpMatch[1]} ${mrpTaxMatch ? '(Incl. of all taxes)' : ''}` : 'Not verified from the provided images.',
  };

  // 2. Manufacturing / Packaging Date Detection
  const mfdRegex = /(?:mfd|mfg\.?\s*date|manufactured\s*(?:on|date)?|pkd|packed\s*(?:on|date)?)\s*[:\-]?\s*([0-9]{1,2}[./\-\s][0-9]{1,2}[./\-\s][0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{2,4})/i;
  const mfdMatch = normalizedText.match(mfdRegex);

  const mfdData = {
    raw: mfdMatch ? mfdMatch[1].trim() : null,
    detectedVia: mfdMatch ? 'Packaging OCR' : null,
    sourceView: findSourceView(imageResults, mfdRegex),
    status: mfdMatch ? 'DETECTED' : 'NOT_FOUND',
    display: mfdMatch ? mfdMatch[1].trim() : 'Not verified from the provided images.',
  };

  // 3. Expiry / Best Before / Use By Detection
  const expRegex = /(?:exp(?:iry)?\.?\s*date|best\s*before|use\s*by|expires\s*(?:on)?)\s*[:\-]?\s*([0-9]{1,2}[./\-\s][0-9]{1,2}[./\-\s][0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{2,4}|[0-9]+\s*(?:months|days|weeks)\s*(?:from\s*(?:mfg|pkd|manufacture))?)/i;
  const expMatch = normalizedText.match(expRegex);

  const expData = {
    raw: expMatch ? expMatch[1].trim() : null,
    detectedVia: expMatch ? 'Packaging OCR' : null,
    sourceView: findSourceView(imageResults, expRegex),
    status: expMatch ? 'DETECTED' : 'NOT_FOUND',
    display: expMatch ? expMatch[1].trim() : 'Not verified from the provided images.',
  };

  // 4. Batch / Lot Number
  const batchRegex = /(?:batch\s*(?:no\.?|number)|lot\s*(?:no\.?|number)|b\.?\s*no\.?|b\/no\.?|bn)\s*[:\-]?\s*([A-Za-z0-9\-_/]+)/i;
  const batchMatch = normalizedText.match(batchRegex);
  const batchData = {
    value: batchMatch ? batchMatch[1].trim() : null,
    detectedVia: batchMatch ? 'Packaging OCR' : null,
    sourceView: findSourceView(imageResults, batchRegex),
    display: batchMatch ? batchMatch[1].trim() : 'Not verified from the provided images.',
  };

  // 5. Net Quantity / Weight
  const netQtyRegex = /(?:net\s*(?:qty|quantity|wt\.?|weight|volume|content))\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:g|gm|gms|kg|ml|l|ltr|litre|litres|pcs|units|count|n))/i;
  const netQtyMatch = normalizedText.match(netQtyRegex);
  const netQtyData = {
    value: netQtyMatch ? netQtyMatch[1].trim() : null,
    detectedVia: netQtyMatch ? 'Packaging OCR' : null,
    sourceView: findSourceView(imageResults, netQtyRegex),
    display: netQtyMatch ? netQtyMatch[1].trim() : 'Not verified from the provided images.',
  };

  // 6. FSSAI 14-Digit License / Registration Number
  const fssaiRegex = /(?:fssai|lic(?:ense)?\.?\s*(?:no\.?|number)?)\s*[:\-]?\s*([0-9]{14})|(?:licence\s*no\.?\s*:\s*)([0-9]{14})|\b(1[0-9]{13})\b/i;
  const fssaiMatch = normalizedText.match(fssaiRegex);
  const fssaiNumber = fssaiMatch ? (fssaiMatch[1] || fssaiMatch[2] || fssaiMatch[3]) : null;

  const fssaiData = {
    licenseNumber: fssaiNumber,
    isValidFormat: fssaiNumber ? fssaiNumber.length === 14 : false,
    hasLogo: /(?:fssai\s*logo|fssai)/i.test(normalizedText),
    detectedVia: fssaiNumber ? 'Packaging OCR' : null,
    sourceView: findSourceView(imageResults, fssaiRegex),
    display: fssaiNumber ? fssaiNumber : 'Not verified from the provided images.',
  };

  // 7. Veg / Non-Veg Indicator
  const isVeg = /(?:100%\s*vegetarian|vegetarian|green\s*dot|veg\s*logo|\bveg\b)/i.test(normalizedText) && !/(?:non[\s\-]veg)/i.test(normalizedText);
  const isNonVeg = /(?:non[\s\-]veg|contains\s*meat|contains\s*egg|non[\s\-]vegetarian|brown\s*dot)/i.test(normalizedText);

  let vegStatus = 'UNCONFIRMED';
  if (isVeg) vegStatus = 'VEGETARIAN';
  else if (isNonVeg) vegStatus = 'NON_VEGETARIAN';

  // 8. Ingredients List
  const ingredientsRegex = /ingredients\s*[:\-]?\s*([\s\S]+?)(?=(?:nutrition|mfg|packed|fssai|marketed|manufactured|storage|allergen|consumer care|$))/i;
  const ingredientsMatch = normalizedText.match(ingredientsRegex);
  const ingredientsRaw = ingredientsMatch ? ingredientsMatch[1].trim().replace(/\n+/g, ' ') : null;

  // 9. Nutritional Information Extraction
  const energyMatch = normalizedText.match(/(?:energy|calories)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:kcal|cal|kj)?/i);
  const proteinMatch = normalizedText.match(/(?:protein)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?/i);
  const carbMatch = normalizedText.match(/(?:carbohydrate|carbs|total\s*carbohydrate)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?/i);
  const sugarMatch = normalizedText.match(/(?:total\s*sugar|sugars?)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?/i);
  const addedSugarMatch = normalizedText.match(/(?:added\s*sugars?)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?/i);
  const fatMatch = normalizedText.match(/(?:total\s*fat|fat)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?/i);
  const satFatMatch = normalizedText.match(/(?:saturated\s*fat(?:ty\s*acids)?|sat\s*fat)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?/i);
  const transFatMatch = normalizedText.match(/(?:trans\s*fat(?:ty\s*acids)?)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?/i);
  const sodiumMatch = normalizedText.match(/(?:sodium|salt)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:mg|g)?/i);
  const fibreMatch = normalizedText.match(/(?:dietary\s*fibre|fiber)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?/i);
  const servingSizeMatch = normalizedText.match(/(?:serving\s*size|per\s*serve)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:g|ml|piece|pack)?)/i);

  const hasNutritionPanel = !!(energyMatch || proteinMatch || carbMatch || fatMatch || sugarMatch);

  const nutritionalData = {
    hasNutritionPanel,
    energyKcal: energyMatch ? parseFloat(energyMatch[1]) : null,
    proteinG: proteinMatch ? parseFloat(proteinMatch[1]) : null,
    carbohydratesG: carbMatch ? parseFloat(carbMatch[1]) : null,
    totalSugarG: sugarMatch ? parseFloat(sugarMatch[1]) : null,
    addedSugarG: addedSugarMatch ? parseFloat(addedSugarMatch[1]) : null,
    fatG: fatMatch ? parseFloat(fatMatch[1]) : null,
    saturatedFatG: satFatMatch ? parseFloat(satFatMatch[1]) : null,
    transFatG: transFatMatch ? parseFloat(transFatMatch[1]) : null,
    sodiumMg: sodiumMatch ? parseFloat(sodiumMatch[1]) : null,
    dietaryFibreG: fibreMatch ? parseFloat(fibreMatch[1]) : null,
    servingSize: servingSizeMatch ? servingSizeMatch[1].trim() : 'Per 100g',
  };

  // 10. Manufacturer / Packer / Customer Care Details
  const mfgDetailsRegex = /(?:manufactured\s*by|marketed\s*by|packed\s*by|mfd\s*by)\s*[:\-]?\s*([^\n]+)/i;
  const mfgDetailsMatch = normalizedText.match(mfgDetailsRegex);
  const customerCareRegex = /(?:customer\s*care|consumer\s*care|feedback|grievance|contact\s*us)\s*[:\-]?\s*([^\n]+)/i;
  const customerCareMatch = normalizedText.match(customerCareRegex);

  return {
    rawCombinedText: normalizedText,
    mrp: mrpData,
    manufacturingDate: mfdData,
    expiryDate: expData,
    batchNumber: batchData,
    netQuantity: netQtyData,
    fssai: fssaiData,
    vegNonVegStatus: vegStatus,
    ingredientsRaw: ingredientsRaw,
    nutritionalData: nutritionalData,
    manufacturerInfo: mfgDetailsMatch ? mfgDetailsMatch[1].trim() : null,
    customerCareInfo: customerCareMatch ? customerCareMatch[1].trim() : null,
    qrData: qrData ? {
      payload: qrData,
      note: 'Decoupled from physical packaging OCR; dates/MRP verified from physical image views.',
    } : null,
  };
}

function findSourceView(imageResults, regex) {
  for (const item of imageResults) {
    if (item.text && regex.test(item.text)) {
      return item.view || 'Packaging Image';
    }
  }
  return null;
}
