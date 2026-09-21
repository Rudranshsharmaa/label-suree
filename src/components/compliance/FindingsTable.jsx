import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { ShieldCheck, Info, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export function FindingsTable({ findings = [], regulatoryFramework }) {
  const [expandedRule, setExpandedRule] = useState(null);

  if (!findings || findings.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[#68736B]">
        No compliance findings recorded for this scan.
      </div>
    );
  }

  const toggleExpand = (ruleId) => {
    setExpandedRule(expandedRule === ruleId ? null : ruleId);
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[#123C2A]/15 bg-white shadow-soft">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF9F5] border-b border-[#123C2A]/10 text-[11px] font-bold uppercase tracking-wider text-[#68736B]">
              <th className="py-3 px-4">Statutory Declaration Rule</th>
              <th className="py-3 px-4">Regulatory Standard</th>
              <th className="py-3 px-4">Evaluation Status</th>
              <th className="py-3 px-4">Extracted Evidence</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#123C2A]/10 text-xs">
            {findings.map((finding) => {
              const isExpanded = expandedRule === finding.ruleId;

              return (
                <React.Fragment key={finding.ruleId}>
                  <tr className="hover:bg-[#FAF9F5]/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#17231C]">
                      <div>{finding.ruleName}</div>
                      <span className="text-[10px] font-normal text-[#68736B]">
                        {finding.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#68736B] font-medium text-[11px]">
                      {finding.reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={finding.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-[#17231C] font-mono text-[11px] max-w-xs truncate">
                      {finding.evidence || (
                        <span className="text-[#68736B] italic font-sans">
                          {finding.status === 'NOT APPLICABLE' ? 'Exempted category' : 'No declaration found'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleExpand(finding.ruleId)}
                        className="p-1 rounded-md text-[#123C2A] hover:bg-[#E9E8DC] transition-colors"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-[#FAF9F5]">
                      <td colSpan={5} className="p-4 border-t border-[#123C2A]/5">
                        <div className="rounded-xl p-3 bg-white border border-[#123C2A]/10 space-y-2 text-xs">
                          <p className="font-semibold text-[#17231C]">
                            Finding Explanation:
                          </p>
                          <p className="text-[#68736B] leading-relaxed">
                            {finding.explanation}
                          </p>
                          {finding.evidence && (
                            <div className="mt-2 pt-2 border-t border-[#123C2A]/5 text-[11px]">
                              <span className="font-bold text-[#123C2A]">Extracted Evidence Transcript: </span>
                              <span className="font-mono text-[#17231C]">{finding.evidence}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Responsive 320px–767px) */}
      <div className="md:hidden space-y-3">
        {findings.map((finding) => (
          <div
            key={finding.ruleId}
            className="p-4 rounded-2xl bg-white border border-[#123C2A]/15 shadow-soft space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-[#17231C]">
                  {finding.ruleName}
                </h4>
                <p className="text-[10px] text-[#68736B]">
                  {finding.reference}
                </p>
              </div>
              <StatusBadge status={finding.status} size="sm" />
            </div>

            <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#123C2A]/10 text-xs space-y-1">
              <p className="text-[11px] font-semibold text-[#17231C]">
                {finding.explanation}
              </p>
              {finding.evidence && (
                <p className="text-[10px] font-mono text-[#2E6847] truncate">
                  Evidence: {finding.evidence}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
