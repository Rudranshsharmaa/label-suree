import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { FileText, Calendar, Package } from 'lucide-react';

export function HistoryCardList({ scans = [] }) {
  if (scans.length === 0) return null;

  return (
    <div className="lg:hidden space-y-3">
      {scans.map((scan) => {
        const hasThumbnail = !!scan.thumbnail;

        return (
          <div
            key={scan.scan_id}
            className="p-4 sm:p-5 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-3.5"
          >
            {/* Top Row: Thumbnail + Product Details */}
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] border border-[#123C2A]/10 overflow-hidden flex items-center justify-center shrink-0">
                {hasThumbnail ? (
                  <img src={scan.thumbnail} alt={scan.product_name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-[#68736B]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono font-semibold text-[#68736B]">
                    {scan.scan_id}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-[#68736B]">
                    <Calendar className="w-3 h-3 text-[#2E6847]" />
                    <span>{scan.scan_date}</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-[#17231C] truncate mt-0.5">
                  {scan.product_name}
                </h4>
                <p className="text-xs text-[#68736B] truncate">
                  {scan.brand || scan.product_category || 'Packaged Product'}
                </p>
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#123C2A]/10">
              <StatusBadge status={scan.food_classification} size="sm" />
              <StatusBadge status={scan.compliance_status} size="sm" />
              {scan.health_rating && (
                <StatusBadge status={scan.health_rating} size="sm" />
              )}
            </div>

            {/* Action Button */}
            <div className="pt-1">
              <Link
                to={`/reports/${scan.scan_id}`}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#123C2A] text-[#F5F3EA] text-xs font-bold hover:bg-[#0B291D] transition-colors shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Compliance Report</span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
