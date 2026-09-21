import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { HistoryFilters } from '../components/history/HistoryFilters';
import { HistoryTable } from '../components/history/HistoryTable';
import { HistoryCardList } from '../components/history/HistoryCardList';
import { LoadingSkeleton, EmptyState } from '../components/common/LoadingSkeleton';
import { Button } from '../components/common/Button';
import { History, ScanLine, Filter } from 'lucide-react';

export function HistoryPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    complianceStatus: 'ALL',
    foodClassification: 'ALL',
    healthGrade: 'ALL',
  });

  const loadScans = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.scans.getUserScans(user.id, filters);
      setScans(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, [user, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      complianceStatus: 'ALL',
      foodClassification: 'ALL',
      healthGrade: 'ALL',
    });
  };

  return (
    <div className="py-8 sm:py-10 space-y-8">
      <ResponsiveContainer>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E6847]">
              User-Specific Auditing Records
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#17231C] flex items-center gap-2">
              <History className="w-7 h-7 text-[#123C2A]" />
              12-Month Scan History
            </h1>
            <p className="text-xs sm:text-sm text-[#68736B]">
              Rolling 12-month archive of your food packaging scans, preliminary compliance reports, and health grades.
            </p>
          </div>

          <Link to="/scanner" className="shrink-0">
            <Button size="md" variant="primary" icon={ScanLine} className="font-bold shadow-xs">
              Start New Scan
            </Button>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <HistoryFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Results List */}
        {loading ? (
          <div className="p-8 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft">
            <LoadingSkeleton lines={6} />
          </div>
        ) : scans.length === 0 ? (
          <EmptyState
            title="No Scans Found"
            description="No scan records match your active search terms or filter criteria."
            actionText="Reset Filter Options"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#68736B] px-1 font-semibold">
              <span>Showing {scans.length} {scans.length === 1 ? 'record' : 'records'}</span>
              <span>Sorted: Newest to Oldest</span>
            </div>

            {/* Desktop Table */}
            <HistoryTable scans={scans} />

            {/* Mobile Cards */}
            <HistoryCardList scans={scans} />
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
}
