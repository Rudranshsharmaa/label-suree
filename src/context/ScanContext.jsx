import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';
import { PACKAGING_VIEWS } from '../services/ocrService';

const ScanContext = createContext(null);

export const SCAN_STEPS = [
  'Checking product type...',
  'Processing uploaded packaging views...',
  'Extracting packaging text & labels...',
  'Detecting MRP & tax declarations...',
  'Detecting manufacturing & expiry dates...',
  'Combining multi-view packaging information...',
  'Running FSS Act & Legal Metrology compliance checks...',
  'Analyzing nutritional facts & calculating health grade...',
  'Compiling preliminary compliance report...'
];

export function ScanProvider({ children }) {
  // Map of viewId -> { file, previewUrl, rawText, status }
  const [uploadedImages, setUploadedImages] = useState({});
  const [productCategory, setProductCategory] = useState('Standard Pre-Packaged Food');
  const [productNameInput, setProductNameInput] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  
  // Scanning state
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
        label: PACKAGING_VIEWS.find(v => v.id === viewId)?.label || viewId,
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

  // Load standard pre-configured sample product for instant testing
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
        'Ingredients: Whole Roasted Almonds FSSAI Lic No: 10020011000452 Nutritional Info per 100g: Energy: 579 kcal, Protein: 21.1g, Saturated Fat: 3.8g, Total Sugar: 4.3g, Added Sugar: 0g, Sodium: 12mg, Dietary Fibre: 12.5g Manufactured by: Harvest Farms Pvt Ltd, Nashik, MH Consumer Care: care@harvestfarms.in'
      );
      addImage(
        'mrp_close',
        null,
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
        'MRP: Rs. 380.00 (Incl. of all taxes) B.No: NH-ALM-2026-08'
      );
      addImage(
        'date_close',
        null,
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
        'MFD: 12/08/2026 Best Before: 9 months from manufacture'
      );
    } else if (sampleType === 'shampoo_nonfood') {
      setProductNameInput('Herbal Anti-Dandruff Shampoo');
      setProductCategory('Cosmetics & Personal Care');
      addImage(
        'front',
        null,
        'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
        'BOTANICA CARE HERBAL ANTI-DANDRUFF SHAMPOO Net Vol: 200ml For External Use Only Ingredients: Sodium Laureth Sulfate, Aqua, Tea Tree Oil, Zinc Pyrithione MRP: Rs. 210.00 Mfd By: Botanica Labs'
      );
    }
  };

  /**
   * Executes the full scanning and compliance extraction workflow.
   */
  const executeScan = async (userId) => {
    const uploadedViewKeys = Object.keys(uploadedImages);
    if (uploadedViewKeys.length === 0) {
      throw new Error('Please upload at least one packaging image before starting analysis.');
    }

    setIsScanning(true);
    setError(null);
    setCurrentStepIndex(0);

    try {
      // Step-by-step lightweight execution progression
      for (let i = 0; i < SCAN_STEPS.length; i++) {
        setCurrentStepIndex(i);
        setCurrentStepText(SCAN_STEPS[i]);
        await new Promise(r => setTimeout(r, 220)); // Smooth non-blocking step delay
      }

      // 1. Prepare image results array
      const imageResults = uploadedViewKeys.map(key => ({
        view: key,
        label: uploadedImages[key].label,
        text: uploadedImages[key].rawText || `${productNameInput} Packaging view: ${uploadedImages[key].label}`,
        imageUrl: uploadedImages[key].previewUrl,
      }));

      // Combined raw string for classification
      const combinedRaw = imageResults.map(r => r.text).join(' ') + ' ' + productNameInput;

      // 2. Food vs Non-Food Classification
      const classification = api.classifier.classify({
        rawText: combinedRaw,
        productName: productNameInput,
      });

      // 3. OCR Text Parsing
      const parsedFields = api.ocr.extract(imageResults, qrCodeData);
      if (productNameInput && !parsedFields.productName) {
        parsedFields.productName = productNameInput;
      }

      // If Non-Food, halt food-specific engines
      if (!classification.isFood) {
        const nonFoodScanRecord = {
          scan_id: `SCN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          product_name: productNameInput || 'Scanned Non-Food Item',
          brand: 'Non-Food Item',
          product_category: classification.category,
          food_classification: classification.status,
          classification_confidence: classification.confidence,
          classification_details: classification,
          uploaded_images: imageResults,
          ocr_text: parsedFields.rawCombinedText,
          extracted_fields: parsedFields,
          compliance_status: 'NOT APPLICABLE',
          compliance_findings: [],
          health_rating: null,
          health_rating_available: false,
          health_summary: classification.guidance,
          report_id: `REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        };

        const savedScan = await api.scans.createScan(nonFoodScanRecord, userId);
        setActiveResult(savedScan);
        setIsScanning(false);
        return savedScan;
      }

      // 4. Regulatory Compliance Evaluation (FSS Act 2006 & Legal Metrology)
      const complianceResult = api.compliance.evaluate(parsedFields, uploadedViewKeys, productCategory);

      // 5. Nutritional Health Rating Calculation (A+ to F)
      const healthResult = api.health.grade(parsedFields.nutritionalData);

      // 6. Compile Final Structured Scan Object
      const fullScanRecord = {
        scan_id: `SCN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        product_name: productNameInput || 'Packaged Food Product',
        brand: parsedFields.manufacturerInfo ? parsedFields.manufacturerInfo.split(',')[0] : 'Brand Label',
        product_category: productCategory,
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
        health_summary: healthResult.gradeSummary || healthResult.reason,
        health_details: healthResult,
        report_id: `REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        thumbnail: imageResults[0]?.imageUrl || null,
      };

      const savedScan = await api.scans.createScan(fullScanRecord, userId);
      setActiveResult(savedScan);
      setIsScanning(false);
      return savedScan;
    } catch (err) {
      console.error('Scanning error:', err);
      setError(err.message || 'An error occurred during package analysis.');
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
