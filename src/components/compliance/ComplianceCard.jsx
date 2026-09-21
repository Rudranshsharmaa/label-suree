import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { ShieldCheck, AlertTriangle, XCircle, Slash, FileText } from 'lucide-react';

export function ComplianceCard({ scan }) {
  if (!scan) return null;

  const summary = scan.compliance_summary || {
    total: 9,
    compliant: 0,
    nonCompliant: 0,
    requiresReview: 0,
    notProvided: 0,
    notApplicable: 0,
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#123C2A]/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736B]">
            Regulatory Evaluation
          </span>
          <h3 className="text-base sm:text-lg font-bold text-[#17231C] flex items-center gap-2 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-[#123C2A]" />
            Preliminary Compliance Status
          </h3>
        </div>
        <StatusBadge status={scan.compliance_status} size="lg" />
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-white border border-[#123C2A]/10 text-center">
          <p className="text-[11px] font-semibold text-[#68736B]">Compliant</p>
          <p className="text-xl font-extrabold text-[#347A4D] mt-0.5">
            {summary.compliant}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#123C2A]/10 text-center">
          <p className="text-[11px] font-semibold text-[#68736B]">Under Review</p>
          <p className="text-xl font-extrabold text-[#C78A28] mt-0.5">
            {summary.requiresReview}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#123C2A]/10 text-center">
          <p className="text-[11px] font-semibold text-[#68736B]">Non-Compliant</p>
          <p className="text-xl font-extrabold text-[#B94A48] mt-0.5">
            {summary.nonCompliant}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#123C2A]/10 text-center">
          <p className="text-[11px] font-semibold text-[#68736B]">Exempt / N/A</p>
          <p className="text-xl font-extrabold text-[#68736B] mt-0.5">
            {summary.notApplicable}
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-[#E9E8DC]/70 border border-[#123C2A]/10 text-xs text-[#17231C]/90 leading-relaxed flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-[#C78A28] shrink-0 mt-0.5" />
        <p className="text-[11px]">
          Evaluated against <strong>Food Safety and Standards Act, 2006</strong> and <strong>Legal Metrology Rules, 2011</strong>. Automated preliminary assessment only.
        </p>
      </div>
    </div>
  );
}
