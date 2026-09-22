import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, isFoodClassification } from '../services/api';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ComplianceCard } from '../components/compliance/ComplianceCard';
import { FindingsTable } from '../components/compliance/FindingsTable';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Button } from '../components/common/Button';
import { 
  ShieldCheck, 
  ScanLine, 
  FileText, 
  ChevronRight, 
  Info,
  Scale
} from 'lucide-react';

export function CompliancePage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const userScans = await api.scans.getUserScans(user.id);
        const foodScans = userScans.filter(s => isFoodClassification(s.food_classification));
        setScans(foodScans);
        if (foodScans.length > 0) {
          setSelectedScanId(foodScans[0].scan_id);
        }
      } catch (err) {
        console.error('Failed to load compliance data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const activeScan = scans.find(s => s.scan_id === selectedScanId);

  return (
    <div className="py-8 sm:py-10 space-y-8">
      <ResponsiveContainer>
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E6847]">
              Regulatory Standard Audits
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#17231C] flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-[#123C2A]" />
              Compliance Analysis
            </h1>
            <p className="text-xs sm:text-sm text-[#68736B]">
              Detailed verification against Food Safety and Standards Act, 2006 and Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>
          </div>

          <Link to="/scanner" className="shrink-0">
            <Button size="md" variant="primary" icon={ScanLine} className="font-bold shadow-xs">
              Audit New Product
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft">
            <LoadingSkeleton lines={5} />
          </div>
        ) : scans.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-[#123C2A]/20 space-y-3">
            <ShieldCheck className="w-10 h-10 text-[#68736B] mx-auto" />
            <h3 className="text-base font-bold text-[#17231C]">No Food Scans to Audit</h3>
            <p className="text-xs text-[#68736B] max-w-sm mx-auto">
              Scan a food package to view detailed statutory rule assessments.
            </p>
            <Link to="/scanner" className="inline-block pt-2">
              <Button size="sm" variant="primary">Scan Food Product</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product Selector Dropdown */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#123C2A]/15 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label htmlFor="scan-selector" className="text-xs font-bold text-[#17231C]">
                  Select Scanned Product:
                </label>
                <p className="text-[11px] text-[#68736B]">
                  Viewing audit for {activeScan?.product_name} ({activeScan?.scan_id})
                </p>
              </div>

              <select
                id="scan-selector"
                value={selectedScanId || ''}
                onChange={(e) => setSelectedScanId(e.target.value)}
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#123C2A]/20 bg-[#FAF9F5] text-[#17231C] focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
              >
                {scans.map((s) => (
                  <option key={s.scan_id} value={s.scan_id}>
                    {s.product_name} ({s.scan_date} - {s.compliance_status})
                  </option>
                ))}
              </select>
            </div>

            {/* Compliance Overview Card */}
            {activeScan && <ComplianceCard scan={activeScan} />}

            {/* Detailed Findings Table */}
            {activeScan && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#17231C] flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#123C2A]" />
                    Applicable Statutory Declaration Checks
                  </h3>
                  <Link
                    to={`/reports/${activeScan.scan_id}`}
                    className="text-xs font-bold text-[#123C2A] hover:underline flex items-center gap-1"
                  >
                    <span>Full Audit Report</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <FindingsTable
                  findings={activeScan.compliance_findings}
                  regulatoryFramework={activeScan.regulatory_framework}
                />
              </div>
            )}
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
}
