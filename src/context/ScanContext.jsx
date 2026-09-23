import React, { createContext, useContext, useState } from 'react';
import { api, getAnonymousSessionId } from '../services/api';
import { PACKAGING_VIEWS } from '../services/ocrService';
import { extractTextFromImage } from '../services/imageOcr';

const ScanContext = createContext(null);

export const SCAN_STEPS = [
  'Validating uploaded packaging images...',
  'Reading text from Front package photo...',
  'Reading text from Back package photo (Ingredients & Nutrition)...',
  'Extracting statutory declarations (FSSAI, Net Qty, Ingredients)...',
  'Running food vs non-food classifier...',
  'Evaluating FSS Act 2006 & statutory rules...',
  'Analyzing nutritional health profile & dietary quality...',
  'Compiling inspection report...'
];

export function ScanProvider({ children }) {
  // Map of viewId -> { file, previewUrl, rawText, label, uploadedAt }
  const [uploadedImages, setUploadedImages] = useState({});
  const [productCategory, setProductCategory] = useState('Standard Pre-Packaged Food');
  const [productNameInput, setProductNameInput] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  
  // Scanning progress state
  const [isScanning, setIsScanning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  
  // Results
  const [activeResult, setActiveResult] = useState(null);
  const [error, setError] = useState(null);

  const addImage = (viewId, file, customPreviewUrl = null, sampleText = null) => {
    const previewUrl = customPreviewUrl || (file ? URL.createObjectURL(file) : null);
    setUploadedImages(prev => ({
      ...prev,
      [viewId]: {
        file,
        previewUrl,
        rawText: sampleText || '',
        viewId,
        label: PACKAGING_VIEWS.find(v => v.id === viewId)?.label || (viewId === 'front' ? 'Front Package Photo' : 'Back Package Photo'),
        uploadedAt: new Date().toISOString(),
      }
    }));
  };

  const removeImage = (viewId) => {
    setUploadedImages(prev => {
      const copy = { ...prev };
      delete copy[viewId];
      return copy;
    });
  };

  const clearAllImages = () => {
    setUploadedImages({});
    setQrCodeData(null);
    setActiveResult(null);
    setError(null);
    setProductNameInput('');
  };

  // Instant demo samples
  const loadSampleProduct = (sampleType = 'almonds') => {
    clearAllImages();
    if (sampleType === 'almonds') {
      setProductNameInput('Organic Roasted California Almonds');
      setProductCategory('Dry Fruits & Nuts');
      addImage(
        'front',
        null,
        'https://images.unsplash.com/photo-1508851478382-38600103080e?auto=format&fit=crop&w=400&q=80',
        'NUTS & HARVEST ORGANIC ROASTED ALMONDS Net Wt: 250g 100% Vegetarian Green Dot'
      );
      addImage(
        'back',
        null,
        'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80',
        'Ingredients: Whole Roasted Almonds FSSAI Lic No: 10020011000452 Nutritional Info per 100g: Energy: 579 kcal, Protein: 21.1g, Saturated Fat: 3.8g, Total Sugar: 4.3g, Added Sugar: 0g, Sodium: 12mg, Dietary Fibre: 12.5g B.No: NH-ALM-2026 Manufactured by: Harvest Farms Pvt Ltd, Nashik, MH Consumer Care: care@harvestfarms.in'
      );
    } else if (sampleType === 'shampoo_nonfood') {
      setProductNameInput('Herbal Anti-Dandruff Shampoo');
      setProductCategory('Cosmetics & Personal Care (Non-Food)');
      addImage(
        'front',
        null,
        'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
        'BOTANICA CARE HERBAL ANTI-DANDRUFF SHAMPOO Net Vol: 200ml For External Use Only Ingredients: Sodium Laureth Sulfate, Aqua, Tea Tree Oil, Zinc Pyrithione Mfd By: Botanica Labs'
      );
      addImage(
        'back',
        null,
        'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
        'Directions: Apply to wet hair. Rinse thoroughly. Keep out of reach of children. Not for human consumption. Batch: B9812'
      );
    }
  };

  /**
   * Executes the full scanning and OCR extraction workflow.
   */
  const executeScan = async (userId) => {
    const effectiveUserId = userId || getAnonymousSessionId();
    const frontImg = uploadedImages['front'];
    const backImg = uploadedImages['back'];

    if (!frontImg && !backImg) {
      throw new Error('Please upload at least one packaging photo (Front or Back) or scan a barcode.');
    }

    setIsScanning(true);
    setError(null);
    setCurrentStepIndex(0);

    try {
      // Step 0: Validation
      setCurrentStepIndex(0);
      setCurrentStepText(SCAN_STEPS[0]);
      await new Promise(r => setTimeout(r, 180));

      // Step 1: OCR Front Image (if provided)
      setCurrentStepIndex(1);
      setCurrentStepText(SCAN_STEPS[1]);
      let frontText = frontImg?.rawText || '';
      if (frontImg && !frontText && (frontImg.file || frontImg.previewUrl)) {
        const ocrFront = await extractTextFromImage(frontImg.file || frontImg.previewUrl);
        frontText = ocrFront.text;
      }

      // Step 2: OCR Back Image (if provided)
      setCurrentStepIndex(2);
      setCurrentStepText(SCAN_STEPS[2]);
      let backText = backImg?.rawText || '';
      if (backImg && !backText && (backImg.file || backImg.previewUrl)) {
        const ocrBack = await extractTextFromImage(backImg.file || backImg.previewUrl);
        backText = ocrBack.text;
      }

      // Prepare Image Results
      const imageResults = [];
      const uploadedViewKeys = [];

      if (frontImg) {
        uploadedViewKeys.push('front');
        imageResults.push({
          view: 'front',
          label: 'Front Package Photo',
          text: frontText || `${productNameInput} Front Package Display`,
          imageUrl: frontImg.previewUrl,
        });
      }

      if (backImg) {
        uploadedViewKeys.push('back');
        imageResults.push({
          view: 'back',
          label: 'Back Package Photo',
          text: backText || `${productNameInput} Back Regulatory & Nutrition Panel`,
          imageUrl: backImg.previewUrl,
        });
      }

      // Step 3: Parse Declarations
      setCurrentStepIndex(3);
      setCurrentStepText(SCAN_STEPS[3]);
      const parsedFields = api.ocr.extract(imageResults, qrCodeData);
      if (productNameInput && !parsedFields.productName) {
        parsedFields.productName = productNameInput;
      }
      await new Promise(r => setTimeout(r, 180));

      // Step 4: Classify Product (Food vs Non-Food vs Uncertain)
      setCurrentStepIndex(4);
      setCurrentStepText(SCAN_STEPS[4]);
      const combinedRaw = [frontText, backText, productNameInput, productCategory].filter(Boolean).join(' ');
      const classification = api.classifier.classify({
        rawText: combinedRaw,
        productName: productNameInput,
      });
      await new Promise(r => setTimeout(r, 180));

      // Step 5: Evaluate Statutory Compliance (Category & Classification Aware)
      setCurrentStepIndex(5);
      setCurrentStepText(SCAN_STEPS[5]);
      const effectiveCategory = classification.category || productCategory;
      const complianceResult = api.compliance.evaluate(
        parsedFields, 
        uploadedViewKeys, 
        effectiveCategory,
        classification.status
      );
      await new Promise(r => setTimeout(r, 180));

      // Step 6: Grade Nutritional Health (Strictly Decoupled & Food-Gated)
      setCurrentStepIndex(6);
      setCurrentStepText(SCAN_STEPS[6]);
      const healthResult = api.health.grade(
        parsedFields.nutritionalData, 
        parsedFields.ingredientsRaw,
        classification.status
      );
      await new Promise(r => setTimeout(r, 180));

      // Step 7: Compile Complete Audit Record
      setCurrentStepIndex(7);
      setCurrentStepText(SCAN_STEPS[7]);
      const fullScanRecord = {
        scan_id: `SCN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        product_name: productNameInput || (parsedFields.productName || (classification.isFood ? 'Packaged Food Product' : 'Packaged Commodity Product')),
        brand: parsedFields.brand || (parsedFields.manufacturerInfo ? parsedFields.manufacturerInfo.split(',')[0] : (classification.isFood ? 'Brand Label' : 'Commodity Brand')),
        product_category: effectiveCategory,
        food_classification: classification.status,
        classification_confidence: classification.confidence,
        classification_details: classification,
        uploaded_images: imageResults,
        ocr_text: parsedFields.rawCombinedText,
        extracted_fields: parsedFields,
        compliance_status: complianceResult.overallStatus,
        compliance_summary: {
          total: complianceResult.totalRulesEvaluated,
          compliant: complianceResult.compliantCount,
          nonCompliant: complianceResult.nonCompliantCount,
          requiresReview: complianceResult.reviewCount,
          notApplicable: complianceResult.notApplicableCount,
        },
        compliance_findings: complianceResult.findings,
        regulatory_framework: complianceResult.regulatoryFramework,
        health_rating: healthResult.grade,
        health_score: healthResult.score,
        health_rating_available: healthResult.available,
        health_summary: healthResult.whyThisGrade || healthResult.gradeSummary || healthResult.reason,
        health_details: healthResult,
        report_id: `REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        thumbnail: imageResults[0]?.imageUrl || null,
      };

      try {
        const savedScan = await api.scans.createScan(fullScanRecord, effectiveUserId);
        setActiveResult(savedScan);
        setIsScanning(false);
        return savedScan;
      } catch (saveErr) {
        console.warn('Scan saved in-memory / local storage:', saveErr);
        setActiveResult(fullScanRecord);
        setIsScanning(false);
        return fullScanRecord;
      }
    } catch (err) {
      console.error('Scanning error:', err);
      setError(err.message || 'Scanning service is temporarily unavailable. Please try again.');
      setIsScanning(false);
      throw err;
    }
  };

  return (
    <ScanContext.Provider
      value={{
        uploadedImages,
        productCategory,
        setProductCategory,
        productNameInput,
        setProductNameInput,
        qrCodeData,
        setQrCodeData,
        addImage,
        removeImage,
        clearAllImages,
        loadSampleProduct,
        executeScan,
        isScanning,
        currentStepIndex,
        currentStepText,
        activeResult,
        setActiveResult,
        error,
        setError,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
}
