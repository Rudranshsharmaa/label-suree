/**
 * Regulatory Compliance Engine
 * Evaluates extracted food packaging declarations against:
 * 1. Food Safety and Standards Act, 2006 & Labelling and Display Regulations
 * 2. Legal Metrology (Packaged Commodities) Rules, 2011
 */

export const COMPLIANCE_STATUS = {
  COMPLIANT: 'COMPLIANT',
  NON_COMPLIANT: 'NON-COMPLIANT',
  REQUIRES_REVIEW: 'REQUIRES REVIEW',
  NOT_APPLICABLE: 'NOT APPLICABLE',
  UNREADABLE: 'UNREADABLE',
  NOT_PROVIDED: 'NOT PROVIDED',
  CONFIRMED_MISSING: 'CONFIRMED MISSING',
};

export const REGULATORY_FRAMEWORK = {
  act: 'Food Safety and Standards Act, 2006',
  labellingRegs: 'Food Safety and Standards (Labelling and Display) Regulations, 2020',
  legalMetrology: 'Legal Metrology (Packaged Commodities) Rules, 2011',
  disclaimer: 'LabelSure provides preliminary automated assessments based on available images and extracted information. It is not official government certification, statutory inspection, or legal approval.'
};

/**
 * Runs rule-based compliance validation on parsed packaging data.
 * @param {Object} parsedData - Structured data from OCR extraction
 * @param {Array<string>} uploadedViews - List of packaging view IDs provided by the user
 * @param {string} [productCategory='Standard Pre-Packaged Food'] - Product category for category-aware rules
 * @returns {Object} Comprehensive compliance findings and overall status
 */
