import React, { useState, useRef } from 'react';
import { PACKAGING_VIEWS } from '../../services/ocrService';
import { useScan } from '../../context/ScanContext';
import { CameraScanner } from './CameraScanner';
import { Button } from '../common/Button';
import { 
  Upload, 
  Camera, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Layers, 
  Sparkles, 
  AlertCircle,
  PackageCheck
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
  const [previewModalUrl, setPreviewModalUrl] = useState(null);
  const fileInputRefs = useRef({});

  const handleFileChange = (viewId, event) => {
    const file = event.target.files?.[0];
    if (file) {
      addImage(viewId, file);
    }
  };

  const handleCameraCapture = (imageDataUrl) => {
    if (activeCameraView) {
      addImage(activeCameraView, null, imageDataUrl);
      setActiveCameraView(null);
    }
  };

  const uploadedCount = Object.keys(uploadedImages).length;

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
    <div className="space-y-8">
      {/* Configuration & Quick Sample Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#123C2A]/10">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#17231C] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#123C2A]" />
              Multi-View Packaging Upload
            </h2>
            <p className="text-xs text-[#68736B] mt-0.5">
              Upload photos of all available packaging sides for complete compliance and OCR detection.
            </p>
          </div>

          {/* Quick Demo Preloaders */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="text-[11px] font-semibold text-[#68736B]">Instant Demo:</span>
            <button
              type="button"
              onClick={() => loadSampleProduct('almonds')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#DCE8D8] text-[#123C2A] hover:bg-[#2E6847] hover:text-white transition-colors"
            >
              🥗 Food (Almonds)
            </button>
            <button
              type="button"
              onClick={() => loadSampleProduct('shampoo_nonfood')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#E9E8DC] text-[#17231C] hover:bg-[#B94A48] hover:text-white transition-colors"
            >
              🧴 Non-Food (Shampoo)
            </button>
          </div>
        </div>

        {/* Product Details Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="product-name" className="block text-xs font-bold text-[#17231C]">
              Product Name / Title (Optional)
            </label>
            <input
              id="product-name"
              type="text"
              placeholder="e.g., Organic Roasted Almonds"
              value={productNameInput}
              onChange={(e) => setProductNameInput(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#123C2A]/20 bg-white focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="product-category" className="block text-xs font-bold text-[#17231C]">
              Food Category (For Category-Specific Rules)
            </label>
            <select
              id="product-category"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#123C2A]/20 bg-white focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
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

      {/* Packaging Views Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#17231C] flex items-center gap-2">
            <span>Packaging Views</span>
            <span className="px-2 py-0.5 rounded-full bg-[#123C2A] text-[#F5F3EA] text-xs font-bold">
              {uploadedCount} / {PACKAGING_VIEWS.length} Uploaded
            </span>
          </h3>

          {uploadedCount > 0 && (
            <button
              type="button"
              onClick={clearAllImages}
              className="text-xs font-medium text-[#B94A48] hover:underline"
            >
              Clear all images
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {PACKAGING_VIEWS.map((view) => {
            const uploaded = uploadedImages[view.id];
            const isImportant = ['front', 'back', 'mrp_close', 'date_close'].includes(view.id);

            return (
              <div
                key={view.id}
                className={`relative rounded-2xl border transition-all p-3.5 flex flex-col justify-between min-h-[160px] ${
                  uploaded
                    ? 'bg-[#FAF9F5] border-[#2E6847] shadow-sm'
                    : isImportant
                    ? 'bg-white border-[#123C2A]/20 hover:border-[#123C2A]/50'
                    : 'bg-[#FAF9F5]/70 border-[#123C2A]/10 hover:border-[#123C2A]/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-[#17231C] truncate">
                      {view.label}
                    </span>
                    {isImportant && !uploaded && (
                      <span className="text-[9px] font-bold text-[#C78A28] bg-[#FEF6E8] px-1.5 py-0.2 rounded-sm shrink-0">
                        Recommended
                      </span>
                    )}
                    {uploaded && (
                      <CheckCircle className="w-4 h-4 text-[#347A4D] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#68736B] line-clamp-2 leading-tight">
                    {view.description}
                  </p>
                </div>

                {/* Uploaded state vs Action buttons */}
                {uploaded ? (
                  <div className="mt-3 space-y-2">
                    <div className="relative h-20 w-full rounded-xl overflow-hidden bg-black/5 border border-[#123C2A]/10 group">
                      <img
                        src={uploaded.previewUrl}
                        alt={view.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalUrl(uploaded.previewUrl)}
                          className="p-1 rounded-md bg-white text-[#17231C] hover:bg-[#E9E8DC]"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(view.id)}
                          className="p-1 rounded-md bg-[#B94A48] text-white hover:bg-[#9E3E3C]"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-[#123C2A]/10">
                    <input
                      ref={(el) => (fileInputRefs.current[view.id] = el)}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(view.id, e)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[view.id]?.click()}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#E9E8DC] hover:bg-[#DCE8D8] text-[#123C2A] text-xs font-semibold transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCameraView(view.id)}
                      className="p-1.5 rounded-lg bg-[#FAF9F5] hover:bg-[#E9E8DC] border border-[#123C2A]/15 text-[#123C2A] transition-colors"
                      title="Snap photo with camera"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Guidelines & Start Scan Button */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#123C2A] text-[#F5F3EA] shadow-medium flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-extrabold flex items-center justify-center sm:justify-start gap-2">
            <PackageCheck className="w-5 h-5 text-[#DCE8D8]" />
            Ready to Analyze Packaging
          </h4>
          <p className="text-xs text-[#DCE8D8]/80 max-w-xl">
            Supported formats: JPG, PNG, WEBP, HEIC (Max 15MB). We inspect physical packaging via OCR to extract statutory declarations, MRP, dates, and nutritional data.
          </p>
        </div>

        <Button
          size="lg"
          variant="secondary"
          onClick={onStartScan}
          disabled={uploadedCount === 0}
          icon={Sparkles}
          className="w-full sm:w-auto font-extrabold px-8 shadow-lg shrink-0"
        >
          Run Intelligent Scan ({uploadedCount} {uploadedCount === 1 ? 'view' : 'views'})
        </Button>
      </div>

      {/* Camera Capture Modal */}
      {activeCameraView && (
        <CameraScanner
          isOpen={!!activeCameraView}
          targetViewLabel={PACKAGING_VIEWS.find(v => v.id === activeCameraView)?.label}
          onClose={() => setActiveCameraView(null)}
          onCapture={handleCameraCapture}
        />
      )}

      {/* High-res Image Zoom Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewModalUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-[#FAF9F5] rounded-2xl overflow-hidden p-2">
            <img src={previewModalUrl} alt="High resolution packaging preview" className="max-h-[80vh] w-auto object-contain rounded-xl" />
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="mt-2 w-full py-1.5 bg-[#123C2A] text-white text-xs font-bold rounded-lg"
            >
              Close Zoom View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
