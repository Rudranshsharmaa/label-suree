import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Sparkles, 
  Info, 
  X,
  Flashlight,
  SwitchCamera,
  Play,
  Square,
  Zap
} from 'lucide-react';

export function BarcodeScanner({ onProductFound, onClose }) {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [detectedCode, setDetectedCode] = useState(null);
  const [detectedFormat, setDetectedFormat] = useState(null);

  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  // References
  const videoRef = useRef(null);
  const nativeDetectorRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const isDecodingRef = useRef(false);
  const lastScannedTimeRef = useRef(0);
  const lastScannedCodeRef = useRef('');
  const fileInputRef = useRef(null);

  // Check native BarcodeDetector support
  const hasNativeBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  // Sound / Haptic feedback on successful scan
  const triggerScanFeedback = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(80);
      } catch {}
    }
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {}
  };

  // Perform Open Food Facts lookup
  const handleLookup = useCallback(async (code, format = 'BARCODE') => {
    if (!code || !code.trim()) {
      setLookupError('Please enter or scan a valid numeric barcode.');
      return;
    }

    const cleanCode = code.trim().replace(/[^0-9A-Za-z]/g, '');
    setDetectedCode(cleanCode);
    setDetectedFormat(format);
    setLookupError(null);
    setIsLoadingLookup(true);
    setBarcodeInput(cleanCode);

    try {
      const result = await api.barcode.lookup(cleanCode);
      setLookupResult(result);
    } catch (err) {
      setLookupError(err.message || 'Error querying product database.');
    } finally {
      setIsLoadingLookup(false);
    }
  }, []);

  // Safe camera stop
  const stopCamera = useCallback(async () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      } catch (err) {
        console.warn('Error stopping stream tracks:', err);
      }
      streamRef.current = null;
    }
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error clearing Html5Qrcode:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setIsTorchSupported(false);
    isDecodingRef.current = false;
  }, []);

  // Native BarcodeDetector continuous loop
  const runNativeDetectionLoop = useCallback(() => {
    if (!videoRef.current || !nativeDetectorRef.current || !isCameraActive) return;

    const detectFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || isDecodingRef.current) {
        scanLoopRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      const now = Date.now();
      // Throttle scanning to every 150ms
      if (now - lastScannedTimeRef.current < 150) {
        scanLoopRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      isDecodingRef.current = true;
      try {
        const barcodes = await nativeDetectorRef.current.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const barcode = barcodes[0];
          const rawValue = barcode.rawValue;
          const format = barcode.format || 'EAN-13';

          // Debounce repeated identical scans within 3 seconds
          if (rawValue && (rawValue !== lastScannedCodeRef.current || now - lastScannedTimeRef.current > 3000)) {
            lastScannedTimeRef.current = now;
            lastScannedCodeRef.current = rawValue;
            triggerScanFeedback();
            await stopCamera();
            handleLookup(rawValue, format);
            return;
          }
        }
      } catch (err) {
        // Frame missed, ignore
      } finally {
        isDecodingRef.current = false;
      }

      scanLoopRef.current = requestAnimationFrame(detectFrame);
    };

    scanLoopRef.current = requestAnimationFrame(detectFrame);
  }, [isCameraActive, handleLookup, stopCamera]);

  // Start Camera
  const startCamera = useCallback(async (preferredCameraId = null) => {
    setCameraError(null);
    await stopCamera();

    try {
      // 1. Enumerate video devices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (!preferredCameraId && videoDevices.length > 0) {
          // Prefer back / environment camera
          const backCam = videoDevices.find(d => /back|rear|environment/i.test(d.label));
          preferredCameraId = backCam ? backCam.deviceId : videoDevices[0].deviceId;
          setSelectedCameraId(preferredCameraId);
        }
      }

      // 2. Check if Native BarcodeDetector is available
      if (hasNativeBarcodeDetector) {
        try {
          const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
          const targetFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
            .filter(f => supportedFormats.includes(f));
          
          nativeDetectorRef.current = new window.BarcodeDetector({
            formats: targetFormats.length > 0 ? targetFormats : supportedFormats,
          });

          const constraints = {
            video: preferredCameraId 
              ? { deviceId: { exact: preferredCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
              : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }

          // Check torch capability
          const track = stream.getVideoTracks()[0];
          if (track && track.getCapabilities) {
            const caps = track.getCapabilities();
            setIsTorchSupported(!!caps.torch);
          }

          setIsCameraActive(true);
          runNativeDetectionLoop();
          return;
        } catch (nativeErr) {
          console.warn('Native BarcodeDetector initialization fallback to Html5Qrcode:', nativeErr);
        }
      }

      // 3. Fallback to Html5Qrcode
      const html5QrCode = new Html5Qrcode('labelsure-barcode-html5-reader');
      html5QrCodeRef.current = html5QrCode;

      const qrConfig = {
        fps: 10,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.777778,
      };

      const cameraParam = preferredCameraId 
        ? { deviceId: { exact: preferredCameraId } }
        : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraParam,
        qrConfig,
        async (decodedText, decodedResult) => {
          const now = Date.now();
          if (decodedText !== lastScannedCodeRef.current || now - lastScannedTimeRef.current > 3000) {
            lastScannedTimeRef.current = now;
            lastScannedCodeRef.current = decodedText;
            triggerScanFeedback();
            await stopCamera();
            handleLookup(decodedText, decodedResult?.result?.format?.formatName || 'EAN-13');
          }
        },
        () => {} // Frame misses
      );

      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access denied. Please grant camera permission in your browser or enter the barcode numbers below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can enter the barcode number manually or upload a photo.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is currently busy or in use by another app. Please close other camera apps and retry.');
      } else {
        setCameraError('Unable to start live camera scanner. Please enter the barcode number manually or upload a photo.');
      }
      setIsCameraActive(false);
    }
  }, [hasNativeBarcodeDetector, runNativeDetectionLoop, stopCamera, handleLookup]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('Torch control error:', err);
      }
    }
  };

  // Switch Camera
  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex(c => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCameraId = availableCameras[nextIndex].deviceId;
    setSelectedCameraId(nextCameraId);
    startCamera(nextCameraId);
  };

  // Lifecycle
  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode]);

  // Barcode photo upload decoder
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLookupError(null);
    setIsLoadingLookup(true);

    try {
      const html5QrCode = new Html5Qrcode('barcode-file-decoder-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      await html5QrCode.clear();
      triggerScanFeedback();
      await handleLookup(decodedText, 'Image Barcode');
    } catch (err) {
      console.warn('Image barcode decode failed:', err);
      setLookupError('No sharp barcode detected in this image. Please ensure good lighting and clear black bars, or enter the numbers manually below.');
      setIsLoadingLookup(false);
    }
  };

  const quickSamples = [
    { label: 'Oats & Cereals', code: '8901030895556' },
    { label: 'Digestive Biscuits', code: '8901491101838' },
    { label: 'Hazelnut Spread', code: '3017620422003' },
  ];

  return (
    <div className="rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/20 p-5 sm:p-7 shadow-soft space-y-6 text-left relative">
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
            Query Open Food Facts global food registry to extract verified product title, brand, ingredients, and nutrition facts.
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
          onClick={() => setActiveMode('camera')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeMode === 'camera'
              ? 'bg-white text-[#123C2A] shadow-xs'
              : 'text-[#68736B] hover:text-[#17231C]'
          }`}
        >
          <Camera className="w-4 h-4" />
          Live Camera
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('upload')}
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
          onClick={() => setActiveMode('manual')}
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
          <div className="relative rounded-2xl overflow-hidden bg-black/95 aspect-video max-h-[320px] flex items-center justify-center shadow-inner">
            {/* Native Video Element */}
            {hasNativeBarcodeDetector ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div id="labelsure-barcode-html5-reader" className="w-full h-full" />
            )}

            {/* Scanning Reticle / Laser Overlay */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-36 border-2 border-[#2E6847] rounded-xl relative overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Laser line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#45B074] to-transparent animate-pulse top-1/2" />
                  <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
                </div>
              </div>
            )}

            {/* Camera Error Display */}
            {cameraError && (
              <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-[#B94A48]" />
                <p className="text-xs text-white max-w-sm">{cameraError}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => startCamera()}
                    icon={RotateCcw}
                  >
                    Retry Camera
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveMode('manual')}
                    className="text-white border-white/30"
                  >
                    Enter Manually
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <div className="flex items-center gap-2">
              {isCameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#123C2A]/20 text-[#123C2A] text-xs font-bold flex items-center gap-1.5 hover:bg-[#E9E8DC] transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-[#B94A48] text-[#B94A48]" />
                  Pause Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-3 py-1.5 rounded-xl bg-[#123C2A] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#2E6847] transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Start Camera
                </button>
              )}

              {availableCameras.length > 1 && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#123C2A]/20 text-[#123C2A] text-xs font-bold flex items-center gap-1.5 hover:bg-[#E9E8DC] transition-colors"
                  title="Switch between front and rear cameras"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                  Flip Camera
                </button>
              )}

              {isTorchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isTorchOn 
                      ? 'bg-[#FEF6E8] text-[#C78A28] border border-[#C78A28]' 
                      : 'bg-[#FAF9F5] border border-[#123C2A]/20 text-[#123C2A] hover:bg-[#E9E8DC]'
                  }`}
                  title="Toggle flashlight"
                >
                  <Flashlight className="w-3.5 h-3.5" />
                  {isTorchOn ? 'Torch On' : 'Torch Off'}
                </button>
              )}
            </div>

            <span className="text-[11px] text-[#68736B]">
              Supports EAN-13, EAN-8, UPC-A, Code 128 & QR
            </span>
          </div>
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
                Ensure black stripes and numeric digits are in sharp focus.
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
                placeholder="Enter 8, 12, 13, or 14-digit barcode (e.g. 8901030895556)"
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
            <span className="text-[11px] font-semibold text-[#68736B]">Instant Test:</span>
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
            Querying Open Food Facts Product Database...
          </p>
        </div>
      )}

      {/* Error Message */}
      {lookupError && (
        <div className="p-4 rounded-2xl bg-[#FBEBEB] border border-[#B94A48]/30 flex items-start gap-3 text-xs text-[#B94A48]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Barcode Lookup Notice</p>
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
                      #{lookupResult.barcode} {detectedFormat ? `(${detectedFormat})` : ''}
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

              {/* Data Provenance & Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#17231C]">Ingredients</span>
                    <span className="text-[10px] text-[#2E6847] font-semibold bg-[#DCE8D8] px-1.5 py-0.2 rounded-sm">
                      Barcode Database
                    </span>
                  </div>
                  <p className="text-[#68736B] line-clamp-3 leading-relaxed">
                    {lookupResult.ingredientsText || (lookupResult.ingredients?.length > 0 ? lookupResult.ingredients.join(', ') : 'Ingredients recorded in registry.')}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#17231C]">Nutrition Facts</span>
                    <span className="text-[10px] text-[#2E6847] font-semibold bg-[#DCE8D8] px-1.5 py-0.2 rounded-sm">
                      Barcode Database
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-[#68736B]">
                    <div>Energy: <span className="font-semibold text-[#17231C]">{lookupResult.nutritionalData?.energyKcal ? `${lookupResult.nutritionalData.energyKcal} kcal` : 'Not verified'}</span></div>
                    <div>Protein: <span className="font-semibold text-[#17231C]">{lookupResult.nutritionalData?.proteinG ? `${lookupResult.nutritionalData.proteinG}g` : 'Not verified'}</span></div>
                    <div>Sugar: <span className="font-semibold text-[#17231C]">{lookupResult.nutritionalData?.totalSugarG ? `${lookupResult.nutritionalData.totalSugarG}g` : 'Not verified'}</span></div>
                    <div>Sodium: <span className="font-semibold text-[#17231C]">{lookupResult.nutritionalData?.sodiumMg ? `${lookupResult.nutritionalData.sodiumMg}mg` : 'Not verified'}</span></div>
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
                  Barcode #{lookupResult.barcode} Detected
                </h5>
                <p className="text-xs text-[#68736B] max-w-md mx-auto mt-1 leading-relaxed">
                  Barcode detected, but complete product information was not found. Upload clear front and back package images for OCR analysis.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveMode('manual')}
                  icon={RotateCcw}
                >
                  Try Another Barcode
                </Button>
                {onClose && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onClose}
                  >
                    Proceed to Photo Upload
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
