import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { FileText, QrCode, Tag, Calendar, ShieldCheck, Check, AlertCircle, EyeOff } from 'lucide-react';

export function OCRTranscriptViewer({ extractedFields = {}, ocrText = '', qrData = null }) {
  const [activeTab, setActiveTab] = useState('fields'); // 'fields' or 'raw'

  const mrp = extractedFields.mrp || {};
  const mfd = extractedFields.manufacturingDate || {};
  const exp = extractedFields.expiryDate || {};
  const fssai = extractedFields.fssai || {};
  const netQty = extractedFields.netQuantity || {};
  const batch = extractedFields.batchNumber || {};

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-5">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#123C2A]/10">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#17231C] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#123C2A]" />
            OCR Extraction & Declaration Evidence
          </h3>
          <p className="text-xs text-[#68736B]">
            Field-by-field OCR detection mapped directly to source packaging panels.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#E9E8DC] p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'fields'
                ? 'bg-[#123C2A] text-[#F5F3EA] shadow-xs'
                : 'text-[#17231C] hover:text-[#123C2A]'
            }`}
          >
            Structured Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'raw'
                ? 'bg-[#123C2A] text-[#F5F3EA] shadow-xs'
                : 'text-[#17231C] hover:text-[#123C2A]'
            }`}
          >
            Raw OCR Text
          </button>
        </div>
      </div>

      {activeTab === 'fields' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* MRP */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#68736B]">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#123C2A]" />
                  MRP (Maximum Retail Price)
                </span>
                {mrp.value ? (
                  <span className="text-[10px] text-[#347A4D] font-semibold bg-[#DCE8D8] px-1.5 py-0.2 rounded-sm">
                    Detected
                  </span>
                ) : (
                  <span className="text-[10px] text-[#68736B] bg-[#E9E8DC] px-1.5 py-0.2 rounded-sm">
                    Not Found
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold text-[#17231C]">
                {mrp.formatted || mrp.display || 'Not verified from the provided images.'}
              </p>
              <p className="text-[10px] text-[#68736B]">
                {mrp.inclusiveOfTaxes ? '✓ Incl. of all taxes declared' : '• Taxes phrasing unconfirmed'}
                {mrp.sourceView ? ` (from ${mrp.sourceView})` : ''}
              </p>
            </div>

            {/* Manufacturing Date */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#68736B]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#123C2A]" />
                  MFD / PKD Date
                </span>
                {mfd.raw ? (
                  <span className="text-[10px] text-[#347A4D] font-semibold bg-[#DCE8D8] px-1.5 py-0.2 rounded-sm">
                    Detected
                  </span>
                ) : (
                  <span className="text-[10px] text-[#68736B] bg-[#E9E8DC] px-1.5 py-0.2 rounded-sm">
                    Not Verified
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold text-[#17231C]">
                {mfd.raw || mfd.display || 'Not verified from the provided images.'}
              </p>
              <p className="text-[10px] text-[#68736B]">
                {mfd.detectedVia ? `Detected via ${mfd.detectedVia}` : 'Requires clear packaging date view'}
              </p>
            </div>

            {/* Expiry / Best Before */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#68736B]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#123C2A]" />
                  Expiry / Best Before
                </span>
                {exp.raw ? (
                  <span className="text-[10px] text-[#347A4D] font-semibold bg-[#DCE8D8] px-1.5 py-0.2 rounded-sm">
                    Detected
                  </span>
                ) : (
                  <span className="text-[10px] text-[#68736B] bg-[#E9E8DC] px-1.5 py-0.2 rounded-sm">
                    Not Verified
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold text-[#17231C]">
                {exp.raw || exp.display || 'Not verified from the provided images.'}
              </p>
              <p className="text-[10px] text-[#68736B]">
                {exp.detectedVia ? `Detected via ${exp.detectedVia}` : 'Requires clear packaging expiry view'}
              </p>
            </div>

            {/* Net Quantity */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <span className="text-[11px] font-bold text-[#68736B]">Net Quantity / Weight</span>
              <p className="text-base font-extrabold text-[#17231C]">
                {netQty.value || netQty.display || 'Not verified from the provided images.'}
              </p>
              <p className="text-[10px] text-[#68736B]">Legal Metrology metric unit verification</p>
            </div>

            {/* Batch / Lot */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <span className="text-[11px] font-bold text-[#68736B]">Batch / Lot Number</span>
              <p className="text-base font-extrabold text-[#17231C]">
                {batch.value || batch.display || 'Not verified from the provided images.'}
              </p>
              <p className="text-[10px] text-[#68736B]">Traceability identification</p>
            </div>

            {/* FSSAI 14-Digit */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <span className="text-[11px] font-bold text-[#68736B]">FSSAI License / Reg. No</span>
              <p className="text-base font-extrabold text-[#17231C]">
                {fssai.licenseNumber || fssai.display || 'Not verified from the provided images.'}
              </p>
              <p className="text-[10px] text-[#68736B]">
                {fssai.isValidFormat ? '✓ 14-digit format valid' : 'Category-dependent check'}
              </p>
            </div>
          </div>

          {/* QR Code Decoupling Note Banner */}
          <div className="p-3.5 rounded-2xl bg-[#E9E8DC]/70 border border-[#123C2A]/10 flex items-start gap-3 text-xs text-[#17231C]">
            <QrCode className="w-5 h-5 text-[#123C2A] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">QR Code vs Packaging OCR Protocol</p>
              <p className="text-[#68736B] text-[11px] mt-0.5">
                Physical packaging declarations (such as MRP, MFD, and Expiry dates) are inspected directly from physical container OCR. Absence from QR codes is never treated as a compliance failure.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10">
          <pre className="text-xs font-mono text-[#17231C] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {DOMPurify.sanitize(ocrText || 'No raw OCR text captured.')}
          </pre>
        </div>
      )}
    </div>
  );
}
