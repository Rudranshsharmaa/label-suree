import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useScan } from '../context/ScanContext';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { MultiImageUploader } from '../components/scanner/MultiImageUploader';
import { ScanProgress } from '../components/scanner/ScanProgress';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { 
  ScanLine, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  UtensilsCrossed,
  RotateCcw,
  FileText
} from 'lucide-react';

export function ScannerPage() {
  const { user } = useAuth();
  const { 
    executeScan, 
    isScanning, 
    currentStepIndex, 
    currentStepText, 
    activeResult, 
    clearAllImages, 
    error 
  } = useScan();
  const navigate = useNavigate();

  const handleStartScan = async () => {
    if (!user) return;
    try {
      const result = await executeScan(user.id);
      if (result && result.food_classification === 'FOOD PRODUCT DETECTED') {
        navigate(`/reports/${result.scan_id}`);
      }
    } catch (err) {
      console.error('Scan execution error:', err);
    }
  };

  return (
    <div className="py-8 sm:py-10 space-y-8">
      <ResponsiveContainer maxWidth="max-w-6xl">
        {/* Header Title */}
        <div className="space-y-1 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E6847]">
            Intelligent OCR & Compliance Pipeline
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17231C]">
            Multi-Image Packaging Scanner
          </h1>
          <p className="text-xs sm:text-sm text-[#68736B]">
            Upload packaging images to extract statutory declarations, check FSS Act 2006 compliance, and generate nutritional health scores.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#FBEBEB] border border-[#B94A48]/30 flex items-start gap-3 text-xs text-[#B94A48]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Scan Execution Issue</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Non-Food Result Intervention Banner */}
        {activeResult && activeResult.food_classification === 'NON-FOOD PRODUCT' && (
          <div className="p-6 rounded-3xl bg-[#FBEBEB] border border-[#B94A48]/30 space-y-4 text-left animate-in fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#B94A48] flex items-center justify-center shrink-0 shadow-xs">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status="NON-FOOD PRODUCT" size="sm" />
                  <span className="text-xs font-bold text-[#B94A48]">
                    Food Compliance Checks Halted
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#17231C]">
                  {activeResult.product_name || 'Non-Food Item Detected'}
                </h3>
                <p className="text-xs sm:text-sm text-[#17231C] leading-relaxed">
                  This product does not appear to be a food product. LabelSure is designed for food product analysis only. Please scan a valid food product.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#B94A48]/20">
              <Button
                variant="danger"
                size="sm"
                onClick={clearAllImages}
                icon={RotateCcw}
                className="font-bold"
              >
                Scan a Different Product
              </Button>
            </div>
          </div>
        )}

        {/* Uncertain Result Intervention Banner */}
        {activeResult && activeResult.food_classification === 'UNCERTAIN — REQUIRES REVIEW' && (
          <div className="p-6 rounded-3xl bg-[#FEF6E8] border border-[#C78A28]/30 space-y-4 text-left animate-in fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#C78A28] flex items-center justify-center shrink-0 shadow-xs">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <StatusBadge status="UNCERTAIN — REQUIRES REVIEW" size="sm" />
                <h3 className="text-base font-bold text-[#17231C]">
                  Uncertain Product Classification
                </h3>
                <p className="text-xs sm:text-sm text-[#17231C] leading-relaxed">
                  Unable to confidently classify this product. Please upload clearer packaging images or review the result manually.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#C78A28]/20">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearAllImages}
                icon={RotateCcw}
              >
                Retake Clearer Photos
              </Button>
              <Link to={`/reports/${activeResult.scan_id}`}>
                <Button size="sm" variant="primary" icon={FileText}>
                  Review Extracted OCR Text
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Scanning Stepper Progress vs Uploader */}
        {isScanning ? (
          <ScanProgress
            currentStepIndex={currentStepIndex}
            currentStepText={currentStepText}
          />
        ) : (
          <MultiImageUploader onStartScan={handleStartScan} />
        )}
      </ResponsiveContainer>
    </div>
  );
}
