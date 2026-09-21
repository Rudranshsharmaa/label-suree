import React from 'react';
import { Sparkles, Info, HeartPulse, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { HEALTH_DISCLAIMER } from '../../services/healthRatingEngine';

export function HealthRatingCard({ scan }) {
  if (!scan) return null;

  const isAvailable = scan.health_rating_available;
  const grade = scan.health_rating;
  const score = scan.health_score;
  const details = scan.health_details || {};
  const factors = details.factors || [];

  if (!isAvailable) {
    return (
      <div className="p-6 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-[#68736B]">
          <HeartPulse className="w-5 h-5 text-[#C78A28]" />
          <h3 className="text-base font-bold text-[#17231C]">
            Nutritional Health Grade
          </h3>
        </div>
        <div className="p-4 rounded-2xl bg-[#FEF6E8] border border-[#C78A28]/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#C78A28] shrink-0 mt-0.5" />
          <div className="text-xs text-[#17231C] space-y-1">
            <p className="font-bold">Health rating unavailable: Insufficient nutritional information.</p>
            <p className="text-[#68736B]">
              {scan.health_summary || 'Essential macronutrient values (calories, sugars, saturated fats, or sodium) were not detected on the packaging.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const gradeColors = {
    'A+': 'from-[#123C2A] to-[#2E6847] text-[#FAF9F5]',
    'A': 'from-[#2E6847] to-[#347A4D] text-white',
    'B': 'from-[#347A4D] to-[#489965] text-white',
    'C': 'from-[#C78A28] to-[#D99834] text-white',
    'D': 'from-[#D97724] to-[#E38B3F] text-white',
    'E': 'from-[#C2523C] to-[#D46B57] text-white',
    'F': 'from-[#B94A48] to-[#D15F5D] text-white',
  };

  const gradient = gradeColors[grade] || gradeColors['C'];

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#123C2A]/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736B]">
            Nutritional Quality
          </span>
          <h3 className="text-base sm:text-lg font-bold text-[#17231C] flex items-center gap-2 mt-0.5">
            <HeartPulse className="w-5 h-5 text-[#123C2A]" />
            A+ to F Health Rating
          </h3>
        </div>
        <span className="text-xs text-[#68736B] font-semibold bg-[#E9E8DC] px-2.5 py-1 rounded-full">
          Documented Profiling Model
        </span>
      </div>

      {/* Grade Hero & Score */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        {/* Large Grade Badge */}
        <div className={`p-6 rounded-3xl bg-linear-to-br ${gradient} text-center shadow-md sm:col-span-1 flex flex-col items-center justify-center`}>
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">
            Health Grade
          </span>
          <span className="text-5xl sm:text-6xl font-black tracking-tight my-1">
            {grade}
          </span>
          <span className="text-xs font-semibold opacity-90">
            Score: {score} / 100
          </span>
        </div>

        {/* Narrative Summary */}
        <div className="sm:col-span-2 space-y-2">
          <h4 className="text-sm font-bold text-[#17231C]">
            Nutritional Profile Summary
          </h4>
          <p className="text-xs sm:text-sm text-[#68736B] leading-relaxed">
            {scan.health_summary}
          </p>

          <div className="pt-2">
            <div className="flex justify-between text-[11px] font-bold text-[#17231C] mb-1">
              <span>Nutrient Quality Index</span>
              <span>{score}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#E9E8DC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#123C2A] rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Impact Factors Breakdown */}
      {factors.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-[#123C2A]/10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
            Grading Factors Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {factors.map((factor, idx) => {
              const isPositive = factor.impact > 0;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    isPositive
                      ? 'bg-[#DCE8D8]/40 border-[#2E6847]/20 text-[#123C2A]'
                      : 'bg-[#FBEBEB]/40 border-[#B94A48]/20 text-[#B94A48]'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4 text-[#347A4D] shrink-0 mt-0.5" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-[#B94A48] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{factor.name} ({isPositive ? `+${factor.impact}` : factor.impact} pts)</span>
                    <p className="text-[11px] text-[#68736B] mt-0.5">{factor.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-3 rounded-xl bg-[#E9E8DC]/60 border border-[#123C2A]/10 text-[10px] text-[#68736B] leading-relaxed">
        <strong>Informational Notice: </strong>
        {HEALTH_DISCLAIMER}
      </div>
    </div>
  );
}
