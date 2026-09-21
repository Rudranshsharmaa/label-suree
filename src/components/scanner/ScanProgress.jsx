import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { SCAN_STEPS } from '../../context/ScanContext';

export function ScanProgress({ currentStepIndex, currentStepText }) {
  const percentage = Math.round(((currentStepIndex + 1) / SCAN_STEPS.length) * 100);

  return (
    <div className="w-full bg-[#FAF9F5] border border-[#123C2A]/15 rounded-3xl p-6 sm:p-8 shadow-card text-center space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-[#DCE8D8] text-[#123C2A] flex items-center justify-center shadow-inner">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#17231C]">
            Analyzing Food Packaging
          </h3>
          <p className="text-xs sm:text-sm font-medium text-[#2E6847] mt-1">
            {currentStepText || 'Processing packaging images...'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 max-w-md mx-auto">
        <div className="w-full h-2.5 bg-[#E9E8DC] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-[#123C2A] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold text-[#68736B]">
          <span>Step {currentStepIndex + 1} of {SCAN_STEPS.length}</span>
          <span>{percentage}%</span>
        </div>
      </div>

      {/* Step checklist preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-lg mx-auto pt-2">
        {SCAN_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-colors ${
                isCurrent
                  ? 'bg-[#E9E8DC] font-bold text-[#123C2A]'
                  : isDone
                  ? 'text-[#2E6847] font-medium'
                  : 'text-[#68736B]/60'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-[#347A4D] shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-[#123C2A] animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#68736B]/30 flex items-center justify-center text-[9px] shrink-0">
                  {idx + 1}
                </div>
              )}
              <span className="truncate">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
