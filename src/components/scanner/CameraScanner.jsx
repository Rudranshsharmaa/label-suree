import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

export function CameraScanner({ isOpen, onClose, onCapture, targetViewLabel = 'Packaging View' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back camera) or 'user'
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let activeStream = null;

    async function startCamera() {
      if (!isOpen) return;
      setIsInitializing(true);
      setCameraError(null);
      setCapturedImage(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.warn('Camera error:', err);
        setCameraError(err.message || 'Unable to access camera. Please check browser permissions.');
      } finally {
        setIsInitializing(false);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const handleStopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleClose = () => {
    handleStopCamera();
    onClose();
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
  };

  const retakeSnapshot = () => {
    setCapturedImage(null);
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const toggleFacingMode = () => {
    handleStopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-[#FAF9F5] rounded-3xl overflow-hidden shadow-2xl border border-[#123C2A]/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#123C2A]/10 bg-[#FAF9F5]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#123C2A]" />
            <h3 className="text-sm sm:text-base font-bold text-[#17231C]">
              Capture: {targetViewLabel}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#68736B] hover:bg-[#E9E8DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black min-h-[320px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-white space-y-3 max-w-sm">
              <AlertCircle className="w-10 h-10 text-[#C78A28] mx-auto" />
              <p className="text-sm font-semibold">{cameraError}</p>
              <p className="text-xs text-gray-300">
                You can alternatively upload packaging photos directly from your device storage.
              </p>
            </div>
          ) : capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured packaging snapshot" 
              className="w-full h-full object-contain max-h-[450px]"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover max-h-[450px]"
              />
              {/* Packaging Alignment Guide overlay */}
              <div className="pointer-events-none absolute inset-6 sm:inset-10 border-2 border-dashed border-white/60 rounded-2xl flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                  Align label within box
                </span>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Control Toolbar */}
        <div className="p-4 sm:p-5 bg-[#FAF9F5] border-t border-[#123C2A]/10 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={retakeSnapshot}
                icon={RefreshCw}
                className="flex-1 font-semibold"
              >
                Retake
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={confirmCapture}
                icon={Check}
                className="flex-1 font-bold"
              >
                Use Photo
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFacingMode}
                icon={RefreshCw}
                disabled={isInitializing || !!cameraError}
                className="text-xs"
              >
                Flip Camera
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={takeSnapshot}
                disabled={isInitializing || !!cameraError}
                icon={Camera}
                className="font-bold shadow-md px-8"
              >
                Snap Photo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-xs text-[#68736B]"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
