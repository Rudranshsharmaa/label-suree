import React from 'react';
import { Activity, Flame, Wheat, Droplets, ShieldAlert } from 'lucide-react';

export function NutrientBreakdown({ nutritionalData = {}, ingredientsRaw = '' }) {
  const nutrients = [
    { label: 'Energy / Calories', value: (nutritionalData?.energyKcal != null) ? `${nutritionalData.energyKcal} kcal` : 'N/A', icon: Flame, color: 'text-[#C78A28]' },
    { label: 'Protein', value: (nutritionalData?.proteinG != null) ? `${nutritionalData.proteinG} g` : 'N/A', icon: Activity, color: 'text-[#2E6847]' },
    { label: 'Carbohydrates', value: (nutritionalData?.carbohydratesG != null) ? `${nutritionalData.carbohydratesG} g` : 'N/A', icon: Wheat, color: 'text-[#17231C]' },
    { label: 'Total Sugars', value: (nutritionalData?.totalSugarG != null) ? `${nutritionalData.totalSugarG} g` : 'N/A', icon: Droplets, color: 'text-[#C78A28]' },
    { label: 'Added Sugars', value: (nutritionalData?.addedSugarG != null) ? `${nutritionalData.addedSugarG} g` : '0 g', icon: Droplets, color: 'text-[#B94A48]' },
    { label: 'Total Fat', value: (nutritionalData?.fatG != null) ? `${nutritionalData.fatG} g` : 'N/A', icon: Droplets, color: 'text-[#17231C]' },
    { label: 'Saturated Fat', value: (nutritionalData?.saturatedFatG != null) ? `${nutritionalData.saturatedFatG} g` : 'N/A', icon: Droplets, color: 'text-[#B94A48]' },
    { label: 'Sodium', value: (nutritionalData?.sodiumMg != null) ? `${nutritionalData.sodiumMg} mg` : 'N/A', icon: Droplets, color: 'text-[#C78A28]' },
    { label: 'Dietary Fibre', value: (nutritionalData?.dietaryFibreG != null) ? `${nutritionalData.dietaryFibreG} g` : 'N/A', icon: Wheat, color: 'text-[#2E6847]' },
  ];

  return (
    <div className="space-y-6">
      {/* Nutrients Grid */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#123C2A]/10">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#17231C]">
              Nutritional Facts Declaration
            </h3>
            <p className="text-xs text-[#68736B]">
              Basis: {nutritionalData.servingSize || 'Per 100g / 100ml'}
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E9E8DC] text-[#123C2A] px-2.5 py-1 rounded-md">
            Extracted via OCR
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {nutrients.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border border-[#123C2A]/10 space-y-1 shadow-xs"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#68736B]">
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <p className="text-base sm:text-lg font-extrabold text-[#17231C]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ingredients List */}
      {ingredientsRaw && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-[#17231C] flex items-center gap-2">
            <Wheat className="w-4 h-4 text-[#2E6847]" />
            Declared Ingredients
          </h3>
          <p className="text-xs text-[#17231C] leading-relaxed bg-[#FAF9F5] p-4 rounded-2xl border border-[#123C2A]/10 font-mono">
            {ingredientsRaw}
          </p>
        </div>
      )}
    </div>
  );
}
