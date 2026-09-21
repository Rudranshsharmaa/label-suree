import React from 'react';
import { Search, Filter, Calendar, RotateCcw } from 'lucide-react';

export function HistoryFilters({ filters, onFilterChange, onReset }) {
  // Dynamically calculate 12-month start and end dates
  const today = new Date();
  const pastYear = new Date();
  pastYear.setFullYear(today.getFullYear() - 1);

  const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-4">
      {/* Search and Date Range Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68736B]" />
          <input
            type="text"
            placeholder="Search scans by product name, brand, or scan ID..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#123C2A]/20 bg-white text-[#17231C] placeholder:text-[#68736B]/60 focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E9E8DC] text-[#123C2A] text-xs font-semibold shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#2E6847]" />
          <span>Dynamic 12M: {formatDate(pastYear)} – {formatDate(today)}</span>
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#123C2A]/10">
        {/* Compliance Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#68736B] uppercase tracking-wider">
            Compliance Status
          </label>
          <select
            value={filters.complianceStatus}
            onChange={(e) => onFilterChange('complianceStatus', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#123C2A]/20 bg-white text-[#17231C] focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
          >
            <option value="ALL">All Compliance Statuses</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="REQUIRES REVIEW">Requires Review</option>
            <option value="NON-COMPLIANT">Non-Compliant</option>
            <option value="NOT APPLICABLE">Not Applicable / Exempt</option>
          </select>
        </div>

        {/* Food Classification */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#68736B] uppercase tracking-wider">
            Product Classification
          </label>
          <select
            value={filters.foodClassification}
            onChange={(e) => onFilterChange('foodClassification', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#123C2A]/20 bg-white text-[#17231C] focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
          >
            <option value="ALL">All Classifications</option>
            <option value="FOOD PRODUCT DETECTED">Food Product Only</option>
            <option value="NON-FOOD PRODUCT">Non-Food Products</option>
            <option value="UNCERTAIN — REQUIRES REVIEW">Uncertain / Review</option>
          </select>
        </div>

        {/* Health Grade */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#68736B] uppercase tracking-wider">
            Health Grade (A+ to F)
          </label>
          <div className="flex items-center gap-2">
            <select
              value={filters.healthGrade}
              onChange={(e) => onFilterChange('healthGrade', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#123C2A]/20 bg-white text-[#17231C] focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
            >
              <option value="ALL">All Health Grades</option>
              <option value="A+">Grade A+</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
              <option value="E">Grade E</option>
              <option value="F">Grade F</option>
            </select>

            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-xl bg-[#E9E8DC] hover:bg-[#DCE8D8] text-[#123C2A] transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
