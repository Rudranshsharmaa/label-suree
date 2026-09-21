import React, { useState } from 'react';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { Button } from '../components/common/Button';
import { Settings, Shield, Bell, Database, Check } from 'lucide-react';

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [autoOcrEnhance, setAutoOcrEnhance] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="py-8 sm:py-10 space-y-8">
      <ResponsiveContainer maxWidth="max-w-3xl">
        <div className="space-y-1 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E6847]">
            Configuration & Preferences
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17231C] flex items-center gap-2">
            <Settings className="w-7 h-7 text-[#123C2A]" />
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#68736B]">
            Configure regulatory rule standards, OCR enhancement thresholds, and accessibility options.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-6">
          {/* Regulatory Standards Config */}
          <div className="space-y-3 pb-5 border-b border-[#123C2A]/10">
            <h3 className="text-sm font-bold text-[#17231C] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#123C2A]" />
              Regulatory Rule Sets
            </h3>
            <div className="space-y-2 text-xs text-[#17231C]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked disabled className="rounded text-[#123C2A]" />
                <span className="font-semibold">Food Safety and Standards Act, 2006 (FSSAI Regulations 2020)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked disabled className="rounded text-[#123C2A]" />
                <span className="font-semibold">Legal Metrology (Packaged Commodities) Rules, 2011</span>
              </label>
            </div>
          </div>

          {/* OCR Preferences */}
          <div className="space-y-3 pb-5 border-b border-[#123C2A]/10">
            <h3 className="text-sm font-bold text-[#17231C] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#123C2A]" />
              Scanning & OCR Enhancements
            </h3>
            <div className="space-y-2 text-xs text-[#17231C]">
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-white border border-[#123C2A]/10">
                <div>
                  <p className="font-bold">Auto-Contrast & Noise Reduction Filter</p>
                  <p className="text-[#68736B] text-[11px]">Improves dot-matrix date stamp detection on reflective foils</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoOcrEnhance}
                  onChange={(e) => setAutoOcrEnhance(e.target.checked)}
                  className="rounded text-[#123C2A] h-4 w-4"
                />
              </label>
            </div>
          </div>

          <Button onClick={handleSave} variant="primary" size="md" icon={Check} className="font-bold">
            {saved ? 'Preferences Saved' : 'Save Settings'}
          </Button>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
