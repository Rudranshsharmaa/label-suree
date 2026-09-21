import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { FileText, ArrowRight, Package } from 'lucide-react';

export function HistoryTable({ scans = [] }) {
  if (scans.length === 0) return null;

  return (
    <div className="hidden lg:block overflow-hidden rounded-3xl border border-[#123C2A]/15 bg-white shadow-soft">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#FAF9F5] border-b border-[#123C2A]/10 text-[11px] font-bold uppercase tracking-wider text-[#68736B]">
            <th className="py-3.5 px-5">Product & Packaging</th>
            <th className="py-3.5 px-4">Scan Date & ID</th>
            <th className="py-3.5 px-4">Classification</th>
            <th className="py-3.5 px-4">Compliance Status</th>
            <th className="py-3.5 px-4">Health Grade</th>
            <th className="py-3.5 px-5 text-right">Report</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#123C2A]/10 text-xs">
          {scans.map((scan) => {
            const hasThumbnail = !!scan.thumbnail;

            return (
              <tr key={scan.scan_id} className="hover:bg-[#FAF9F5]/70 transition-colors">
                {/* Product Name & Brand */}
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#FAF9F5] border border-[#123C2A]/10 overflow-hidden flex items-center justify-center shrink-0">
                      {hasThumbnail ? (
                        <img src={scan.thumbnail} alt={scan.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-[#68736B]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#17231C] line-clamp-1 max-w-xs">
                        {scan.product_name}
                      </h4>
                      <p className="text-[11px] text-[#68736B] line-clamp-1">
                        {scan.brand || scan.product_category || 'Packaged Product'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Scan Date & ID */}
                <td className="py-4 px-4">
                  <span className="font-bold text-[#17231C] block">
                    {scan.scan_date}
                  </span>
                  <span className="text-[10px] font-mono text-[#68736B]">
                    {scan.scan_id}
                  </span>
                </td>

                {/* Food Classification */}
                <td className="py-4 px-4">
                  <StatusBadge status={scan.food_classification} size="sm" />
                </td>

                {/* Compliance Status */}
                <td className="py-4 px-4">
                  <StatusBadge status={scan.compliance_status} size="sm" />
                </td>

                {/* Health Grade */}
                <td className="py-4 px-4">
                  {scan.health_rating ? (
                    <StatusBadge status={scan.health_rating} size="sm" />
                  ) : (
                    <span className="text-[11px] text-[#68736B] italic">N/A</span>
                  )}
                </td>

                {/* Action Link */}
                <td className="py-4 px-5 text-right">
                  <Link
                    to={`/reports/${scan.scan_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#123C2A] text-[#F5F3EA] text-xs font-bold hover:bg-[#0B291D] transition-colors shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Report</span>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
