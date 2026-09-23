/**
 * Mock Data Service & Initial Database Seed
 * Contains realistic food product scans spanning the dynamic 12-month window.
 * Strictly scoped by user ID and structured ready for FastAPI SQLite schemas.
 */

// Helper to generate dynamic dates within the last 12 months relative to current date
function getDatePast(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function getTimePast(daysAgo = 0, hours = 14, mins = 30) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, mins, 0, 0);
  return date.toTimeString().split(' ')[0].substring(0, 5);
}

export const INITIAL_USERS = [
  {
    id: 'usr_demo_01',
    fullName: 'Rudransh Sharma',
    email: 'rudransh@labelsure.io',
    password: 'Password123!',
    role: 'Quality & Compliance Officer',
    organization: 'LabelSure Demo Labs',
    createdAt: getDatePast(300),
  },
  {
    id: 'usr_demo_02',
    fullName: 'Ananya Verma',
    email: 'ananya@agrifoods.in',
    password: 'Password123!',
    role: 'Product Formulation Lead',
    organization: 'Verma Organics Ltd',
    createdAt: getDatePast(180),
  }
];

export const INITIAL_SCANS = [
  {
    scan_id: 'SCN-2026-8801',
    user_id: 'usr_demo_01',
    product_name: 'Organic Roasted Almonds (Unsalted)',
    brand: 'Nuts & Harvest',
    product_category: 'Dry Fruits & Nuts',
    food_classification: 'FOOD PRODUCT DETECTED',
    classification_confidence: 0.98,
    scan_date: getDatePast(2),
    scan_time: getTimePast(2, 11, 15),
    uploaded_images: [
      { view: 'front', label: 'Front Panel', url: 'https://images.unsplash.com/photo-1508851478382-38600103080e?auto=format&fit=crop&w=400&q=80' },
      { view: 'back', label: 'Back Panel', url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80' },
      { view: 'mrp_close', label: 'MRP Close-up', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80' },
      { view: 'date_close', label: 'Date Stamp', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80' }
    ],
    ocr_text: 'NUTS & HARVEST ORGANIC ROASTED ALMONDS Net Wt: 250g MRP: Rs. 380.00 (Incl. of all taxes) MFD: 12/08/2026 Best Before: 9 months from manufacture FSSAI Lic No: 10020011000452 100% Vegetarian Ingredients: Whole California Almonds Energy: 579 kcal Protein: 21.1g Saturated Fat: 3.8g Total Sugar: 4.3g Added Sugar: 0g Sodium: 12mg Dietary Fibre: 12.5g Manufactured by: Harvest Farms Pvt Ltd, Nashik, MH Consumer Care: care@harvestfarms.in',
    extracted_fields: {
      mrp: { value: 380.0, formatted: '₹ 380.00', inclusiveOfTaxes: true, detectedVia: 'Packaging OCR', sourceView: 'MRP Close-up' },
      manufacturingDate: { raw: '12/08/2026', detectedVia: 'Packaging OCR', sourceView: 'Back Panel' },
      expiryDate: { raw: '9 months from manufacture', detectedVia: 'Packaging OCR', sourceView: 'Back Panel' },
      netQuantity: { value: '250g', detectedVia: 'Packaging OCR', sourceView: 'Front Panel' },
      batchNumber: { value: 'NH-ALM-2026-08', detectedVia: 'Packaging OCR', sourceView: 'Back Panel' },
      fssai: { licenseNumber: '10020011000452', isValidFormat: true, hasLogo: true, detectedVia: 'Packaging OCR' },
      vegNonVegStatus: 'VEGETARIAN',
      manufacturerInfo: 'Harvest Farms Pvt Ltd, Nashik, MH',
      customerCareInfo: 'care@harvestfarms.in'
    },
    compliance_status: 'COMPLIANT',
    compliance_summary: {
      total: 9,
      compliant: 9,
      nonCompliant: 0,
      requiresReview: 0,
      unreadable: 0,
      notProvided: 0,
      notApplicable: 0,
    },
    health_rating: 'A+',
    health_score: 95,
    health_rating_available: true,
    health_summary: 'Exceptional nutritional profile rich in protein and fibre with zero added sugars.',
    report_id: 'REP-2026-8801',
    thumbnail: 'https://images.unsplash.com/photo-1508851478382-38600103080e?auto=format&fit=crop&w=150&q=80',
  },
  {
    scan_id: 'SCN-2026-7420',
    user_id: 'usr_demo_01',
    product_name: 'Crunchy Chocolate Hazelnut Spread',
    brand: 'ChocoDelight',
    product_category: 'Confectionery & Spreads',
    food_classification: 'FOOD PRODUCT DETECTED',
    classification_confidence: 0.99,
    scan_date: getDatePast(14),
    scan_time: getTimePast(14, 16, 45),
    uploaded_images: [
      { view: 'front', label: 'Front Panel', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80' },
      { view: 'back', label: 'Back Panel', url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80' }
    ],
    ocr_text: 'CHOCODELIGHT HAZELNUT SPREAD Net Wt: 350g MRP: Rs. 299.00 (Incl. of all taxes) MFD: 01/06/2026 Best Before: 12 months from PKD FSSAI Lic No: 11519022000891 100% Vegetarian Ingredients: Sugar, Palm Oil, Hazelnuts (13%), Skimmed Milk Powder, Cocoa Powder, Emulsifier (Lecithin), Artificial Flavours Energy: 539 kcal Protein: 6.3g Total Fat: 30.9g Saturated Fat: 10.6g Total Sugar: 56.3g Added Sugar: 52.0g Sodium: 42mg Dietary Fibre: 3.0g Marketed by: Delight Foods India',
    extracted_fields: {
      mrp: { value: 299.0, formatted: '₹ 299.00', inclusiveOfTaxes: true, detectedVia: 'Packaging OCR' },
      manufacturingDate: { raw: '01/06/2026', detectedVia: 'Packaging OCR' },
      expiryDate: { raw: '12 months from PKD', detectedVia: 'Packaging OCR' },
      netQuantity: { value: '350g', detectedVia: 'Packaging OCR' },
      fssai: { licenseNumber: '11519022000891', isValidFormat: true, hasLogo: true, detectedVia: 'Packaging OCR' },
      vegNonVegStatus: 'VEGETARIAN',
      manufacturerInfo: 'Delight Foods India'
    },
    compliance_status: 'COMPLIANT',
    compliance_summary: {
      total: 9,
      compliant: 8,
      nonCompliant: 0,
      requiresReview: 1,
      unreadable: 0,
      notProvided: 0,
      notApplicable: 0,
    },
    health_rating: 'E',
    health_score: 30,
    health_rating_available: true,
    health_summary: 'High sugar (>50g added sugar) and elevated saturated fats from palm oil.',
    report_id: 'REP-2026-7420',
    thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=150&q=80',
  },
  {
    scan_id: 'SCN-2026-6115',
    user_id: 'usr_demo_01',
    product_name: 'Artisanal Himalayan Multi-Flora Honey',
    brand: 'Pristine Peaks',
    product_category: 'Honey & Natural Sweeteners',
    food_classification: 'FOOD PRODUCT DETECTED',
    classification_confidence: 0.94,
    scan_date: getDatePast(45),
    scan_time: getTimePast(45, 9, 20),
    uploaded_images: [
      { view: 'front', label: 'Front Panel', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80' }
    ],
    ocr_text: 'PRISTINE PEAKS 100% PURE HIMALAYAN HONEY Net Weight: 500g 100% Vegetarian Raw Unfiltered Honey Packed On: 15/04/2026 Best Before: 18 months from packing MRP: Rs. 450.00 Single Ingredient: 100% Pure Raw Honey Energy: 320 kcal Sugars: 80g (Natural fructose/glucose) Protein: 0.3g Saturated Fat: 0g Sodium: 4mg',
    extracted_fields: {
      mrp: { value: 450.0, formatted: '₹ 450.00', inclusiveOfTaxes: false, detectedVia: 'Packaging OCR' },
      manufacturingDate: { raw: '15/04/2026', detectedVia: 'Packaging OCR' },
      expiryDate: { raw: '18 months from packing', detectedVia: 'Packaging OCR' },
      netQuantity: { value: '500g', detectedVia: 'Packaging OCR' },
      fssai: { licenseNumber: null, isValidFormat: false, hasLogo: false },
      vegNonVegStatus: 'VEGETARIAN',
    },
    compliance_status: 'REQUIRES REVIEW',
    compliance_summary: {
      total: 9,
      compliant: 5,
      nonCompliant: 0,
      requiresReview: 2,
      unreadable: 0,
      notProvided: 2,
      notApplicable: 0,
    },
    health_rating: 'C',
    health_score: 58,
    health_rating_available: true,
    health_summary: 'Natural mono/disaccharides with zero saturated fats and low sodium.',
    report_id: 'REP-2026-6115',
    thumbnail: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=150&q=80',
  },
  {
    scan_id: 'SCN-2026-5020',
    user_id: 'usr_demo_01',
    product_name: 'Herbal Anti-Dandruff Shampoo',
    brand: 'Botanica Care',
    product_category: 'Personal Care & Cosmetics',
    food_classification: 'NON-FOOD PRODUCT',
    classification_confidence: 0.96,
    scan_date: getDatePast(90),
    scan_time: getTimePast(90, 15, 10),
    uploaded_images: [
      { view: 'front', label: 'Front Bottle', url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80' }
    ],
    ocr_text: 'BOTANICA CARE HERBAL ANTI-DANDRUFF SHAMPOO Net Vol: 200ml For External Use Only Ingredients: Sodium Laureth Sulfate, Aqua, Tea Tree Oil, Zinc Pyrithione, Fragrance, Methylparaben MRP: Rs. 210.00 Mfd By: Botanica Labs, Haridwar',
    extracted_fields: {
      mrp: { value: 210.0, formatted: '₹ 210.00' },
      netQuantity: { value: '200ml' },
      manufacturerInfo: 'Botanica Labs, Haridwar',
      customerCareInfo: 'care@botanicalabs.com'
    },
    compliance_status: 'COMPLIANT',
    compliance_summary: {
      total: 7,
      compliant: 4,
      nonCompliant: 0,
      requiresReview: 0,
      unreadable: 0,
      notProvided: 0,
      notApplicable: 3,
    },
    compliance_findings: [
      {
        ruleId: 'FSSAI_NAME',
        ruleName: 'Product Name / Generic Identity',
        reference: 'Legal Metrology (Packaged Commodities) Rules 2011, Rule 6(1)(a)',
        status: 'COMPLIANT',
        category: 'Product Identification',
        evidence: 'BOTANICA CARE HERBAL ANTI-DANDRUFF SHAMPOO',
        explanation: 'Clear declaration of product generic name is required under Legal Metrology Rules.'
      },
      {
        ruleId: 'FSSAI_LIC',
        ruleName: 'FSSAI License / Registration Number',
        reference: 'Food Safety and Standards Act, 2006',
        status: 'NOT APPLICABLE',
        category: 'Licensing & Statutory Declarations',
        evidence: null,
        explanation: 'Not applicable for non-food commodities under the Food Safety and Standards Act, 2006.'
      },
      {
        ruleId: 'FSSAI_VEG_LOGO',
        ruleName: 'Veg / Non-Veg Symbol',
        reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(4)',
        status: 'NOT APPLICABLE',
        category: 'Statutory Declarations',
        evidence: null,
        explanation: 'Veg / Non-Veg declaration is not applicable to non-food commodities.'
      },
      {
        ruleId: 'LM_NET_QTY',
        ruleName: 'Net Quantity Declaration',
        reference: 'Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6(1)(c)',
        status: 'COMPLIANT',
        category: 'Legal Metrology',
        evidence: 'Net Vol: 200ml',
        explanation: 'Net weight/volume declared in standard metric units.'
      },
      {
        ruleId: 'FSSAI_INGRED',
        ruleName: 'Ingredients / Composition Declaration',
        reference: 'Legal Metrology Rules 2011',
        status: 'COMPLIANT',
        category: 'Ingredients & Composition',
        evidence: 'Sodium Laureth Sulfate, Aqua, Tea Tree Oil, Zinc Pyrithione...',
        explanation: 'Composition / ingredients declaration identified on packaging.'
      },
      {
        ruleId: 'FSSAI_NUTRITION',
        ruleName: 'Nutritional Information Panel',
        reference: 'FSS (Labelling and Display) Regs 2020, Reg 5(3)',
        status: 'NOT APPLICABLE',
        category: 'Nutritional Declarations',
        evidence: null,
        explanation: 'Nutritional facts table is not applicable to non-food commodities.'
      },
      {
        ruleId: 'LM_CUSTOMER_CARE',
        ruleName: 'Manufacturer & Consumer Care Details',
        reference: 'Legal Metrology Rules 2011, Rule 6(1)(a) & 6(1)(h)',
        status: 'COMPLIANT',
        category: 'Consumer Protection',
        evidence: 'Botanica Labs, Haridwar',
        explanation: 'Name, address, and consumer grievance contact details declared.'
      }
    ],
    health_rating: null,
    health_score: null,
    health_rating_available: false,
    health_summary: 'Health grading is not applicable to this product.',
    report_id: 'REP-2026-5020',
    thumbnail: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=150&q=80',
  },
  {
    scan_id: 'SCN-2025-9241',
    user_id: 'usr_demo_01',
    product_name: 'Whole Grain Rolled Oats (Gluten Free)',
    brand: 'Earth Harvest',
    product_category: 'Breakfast Cereals & Grains',
    food_classification: 'FOOD PRODUCT DETECTED',
    classification_confidence: 0.99,
    scan_date: getDatePast(210),
    scan_time: getTimePast(210, 8, 40),
    uploaded_images: [
      { view: 'front', label: 'Front Pouch', url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=400&q=80' },
      { view: 'back', label: 'Back Panel', url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80' }
    ],
    ocr_text: 'EARTH HARVEST 100% WHOLE GRAIN ROLLED OATS Net Wt: 1kg MRP: Rs. 240.00 (Incl. of all taxes) MFD: 10/02/2026 Best Before: 12 months from PKD FSSAI Lic No: 10018022007812 100% Vegetarian Ingredients: 100% Whole Grain Rolled Oats Energy: 389 kcal Protein: 13.5g Total Fat: 6.9g Saturated Fat: 1.2g Carbohydrates: 66.3g Total Sugar: 0.9g Added Sugar: 0g Dietary Fibre: 10.6g Sodium: 3mg',
    extracted_fields: {
      mrp: { value: 240.0, formatted: '₹ 240.00', inclusiveOfTaxes: true, detectedVia: 'Packaging OCR' },
      manufacturingDate: { raw: '10/02/2026', detectedVia: 'Packaging OCR' },
      expiryDate: { raw: '12 months from PKD', detectedVia: 'Packaging OCR' },
      netQuantity: { value: '1kg', detectedVia: 'Packaging OCR' },
      fssai: { licenseNumber: '10018022007812', isValidFormat: true, hasLogo: true, detectedVia: 'Packaging OCR' },
      vegNonVegStatus: 'VEGETARIAN',
    },
    compliance_status: 'COMPLIANT',
    compliance_summary: {
      total: 9,
      compliant: 9,
      nonCompliant: 0,
      requiresReview: 0,
      unreadable: 0,
      notProvided: 0,
      notApplicable: 0,
    },
    health_rating: 'A+',
    health_score: 98,
    health_rating_available: true,
    health_summary: 'Exceptional complex carbohydrates, zero added sugars, rich in beta-glucan soluble fibre.',
    report_id: 'REP-2025-9241',
    thumbnail: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=150&q=80',
  },
  {
    scan_id: 'SCN-2025-8310',
    user_id: 'usr_demo_01',
    product_name: 'Spicy Masala Potato Crisps',
    brand: 'SnackWave',
    product_category: 'Snacks & Savouries',
    food_classification: 'FOOD PRODUCT DETECTED',
    classification_confidence: 0.97,
    scan_date: getDatePast(320),
    scan_time: getTimePast(320, 19, 15),
    uploaded_images: [
      { view: 'front', label: 'Front Bag', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80' }
    ],
    ocr_text: 'SNACKWAVE SPICY MASALA POTATO CRISPS Net Wt: 50g MRP: Rs. 20.00 MFD: 15/11/2025 Best Before: 4 months from packaging FSSAI Lic No: 12117001000332 100% Vegetarian Ingredients: Potatoes, Edible Vegetable Oil (Palmolein), Spices & Condiments (Chilli, Onion Powder, Garlic Powder, Salt, Mango Powder), Acidity Regulator (330) Energy: 544 kcal Protein: 6.8g Saturated Fat: 14.5g Added Sugar: 2.1g Sodium: 890mg',
    extracted_fields: {
      mrp: { value: 20.0, formatted: '₹ 20.00', inclusiveOfTaxes: true, detectedVia: 'Packaging OCR' },
      manufacturingDate: { raw: '15/11/2025', detectedVia: 'Packaging OCR' },
      expiryDate: { raw: '4 months from packaging', detectedVia: 'Packaging OCR' },
      netQuantity: { value: '50g', detectedVia: 'Packaging OCR' },
      fssai: { licenseNumber: '12117001000332', isValidFormat: true, hasLogo: true, detectedVia: 'Packaging OCR' },
      vegNonVegStatus: 'VEGETARIAN',
    },
    compliance_status: 'COMPLIANT',
    compliance_summary: {
      total: 9,
      compliant: 9,
      nonCompliant: 0,
      requiresReview: 0,
      unreadable: 0,
      notProvided: 0,
      notApplicable: 0,
    },
    health_rating: 'E',
    health_score: 32,
    health_rating_available: true,
    health_summary: 'High saturated fat content (14.5g) and elevated sodium level (890mg per 100g).',
    report_id: 'REP-2025-8310',
    thumbnail: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=150&q=80',
  }
];
