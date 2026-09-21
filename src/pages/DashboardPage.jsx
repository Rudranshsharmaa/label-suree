import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { 
  ScanLine, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  History, 
  ArrowRight, 
  Sparkles, 
  FileText,
  Calendar,
  Layers
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      try {
        setLoading(true);
        const userScans = await api.scans.getUserScans(user.id);
        setScans(userScans);
      } catch (err) {
        console.error('Failed to load user scans:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  const compliantCount = scans.filter(s => s.compliance_status === 'COMPLIANT').length;
  const reviewCount = scans.filter(s => s.compliance_status === 'REQUIRES REVIEW').length;
  const nonCompliantCount = scans.filter(s => s.compliance_status === 'NON-COMPLIANT').length;

  const recentScans = scans.slice(0, 4);

  return (
    <div className="py-8 sm:py-10 space-y-8">
      <ResponsiveContainer>
        {/* Welcome & Primary CTA Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#123C2A] text-[#F5F3EA] shadow-medium flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#DCE8D8]">
              Compliance Operations Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.fullName || 'Auditor'}
            </h1>
            <p className="text-xs sm:text-sm text-[#DCE8D8]/80 max-w-xl">
              Upload multi-view packaging images to detect statutory declarations, verify FSS Act & Legal Metrology rules, and generate health grades.
            </p>
          </div>

          <Link to="/scanner" className="w-full md:w-auto shrink-0">
            <Button
              size="lg"
              variant="secondary"
              icon={ScanLine}
              className="w-full md:w-auto font-black px-8 shadow-md hover:bg-[#FAF9F5]"
            >
              Start New Scan
            </Button>
          </Link>
        </div>

        {/* 12-Month Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mt-6">
          {/* Total Scans */}
          <div className="p-5 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-[#68736B]">
              <span className="text-xs font-bold uppercase tracking-wider">Total Scans (12M)</span>
              <Layers className="w-4 h-4 text-[#123C2A]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#17231C]">
              {loading ? '...' : scans.length}
            </p>
            <p className="text-[11px] text-[#68736B]">Dynamic 12-month rolling window</p>
          </div>

          {/* Compliant */}
          <div className="p-5 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-[#68736B]">
              <span className="text-xs font-bold uppercase tracking-wider">Compliant</span>
              <ShieldCheck className="w-4 h-4 text-[#347A4D]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#347A4D]">
              {loading ? '...' : compliantCount}
            </p>
            <p className="text-[11px] text-[#347A4D] font-medium">All mandatory declarations present</p>
          </div>

          {/* Requires Review */}
          <div className="p-5 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-[#68736B]">
              <span className="text-xs font-bold uppercase tracking-wider">Requires Review</span>
              <AlertTriangle className="w-4 h-4 text-[#C78A28]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#C78A28]">
              {loading ? '...' : reviewCount}
            </p>
            <p className="text-[11px] text-[#C78A28] font-medium">Ambiguous or blurry labels</p>
          </div>

          {/* Non-Compliant */}
          <div className="p-5 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-1">
            <div className="flex items-center justify-between text-[#68736B]">
              <span className="text-xs font-bold uppercase tracking-wider">Non-Compliant</span>
              <XCircle className="w-4 h-4 text-[#B94A48]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#B94A48]">
              {loading ? '...' : nonCompliantCount}
            </p>
            <p className="text-[11px] text-[#B94A48] font-medium">Confirmed missing declarations</p>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#17231C] flex items-center gap-2">
                <History className="w-5 h-5 text-[#123C2A]" />
                Recent Packaging Audits
              </h2>
              <p className="text-xs text-[#68736B]">
                Your latest scanned food products and preliminary reports.
              </p>
            </div>

            <Link
              to="/history"
              className="text-xs font-bold text-[#123C2A] hover:underline flex items-center gap-1"
            >
              <span>View All 12-Month History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft">
              <LoadingSkeleton lines={4} />
            </div>
          ) : recentScans.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-[#123C2A]/20 space-y-3">
              <ScanLine className="w-10 h-10 text-[#68736B] mx-auto" />
              <h3 className="text-base font-bold text-[#17231C]">No Scans Recorded Yet</h3>
              <p className="text-xs text-[#68736B] max-w-sm mx-auto">
                Scan your first food packaging to view preliminary regulatory checks and health grades.
              </p>
              <Link to="/scanner" className="inline-block pt-2">
                <Button size="sm" variant="primary" icon={ScanLine}>
                  Start First Scan
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentScans.map((scan) => (
                <div
                  key={scan.scan_id}
                  className="p-5 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft hover:shadow-card transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#68736B] block">
                        {scan.scan_id} • {scan.scan_date}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#17231C] line-clamp-1">
                        {scan.product_name}
                      </h3>
                      <p className="text-xs text-[#68736B] line-clamp-1">
                        {scan.brand || scan.product_category}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={scan.compliance_status} size="sm" />
                      {scan.health_rating && (
                        <StatusBadge status={scan.health_rating} size="sm" />
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#123C2A]/10 flex items-center justify-between">
                    <span className="text-[11px] text-[#68736B] font-medium">
                      {scan.uploaded_images?.length || 1} packaging {(scan.uploaded_images?.length || 1) === 1 ? 'view' : 'views'}
                    </span>
                    <Link
                      to={`/reports/${scan.scan_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF9F5] hover:bg-[#E9E8DC] text-[#123C2A] text-xs font-bold transition-colors border border-[#123C2A]/15"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open Report</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </div>
  );
}