export function evaluateCompliance(parsedData, uploadedViews = [], productCategory = 'Standard Pre-Packaged Food') {
  const findings = [];
  const hasBackView = uploadedViews.includes('back') || uploadedViews.includes('ingredients_close') || uploadedViews.includes('nutrition_close');

  // Rule 1: Product Name & Brand Name
  findings.push({
    ruleId: 'FSSAI_NAME',
    ruleName: 'Product Name / Description',
    reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(1)',
    status: parsedData.rawCombinedText?.length > 10 ? COMPLIANCE_STATUS.COMPLIANT : COMPLIANCE_STATUS.REQUIRES_REVIEW,
    category: 'Product Identification',
    evidence: parsedData.productName || 'Detected from front/back typography',
    explanation: 'Clear identification of the food product is required on the principal display panel.',
  });

  // Rule 2: FSSAI 14-Digit License / Registration Number (Category-Dependent)
  const isCottageOrRawProduce = /raw|fresh produce|unprocessed|cottage/i.test(productCategory);
  if (isCottageOrRawProduce) {
    findings.push({
      ruleId: 'FSSAI_LIC',
      ruleName: 'FSSAI License / Registration Number',
      reference: 'Food Safety and Standards Act, 2006 (Licensing & Registration of Food Businesses)',
      status: COMPLIANCE_STATUS.NOT_APPLICABLE,
      category: 'Licensing & Statutory Declarations',
      evidence: null,
      explanation: 'Category exemption: Direct primary agricultural produce / exempt cottage category does not require a pre-printed 14-digit FSSAI license.',
    });
  } else if (parsedData.fssai?.isValidFormat) {
    findings.push({
      ruleId: 'FSSAI_LIC',
      ruleName: 'FSSAI License / Registration Number',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(7)',
      status: COMPLIANCE_STATUS.COMPLIANT,
      category: 'Licensing & Statutory Declarations',
      evidence: `License No: ${parsedData.fssai.licenseNumber} (14 digits valid)${parsedData.fssai.hasLogo ? ' + FSSAI Logo' : ''}`,
      explanation: 'Valid 14-digit FSSAI license number identified on packaging.',
    });
  } else if (!hasBackView) {
    findings.push({
      ruleId: 'FSSAI_LIC',
      ruleName: 'FSSAI License / Registration Number',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(7)',
      status: COMPLIANCE_STATUS.NOT_PROVIDED,
      category: 'Licensing & Statutory Declarations',
      evidence: null,
      explanation: 'Unable to verify FSSAI license because back/regulatory packaging view was not provided.',
    });
  } else {
    findings.push({
      ruleId: 'FSSAI_LIC',
      ruleName: 'FSSAI License / Registration Number',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(7)',
      status: COMPLIANCE_STATUS.REQUIRES_REVIEW,
      category: 'Licensing & Statutory Declarations',
      evidence: parsedData.fssai?.licenseNumber ? `Extracted candidate: ${parsedData.fssai.licenseNumber}` : 'No 14-digit sequence detected',
      explanation: 'Could not confidently verify a 14-digit FSSAI license format. Requires manual packaging verification or category exemption check.',
    });
  }

  // Rule 3: Veg / Non-Veg Logo Declaration
  if (parsedData.vegNonVegStatus === 'VEGETARIAN' || parsedData.vegNonVegStatus === 'NON_VEGETARIAN') {
    findings.push({
      ruleId: 'FSSAI_VEG_LOGO',
      ruleName: 'Veg / Non-Veg Symbol',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(4)',
      status: COMPLIANCE_STATUS.COMPLIANT,
      category: 'Statutory Declarations',
      evidence: parsedData.vegNonVegStatus === 'VEGETARIAN' ? 'Green dot symbol / 100% Vegetarian declaration' : 'Brown dot symbol / Non-Veg declaration',
      explanation: 'Mandatory symbol for vegetarian or non-vegetarian food declared properly.',
    });
  } else if (!uploadedViews.includes('front')) {
    findings.push({
      ruleId: 'FSSAI_VEG_LOGO',
      ruleName: 'Veg / Non-Veg Symbol',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(4)',
      status: COMPLIANCE_STATUS.NOT_PROVIDED,
      category: 'Statutory Declarations',
      evidence: null,
      explanation: 'Principal display (front) panel was not provided to verify the Veg/Non-Veg logo.',
    });
  } else {
    findings.push({
      ruleId: 'FSSAI_VEG_LOGO',
      ruleName: 'Veg / Non-Veg Symbol',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(4)',
      status: COMPLIANCE_STATUS.REQUIRES_REVIEW,
      category: 'Statutory Declarations',
      evidence: 'Symbol color/shape unconfirmed in scanned text',
      explanation: 'Veg/Non-Veg symbol could not be determined automatically from provided images.',
    });
  }

  // Rule 4: Net Quantity Declaration
  if (parsedData.netQuantity?.value) {
    findings.push({
      ruleId: 'LM_NET_QTY',
      ruleName: 'Net Quantity Declaration',
      reference: 'Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6(1)(c)',
      status: COMPLIANCE_STATUS.COMPLIANT,
      category: 'Legal Metrology',
      evidence: `Net Quantity: ${parsedData.netQuantity.value}`,
      explanation: 'Net weight/volume declared in standard metric units.',
    });
  } else if (!uploadedViews.includes('front') && !hasBackView) {
    findings.push({
      ruleId: 'LM_NET_QTY',
      ruleName: 'Net Quantity Declaration',
      reference: 'Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6(1)(c)',
      status: COMPLIANCE_STATUS.NOT_PROVIDED,
      category: 'Legal Metrology',
      evidence: null,
      explanation: 'Packaging panels containing net quantity declaration were not provided.',
    });
  } else {
    findings.push({
      ruleId: 'LM_NET_QTY',
      ruleName: 'Net Quantity Declaration',
      reference: 'Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6(1)(c)',
      status: COMPLIANCE_STATUS.REQUIRES_REVIEW,
      category: 'Legal Metrology',
      evidence: 'Metric quantity format unconfirmed',
      explanation: 'Verify that the net content is printed in standard metric units on the principal display area.',
    });
  }

  // Rule 5: Ingredients List
  if (parsedData.ingredientsRaw && parsedData.ingredientsRaw.length > 15) {
    findings.push({
      ruleId: 'FSSAI_INGRED',
      ruleName: 'List of Ingredients',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(2)',
      status: COMPLIANCE_STATUS.COMPLIANT,
      category: 'Ingredients & Composition',
      evidence: `Ingredients: ${parsedData.ingredientsRaw.slice(0, 80)}...`,
      explanation: 'Complete ingredient list identified in descending order of weight.',
    });
  } else if (!hasBackView) {
    findings.push({
      ruleId: 'FSSAI_INGRED',
      ruleName: 'List of Ingredients',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(2)',
      status: COMPLIANCE_STATUS.NOT_PROVIDED,
      category: 'Ingredients & Composition',
      evidence: null,
      explanation: 'Ingredients panel image was not provided in scan upload.',
    });
  } else {
    findings.push({
      ruleId: 'FSSAI_INGRED',
      ruleName: 'List of Ingredients',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(2)',
      status: COMPLIANCE_STATUS.UNREADABLE,
      category: 'Ingredients & Composition',
      evidence: 'Ingredients text blurry or partial',
      explanation: 'Ingredients list was too blurry or incomplete to read reliably.',
    });
  }

  // Rule 6: Mandatory Nutritional Information Panel
  if (parsedData.nutritionalData?.hasNutritionPanel) {
    const hasCore = parsedData.nutritionalData.energyKcal !== null && parsedData.nutritionalData.totalSugarG !== null;
    findings.push({
      ruleId: 'FSSAI_NUTRITION',
      ruleName: 'Nutritional Information Panel',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(3)',
      status: hasCore ? COMPLIANCE_STATUS.COMPLIANT : COMPLIANCE_STATUS.REQUIRES_REVIEW,
      category: 'Nutritional Declarations',
      evidence: `Energy: ${parsedData.nutritionalData.energyKcal ?? 'N/A'} kcal, Sugars: ${parsedData.nutritionalData.totalSugarG ?? 'N/A'} g, Protein: ${parsedData.nutritionalData.proteinG ?? 'N/A'} g`,
      explanation: hasCore
        ? 'Nutritional values per 100g / per serve detected across required macronutrients.'
        : 'Nutritional panel detected, but some specific fields (e.g. added sugar/trans fat) require manual check.',
    });
  } else if (!hasBackView) {
    findings.push({
      ruleId: 'FSSAI_NUTRITION',
      ruleName: 'Nutritional Information Panel',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(3)',
      status: COMPLIANCE_STATUS.NOT_PROVIDED,
      category: 'Nutritional Declarations',
      evidence: null,
      explanation: 'Nutritional panel view was not provided.',
    });
  } else {
    findings.push({
      ruleId: 'FSSAI_NUTRITION',
      ruleName: 'Nutritional Information Panel',
      reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(3)',
      status: COMPLIANCE_STATUS.REQUIRES_REVIEW,
      category: 'Nutritional Declarations',
      evidence: 'Nutritional grid unparsed',
      explanation: 'Nutritional table could not be parsed from back packaging. Verify if package qualifies for small-surface (<30cm²) exemption.',
    });
  }

  // Rule 7: Consumer Care & Manufacturer Address
  if (parsedData.customerCareInfo || parsedData.manufacturerInfo) {
    findings.push({
      ruleId: 'LM_CUSTOMER_CARE',
      ruleName: 'Manufacturer & Consumer Care Details',
      reference: 'Legal Metrology Rules 2011, Rule 6(1)(a) & 6(1)(h)',
      status: COMPLIANCE_STATUS.COMPLIANT,
      category: 'Consumer Protection',
      evidence: `${parsedData.manufacturerInfo || 'Manufacturer listed'} | ${parsedData.customerCareInfo || 'Contact helpline listed'}`,
      explanation: 'Name, address, and consumer grievance contact details declared.',
    });
  } else if (!hasBackView && !uploadedViews.includes('left') && !uploadedViews.includes('right')) {
    findings.push({
      ruleId: 'LM_CUSTOMER_CARE',
      ruleName: 'Manufacturer & Consumer Care Details',
      reference: 'Legal Metrology Rules 2011, Rule 6(1)(a) & 6(1)(h)',
      status: COMPLIANCE_STATUS.NOT_PROVIDED,
      category: 'Consumer Protection',
      evidence: null,
      explanation: 'Side/back panels containing consumer grievance contacts were not provided.',
    });
  } else {
    findings.push({
      ruleId: 'LM_CUSTOMER_CARE',
      ruleName: 'Manufacturer & Consumer Care Details',
      reference: 'Legal Metrology Rules 2011, Rule 6(1)(a) & 6(1)(h)',
      status: COMPLIANCE_STATUS.REQUIRES_REVIEW,
      category: 'Consumer Protection',
      evidence: 'Contact info unparsed',
      explanation: 'Check for helpline phone number, email address, and physical manufacturer address.',
    });
  }

  // Calculate Overall Compliance Status
  const nonCompliantCount = findings.filter(f => f.status === COMPLIANCE_STATUS.NON_COMPLIANT || f.status === COMPLIANCE_STATUS.CONFIRMED_MISSING).length;
  const reviewCount = findings.filter(f => f.status === COMPLIANCE_STATUS.REQUIRES_REVIEW || f.status === COMPLIANCE_STATUS.UNREADABLE || f.status === COMPLIANCE_STATUS.NOT_PROVIDED).length;

  let overallStatus = COMPLIANCE_STATUS.COMPLIANT;
  if (nonCompliantCount > 0) {
    overallStatus = COMPLIANCE_STATUS.NON_COMPLIANT;
  } else if (reviewCount > 0) {
    overallStatus = COMPLIANCE_STATUS.REQUIRES_REVIEW;
  }

  return {
    overallStatus,
    regulatoryFramework: REGULATORY_FRAMEWORK,
    productCategory,
    totalRulesEvaluated: findings.length,
    compliantCount: findings.filter(f => f.status === COMPLIANCE_STATUS.COMPLIANT).length,
    nonCompliantCount,
    reviewCount,
    notApplicableCount: findings.filter(f => f.status === COMPLIANCE_STATUS.NOT_APPLICABLE).length,
    findings,
  };
}
