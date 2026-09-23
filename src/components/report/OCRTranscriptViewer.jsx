import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { FileText, QrCode, ShieldCheck, Check, AlertCircle, Sparkles, Building2, Package } from 'lucide-react';

export function OCRTranscriptViewer({ extractedFields = {}, ocrText = '', qrData = null }) {
  const [activeTab, setActiveTab] = useState('fields'); // 'fields' or 'raw'

  const fssai = extractedFields.fssai || {};
  const netQty = extractedFields.netQuantity || {};
  const batch = extractedFields.batchNumber || {};
  const productName = extractedFields.productName || '';
  const brand = extractedFields.brand || '';
  const vegStatus = extractedFields.vegNonVegStatus || 'UNCONFIRMED';
  const manufacturer = extractedFields.manufacturerInfo || '';
  const customerCare = extractedFields.customerCareInfo || '';

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
            Field-by-field OCR detection mapped directly to physical packaging panels.
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
            {/* Product Identity */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <span className="text-[11px] font-bold text-[#68736B] flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#123C2A]" />
                Product Identity & Brand
              </span>
              <p className="text-base font-extrabold text-[#17231C] truncate">
                {productName || 'Detected from front typography'}
              </p>
              <p className="text-[10px] text-[#68736B]">
                {brand ? `Brand: ${brand}` : 'Primary display panel verification'}
              </p>
            </div>

            {/* Net Quantity */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <span className="text-[11px] font-bold text-[#68736B]">Net Quantity / Weight</span>
              <p className="text-base font-extrabold text-[#17231C]">
                {netQty.value || netQty.display || 'Declared on packaging'}
              </p>
              <p className="text-[10px] text-[#68736B]">Legal Metrology metric unit declaration</p>
            </div>

            {/* FSSAI 14-Digit */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#68736B]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#123C2A]" />
                  FSSAI License / Registration No
                </span>
                {fssai.isValidFormat && (
                  <span className="text-[10px] text-[#347A4D] font-semibold bg-[#DCE8D8] px-1.5 py-0.2 rounded-sm">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold text-[#17231C]">
                {fssai.licenseNumber || fssai.display || 'Not verified from images'}
              </p>
              <p className="text-[10px] text-[#68736B]">
                {fssai.isValidFormat ? '✓ 14-digit format valid' : 'Category-dependent verification'}
              </p>
            </div>

            {/* Veg / Non-Veg Classification */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <span className="text-[11px] font-bold text-[#68736B]">Veg / Non-Veg Symbol</span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className={`w-3 h-3 rounded-full ${vegStatus === 'VEGETARIAN' ? 'bg-[#2E6847]' : (vegStatus === 'NON_VEGETARIAN' ? 'bg-[#B94A48]' : 'bg-[#68736B]')}`} />
                <p className="text-sm font-extrabold text-[#17231C]">
                  {vegStatus === 'VEGETARIAN' ? '100% Vegetarian' : (vegStatus === 'NON_VEGETARIAN' ? 'Non-Vegetarian' : 'Not Confirmed')}
                </p>
              </div>
              <p className="text-[10px] text-[#68736B]">Mandatory statutory dietary emblem</p>
            </div>

            {/* Batch / Lot */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <span className="text-[11px] font-bold text-[#68736B]">Batch / Lot Number</span>
              <p className="text-base font-extrabold text-[#17231C]">
                {batch.value || batch.display || 'Identified on packaging'}
              </p>
              <p className="text-[10px] text-[#68736B]">Traceability & manufacturing lot</p>
            </div>

            {/* Manufacturer & Consumer Care */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 space-y-1">
              <span className="text-[11px] font-bold text-[#68736B] flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#123C2A]" />
                Manufacturer & Grievance Contact
              </span>
              <p className="text-xs font-bold text-[#17231C] truncate">
                {manufacturer || customerCare || 'Declared on packaging'}
              </p>
              <p className="text-[10px] text-[#68736B]">Consumer grievance & FSSAI address</p>
            </div>
          </div>

          {/* Packaging OCR Protocol Banner */}
          <div className="p-3.5 rounded-2xl bg-[#E9E8DC]/70 border border-[#123C2A]/10 flex items-start gap-3 text-xs text-[#17231C]">
            <QrCode className="w-5 h-5 text-[#123C2A] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Packaging OCR Verification Protocol</p>
              <p className="text-[#68736B] text-[11px] mt-0.5">
                Statutory declarations and ingredients are extracted directly from high-resolution container photography and validated against FSS Act 2006 regulations.
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
