import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0B291D] text-[#F5F3EA] border-t border-[#123C2A] mt-auto no-print" aria-label="Site Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] p-1.5 flex items-center justify-center">
                <img src="/logo.svg" alt="LabelSure Logo" width="36" height="36" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#F5F3EA]">
                LabelSure
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#DCE8D8]/80 max-w-md leading-relaxed">
              Empowering consumers, brand managers, and quality assurance teams with automated packaging OCR, statutory compliance auditing, and transparent nutritional intelligence.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#DCE8D8]/70 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#DCE8D8]" aria-hidden="true" />
                FSS Act, 2006
              </span>
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#DCE8D8]" aria-hidden="true" />
                Legal Metrology Rules, 2011
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#DCE8D8]">
              Platform Modules
            </p>
            <ul className="space-y-2 text-xs text-[#F5F3EA]/80">
              <li>
                <Link to="/scanner" className="hover:text-white transition-colors">
                  Multi-Image Packaging Scanner
                </Link>
              </li>
              <li>
                <Link to="/compliance-analysis" className="hover:text-white transition-colors">
                  Regulatory Compliance Engine
                </Link>
              </li>
              <li>
                <Link to="/health-analysis" className="hover:text-white transition-colors">
                  A+ to F Nutritional Grading
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-white transition-colors">
                  12-Month User Scan History
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#DCE8D8]">
              Compliance & Scope
            </p>
            <ul className="space-y-2 text-xs text-[#F5F3EA]/80">
              <li>Automatic Product Classification</li>
              <li>Category-Dependent FSSAI Rules</li>
              <li>OCR & Packaging Evidence Viewer</li>
              <li>Decoupled QR Code Inspection</li>
            </ul>
          </div>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="pt-6 border-t border-[#123C2A] text-center md:text-left">
          <div className="p-4 rounded-xl bg-[#123C2A]/60 border border-[#DCE8D8]/15 text-xs text-[#DCE8D8]/90 leading-relaxed mb-6">
            <strong className="text-white block sm:inline font-semibold">Statutory Disclaimer: </strong>
            LabelSure provides preliminary automated assessments based on available packaging images and optical text extraction. It does not constitute official government certification, statutory inspection, or legal approval under the Food Safety and Standards Authority of India (FSSAI) or the Department of Consumer Affairs.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#DCE8D8]/60 gap-3">
            <p>© {new Date().getFullYear()} LabelSure. Food Packaging Intelligence. All rights reserved.</p>
            <p className="text-[10px]">Built for Smart India Hackathon & Food Safety Compliance Research.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
