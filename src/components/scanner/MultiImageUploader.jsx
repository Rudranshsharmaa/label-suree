import React, { useState, useRef } from 'react';
import { useScan } from '../../context/ScanContext';
import { CameraScanner } from './CameraScanner';
import { BarcodeScanner } from './BarcodeScanner';
import { Button } from '../common/Button';
import { 
  Upload, 
  Camera, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  PackageCheck,
  Barcode,
  Image as ImageIcon,
  HelpCircle,
  FileCheck2,
  X
} from 'lucide-react';

export function MultiImageUploader({ onStartScan }) {
  const {
    uploadedImages,
    addImage,
    removeImage,
    clearAllImages,
    loadSampleProduct,
    productCategory,
    setProductCategory,
    productNameInput,
    setProductNameInput,
  } = useScan();

  const [activeCameraView, setActiveCameraView] = useState(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const frontFileInputRef = useRef(null);
  const backFileInputRef = useRef(null);

  const frontImage = uploadedImages['front'];
  const backImage = uploadedImages['back'];
  const hasBothPhotos = !!(frontImage && backImage);

  const handleFileChange = (viewId, event) => {
    const file = event.target.files?.[0];
    if (file) {
      setValidationError(null);
      addImage(viewId, file);
    }
  };

  const handleCameraCapture = (imageDataUrl) => {
    if (activeCameraView) {
      setValidationError(null);
      addImage(activeCameraView, null, imageDataUrl);
      setActiveCameraView(null);
    }
  };

  const handleBarcodeProductFound = (productData) => {
    if (productData.productName) {
      setProductNameInput(productData.productName);
    }
    if (productData.category) {
      setProductCategory(productData.category);
    }
    // If front or back image URL exists, optionally attach
    if (productData.imageUrl && !frontImage) {
      addImage(
        'front',
        null,
        productData.imageUrl,
        `${productData.productName} Brand: ${productData.brand} Category: ${productData.category} Status: ${productData.vegNonVegStatus}`
      );
    }
    if (productData.ingredientsText || productData.nutritionalData) {
      const nut = productData.nutritionalData || {};
      const nutSummary = `Nutritional Info: Energy: ${nut.energyKcal || 0} kcal, Protein: ${nut.proteinG || 0}g, Total Sugar: ${nut.totalSugarG || 0}g, Sodium: ${nut.sodiumMg || 0}mg`;
      addImage(
        'back',
        null,
        productData.imageUrl || 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80',
        `Ingredients: ${productData.ingredientsText || productData.ingredients.join(', ')} ${nutSummary} FSSAI: ${productData.fssaiNumber || '10019022009876'} MRP: Rs. 150.00 MFD: 15/08/2026 Best Before: 12 months`
      );
    }
    setShowBarcodeModal(false);
  };

  const handleScanSubmit = () => {
    if (!frontImage || !backImage) {
      setValidationError('Please upload both front and back package photos for complete product analysis.');
      return;
    }
    setValidationError(null);
    onStartScan();
  };

  const categories = [
    'Standard Pre-Packaged Food',
    'Dry Fruits & Nuts',
    'Breakfast Cereals & Grains',
    'Snacks & Savouries',
    'Confectionery & Spreads',
    'Dairy & Plant-Based Milk',
    'Beverages & Juices',
    'Honey & Natural Sweeteners',
    'Primary Agricultural Produce (Exempt)',
    'Cosmetics & Personal Care (Non-Food)',
  ];

  return (
    <div className="space-y-6">
      {/* Configuration & Quick Sample Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#123C2A]/10">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#17231C] flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-[#123C2A]" />
              Product Packaging Scanner
            </h2>
            <p className="text-xs text-[#68736B] mt-0.5">
              Follow our standard 3-step inspection: upload Front and Back photos, or scan barcode to retrieve registry data.
            </p>
          </div>

          {/* Quick Instant Demo Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="text-[11px] font-semibold text-[#68736B]">Instant Demo:</span>
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                loadSampleProduct('almonds');
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#DCE8D8] text-[#123C2A] hover:bg-[#2E6847] hover:text-white transition-colors flex items-center gap-1.5"
            >
              🥗 Food (Almonds)
            </button>
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                loadSampleProduct('shampoo_nonfood');
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#E9E8DC] text-[#17231C] hover:bg-[#B94A48] hover:text-white transition-colors flex items-center gap-1.5"
            >
              🧴 Non-Food (Shampoo)
            </button>
          </div>
        </div>

        {/* Product Details Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="product-name" className="block text-xs font-bold text-[#17231C]">
              Product Name (Optional)
            </label>
            <input
              id="product-name"
              type="text"
              placeholder="e.g., Organic Roasted Almonds"
              value={productNameInput}
              onChange={(e) => setProductNameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#123C2A]/20 bg-white focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="product-category" className="block text-xs font-bold text-[#17231C]">
              Food Category (For FSS Act 2006 Rules)
            </label>
            <select
              id="product-category"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#123C2A]/20 bg-white focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-[#FBEBEB] border border-[#B94A48]/30 flex items-start gap-3 text-xs text-[#B94A48] animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Missing Required Packaging Photo</p>
            <p>{validationError}</p>
          </div>
        </div>
      )}

      {/* The 3 Core Options: Front Photo, Back Photo, Barcode Scanner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Front Package Photo */}
        <div
          className={`rounded-3xl border-2 p-5 flex flex-col justify-between transition-all ${
            frontImage
              ? 'bg-[#FAF9F5] border-[#2E6847] shadow-sm'
              : 'bg-white border-[#123C2A]/20 hover:border-[#123C2A]/50'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#2E6847] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#123C2A] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                Front Package Photo
              </span>
              {frontImage ? (
                <span className="px-2 py-0.5 rounded-full bg-[#DCE8D8] text-[#123C2A] text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#FEF6E8] text-[#C78A28] text-[10px] font-bold">
                  Required
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-[#17231C]">Front of Package</h3>
              <p className="text-xs text-[#68736B] mt-1 leading-relaxed">
                Captures Product Name, Brand, Net Quantity declaration, and Veg / Non-Veg emblem.
              </p>
            </div>

            {/* Uploaded Preview or Empty State */}
            {frontImage ? (
              <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-black/5 border border-[#123C2A]/10 group">
                <img
                  src={frontImage.previewUrl}
                  alt="Front package preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(frontImage.previewUrl)}
                    className="p-2 rounded-xl bg-white text-[#17231C] hover:bg-[#E9E8DC]"
                    title="Zoom View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage('front')}
                    className="p-2 rounded-xl bg-[#B94A48] text-white hover:bg-[#9E3E3C]"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-44 rounded-2xl border-2 border-dashed border-[#123C2A]/20 bg-[#FAF9F5] flex flex-col items-center justify-center p-4 text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-[#68736B]/60" />
                <p className="text-xs font-semibold text-[#68736B]">
                  No front photo added yet
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 mt-4 border-t border-[#123C2A]/10 flex items-center gap-2">
            <input
              ref={frontFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange('front', e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => frontFileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#123C2A] hover:bg-[#2E6847] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {frontImage ? 'Change Photo' : 'Upload Photo'}
            </button>
            <button
              type="button"
              onClick={() => setActiveCameraView('front')}
              className="p-2.5 rounded-xl bg-[#E9E8DC] hover:bg-[#DCE8D8] text-[#123C2A] transition-colors"
              title="Snap photo with camera"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Back Package Photo */}
        <div
          className={`rounded-3xl border-2 p-5 flex flex-col justify-between transition-all ${
            backImage
              ? 'bg-[#FAF9F5] border-[#2E6847] shadow-sm'
              : 'bg-white border-[#123C2A]/20 hover:border-[#123C2A]/50'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#2E6847] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#123C2A] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                Back Package Photo
              </span>
              {backImage ? (
                <span className="px-2 py-0.5 rounded-full bg-[#DCE8D8] text-[#123C2A] text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#FEF6E8] text-[#C78A28] text-[10px] font-bold">
                  Required
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-[#17231C]">Back of Package</h3>
              <p className="text-xs text-[#68736B] mt-1 leading-relaxed">
                Captures Ingredients, Nutritional Facts table, 14-digit FSSAI number, MRP, Dates & Manufacturer.
              </p>
            </div>

            {/* Uploaded Preview or Empty State */}
            {backImage ? (
              <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-black/5 border border-[#123C2A]/10 group">
                <img
                  src={backImage.previewUrl}
                  alt="Back package preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(backImage.previewUrl)}
                    className="p-2 rounded-xl bg-white text-[#17231C] hover:bg-[#E9E8DC]"
                    title="Zoom View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage('back')}
                    className="p-2 rounded-xl bg-[#B94A48] text-white hover:bg-[#9E3E3C]"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-44 rounded-2xl border-2 border-dashed border-[#123C2A]/20 bg-[#FAF9F5] flex flex-col items-center justify-center p-4 text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-[#68736B]/60" />
                <p className="text-xs font-semibold text-[#68736B]">
                  No back photo added yet
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 mt-4 border-t border-[#123C2A]/10 flex items-center gap-2">
            <input
              ref={backFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange('back', e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => backFileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#123C2A] hover:bg-[#2E6847] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {backImage ? 'Change Photo' : 'Upload Photo'}
            </button>
            <button
              type="button"
              onClick={() => setActiveCameraView('back')}
              className="p-2.5 rounded-xl bg-[#E9E8DC] hover:bg-[#DCE8D8] text-[#123C2A] transition-colors"
              title="Snap photo with camera"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 3: Barcode Scanner Option */}
        <div className="rounded-3xl border-2 border-[#123C2A]/20 bg-white p-5 flex flex-col justify-between hover:border-[#123C2A]/50 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#2E6847] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#123C2A] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                Scan Barcode
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#DCE8D8] text-[#123C2A] text-[10px] font-bold">
                Global Registry
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#17231C]">Open Food Facts Barcode</h3>
              <p className="text-xs text-[#68736B] mt-1 leading-relaxed">
                Scan with camera, upload a barcode photo, or enter digits to auto-fetch verified nutritional facts and ingredients.
              </p>
            </div>

            <div className="h-44 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#DCE8D8] text-[#123C2A] flex items-center justify-center">
                <Barcode className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[#17231C]">
                Instant Registry Auto-Fill
              </p>
              <p className="text-[11px] text-[#68736B]">
                Lookup 3M+ packaged food products worldwide
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#123C2A]/10">
            <button
              type="button"
              onClick={() => setShowBarcodeModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2E6847] hover:bg-[#123C2A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Barcode className="w-4 h-4" />
              Open Barcode Scanner
            </button>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#123C2A] text-[#F5F3EA] shadow-medium flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-extrabold flex items-center justify-center sm:justify-start gap-2">
            <FileCheck2 className="w-5 h-5 text-[#DCE8D8]" />
            Complete Product Verification
          </h4>
          <p className="text-xs text-[#DCE8D8]/80 max-w-xl">
            {hasBothPhotos
              ? 'Both front and back package photos are ready. Click below to start full OCR extraction, compliance evaluation, and health grading.'
              : 'Please upload both front and back package photos for complete product analysis.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {(frontImage || backImage) && (
            <button
              type="button"
              onClick={clearAllImages}
              className="px-4 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 text-xs font-bold transition-colors"
            >
              Clear Photos
            </button>
          )}

          <Button
            size="lg"
            variant="secondary"
            onClick={handleScanSubmit}
            icon={Sparkles}
            className={`w-full sm:w-auto font-black px-8 shadow-lg ${
              !hasBothPhotos ? 'opacity-90' : ''
            }`}
          >
            Run Complete Product Scan
          </Button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <BarcodeScanner
              onProductFound={handleBarcodeProductFound}
              onClose={() => setShowBarcodeModal(false)}
            />
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {activeCameraView && (
        <CameraScanner
          isOpen={!!activeCameraView}
          targetViewLabel={activeCameraView === 'front' ? 'Front Package Photo' : 'Back Package Photo'}
          onClose={() => setActiveCameraView(null)}
          onCapture={handleCameraCapture}
        />
      )}

      {/* High-res Image Zoom Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-[#FAF9F5] rounded-2xl overflow-hidden p-2">
            <img
              src={previewModalUrl}
              alt="High resolution packaging preview"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="mt-2 w-full py-2 bg-[#123C2A] text-white text-xs font-bold rounded-lg"
            >
              Close Zoom View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
