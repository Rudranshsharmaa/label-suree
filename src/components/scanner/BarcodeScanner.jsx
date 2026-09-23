import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Barcode, 
  Camera, 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  X
} from 'lucide-react';

export function BarcodeScanner({ onProductFound, onClose }) {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  const html5QrCodeRef = useRef(null);
  const readerElementId = 'labelsure-barcode-reader';
  const fileInputRef = useRef(null);

  // Stop camera helper
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error clearing barcode scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanningCamera(false);
  };

  // Start camera scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      await stopCamera();
      
      const qrCodeInstance = new Html5Qrcode(readerElementId);
      html5QrCodeRef.current = qrCodeInstance;

      const config = {
        fps: 10,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.777778,
      };

      await qrCodeInstance.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          // Success callback
          await stopCamera();
          handleLookup(decodedText);
        },
        () => {
          // Ignore frame decode misses
        }
      );

      setIsScanningCamera(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or enter the barcode number manually.');
      setIsScanningCamera(false);
    }
  };

  // Switch modes safely
  const handleModeChange = async (mode) => {
    await stopCamera();
    setActiveMode(mode);
    setCameraError(null);
    if (mode === 'camera') {
      setTimeout(() => startCamera(), 150);
    }
  };

  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode]);

  // Handle Barcode file upload decode
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLookupError(null);
    setIsLoadingLookup(true);

    try {
      const qrCodeInstance = new Html5Qrcode('barcode-file-decoder-temp');
      const decodedText = await qrCodeInstance.scanFile(file, true);
      await qrCodeInstance.clear();
      await handleLookup(decodedText);
    } catch (err) {
      console.warn('Image barcode decode failed:', err);
      setLookupError('Could not detect a clear barcode in this photo. Please try another photo or enter the barcode numbers below.');
      setIsLoadingLookup(false);
    }
  };

  // Perform Open Food Facts registry lookup
  const handleLookup = async (code) => {
    if (!code || !code.trim()) {
      setLookupError('Please enter or scan a valid numeric barcode.');
      return;
    }

    setLookupError(null);
    setIsLoadingLookup(true);
    setBarcodeInput(code);

    try {
      const result = await api.barcode.lookup(code);
      setLookupResult(result);
    } catch (err) {
      setLookupError(err.message || 'Error querying product database.');
    } finally {
      setIsLoadingLookup(false);
    }
  };

  // Sample quick barcodes
  const quickSamples = [
    { label: 'Oats & Grains', code: '8901030895556' },
    { label: 'Biscuits', code: '8901491101838' },
    { label: 'Nutella / Spread', code: '3017620422003' },
  ];

  return (
    <div className="rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/20 p-5 sm:p-7 shadow-soft space-y-6 text-left relative">
      {/* Hidden container for file decoding */}
      <div id="barcode-file-decoder-temp" className="hidden" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#123C2A]/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#123C2A] text-[#F5F3EA]">
              <Barcode className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-[#17231C]">
              Scan Product Barcode
            </h3>
          </div>
          <p className="text-xs text-[#68736B]">
            Instantly query Open Food Facts global food registry to extract ingredients, nutrition facts, and category details.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-full text-[#68736B] hover:text-[#17231C] hover:bg-[#E9E8DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#E9E8DC]/80 border border-[#123C2A]/10">
        <button
          type="button"
          onClick={() => handleModeChange('camera')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeMode === 'camera'
              ? 'bg-white text-[#123C2A] shadow-xs'
              : 'text-[#68736B] hover:text-[#17231C]'
          }`}
        >
          <Camera className="w-4 h-4" />
          Camera Scanner
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('upload')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeMode === 'upload'
              ? 'bg-white text-[#123C2A] shadow-xs'
              : 'text-[#68736B] hover:text-[#17231C]'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Barcode Photo
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('manual')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeMode === 'manual'
              ? 'bg-white text-[#123C2A] shadow-xs'
              : 'text-[#68736B] hover:text-[#17231C]'
          }`}
        >
          <Search className="w-4 h-4" />
          Enter Barcode Number
        </button>
      </div>

      {/* Mode 1: Live Camera Scanner */}
      {activeMode === 'camera' && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black/90 aspect-video max-h-[320px] flex items-center justify-center">
            <div id={readerElementId} className="w-full h-full" />
            
            {cameraError && (
              <div className="absolute inset-0 bg-black/85 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-[#B94A48]" />
                <p className="text-xs text-white max-w-sm">{cameraError}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleModeChange('manual')}
                >
                  Enter Barcode Manually
                </Button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-center text-[#68736B]">
            Point your camera steadily at the 1D/2D barcode on the product packaging.
          </p>
        </div>
      )}

      {/* Mode 2: Upload Photo */}
      {activeMode === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#123C2A]/25 hover:border-[#123C2A] rounded-2xl p-8 text-center cursor-pointer bg-white transition-colors space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E9E8DC] text-[#123C2A] flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#17231C]">
                Click or drag & drop barcode photo
              </p>
              <p className="text-xs text-[#68736B] mt-0.5">
                Ensure the black bars and numbers are sharply focused.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Manual Numeric Entry */}
      {activeMode === 'manual' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(barcodeInput);
            }}
            className="flex flex-col sm:flex-row items-center gap-2.5"
          >
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Enter 8, 12, or 13-digit barcode (e.g. 8901030895556)"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-mono rounded-xl border border-[#123C2A]/25 bg-white focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
              />
              <Barcode className="w-5 h-5 text-[#68736B] absolute left-3 top-3" />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoadingLookup}
              icon={Search}
              className="w-full sm:w-auto font-bold px-6 shrink-0"
            >
              Lookup Barcode
            </Button>
          </form>

          {/* Quick sample chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-[#68736B]">Quick Try:</span>
            {quickSamples.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => {
                  setBarcodeInput(s.code);
                  handleLookup(s.code);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-[#E9E8DC] hover:bg-[#DCE8D8] text-[#123C2A] font-medium transition-colors"
              >
                {s.label} ({s.code})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lookup Loading State */}
      {isLoadingLookup && (
        <div className="p-6 rounded-2xl bg-white border border-[#123C2A]/15 text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#123C2A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#17231C]">
            Querying Global Product Registry...
          </p>
        </div>
      )}

      {/* Error Message */}
      {lookupError && (
        <div className="p-4 rounded-2xl bg-[#FBEBEB] border border-[#B94A48]/30 flex items-start gap-3 text-xs text-[#B94A48]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Lookup Unsuccessful</p>
            <p>{lookupError}</p>
          </div>
        </div>
      )}

      {/* Result Card */}
      {lookupResult && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#2E6847] space-y-5 shadow-sm animate-in fade-in">
          {lookupResult.found ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#123C2A]/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#DCE8D8] text-[#123C2A] text-xs font-bold font-mono">
                      #{lookupResult.barcode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E9E8DC] text-[#17231C] text-xs font-semibold">
                      {lookupResult.category}
                    </span>
                    <StatusBadge status={lookupResult.vegNonVegStatus} size="sm" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-[#17231C] mt-1">
                    {lookupResult.productName}
                  </h4>
                  {lookupResult.brand && (
                    <p className="text-xs font-medium text-[#68736B]">
                      Brand: <span className="text-[#17231C] font-bold">{lookupResult.brand}</span>
                    </p>
                  )}
                </div>

                {lookupResult.imageUrl && (
                  <img
                    src={lookupResult.imageUrl}
                    alt={lookupResult.productName}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl bg-[#FAF9F5] border border-[#123C2A]/10 shrink-0"
                  />
                )}
              </div>

              {/* Ingredients & Nutrition Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
                  <span className="font-bold text-[#17231C] block">Ingredients</span>
                  <p className="text-[#68736B] line-clamp-3 leading-relaxed">
                    {lookupResult.ingredientsText || (lookupResult.ingredients.length > 0 ? lookupResult.ingredients.join(', ') : 'Ingredients listed in barcode registry.')}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
                  <span className="font-bold text-[#17231C] block">Nutrition Facts</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-[#68736B]">
                    <div>Energy: <span className="font-semibold text-[#17231C]">{lookupResult.nutritionalData?.energyKcal ? `${lookupResult.nutritionalData.energyKcal} kcal` : 'N/A'}</span></div>
                    <div>Protein: <span className="font-semibold text-[#17231C]">{lookupResult.nutritionalData?.proteinG ? `${lookupResult.nutritionalData.proteinG}g` : 'N/A'}</span></div>
                    <div>Sugar: <span className="font-semibold text-[#17231C]">{lookupResult.nutritionalData?.totalSugarG ? `${lookupResult.nutritionalData.totalSugarG}g` : 'N/A'}</span></div>
                    <div>Sodium: <span className="font-semibold text-[#17231C]">{lookupResult.nutritionalData?.sodiumMg ? `${lookupResult.nutritionalData.sodiumMg}mg` : 'N/A'}</span></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#123C2A]/10">
                <span className="text-[11px] text-[#68736B] flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[#2E6847]" />
                  Verified via {lookupResult.source}
                </span>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (onProductFound) {
                      onProductFound(lookupResult);
                    }
                  }}
                  icon={Sparkles}
                  className="w-full sm:w-auto font-bold"
                >
                  Use Product Data in Scanner
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-center py-2">
              <AlertCircle className="w-8 h-8 text-[#C78A28] mx-auto" />
              <div>
                <h5 className="text-sm font-bold text-[#17231C]">
                  Barcode #{lookupResult.barcode} Not Found in Registry
                </h5>
                <p className="text-xs text-[#68736B] max-w-md mx-auto mt-1">
                  {lookupResult.message || 'No direct match in the Open Food Facts database. You can still scan the front and back package photos directly for complete OCR compliance analysis.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleModeChange('manual')}
                icon={RotateCcw}
              >
                Try Another Barcode
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
