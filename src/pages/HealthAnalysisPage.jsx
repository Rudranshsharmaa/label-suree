import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, isFoodClassification } from '../services/api';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { HealthRatingCard } from '../components/health/HealthRatingCard';
import { NutrientBreakdown } from '../components/health/NutrientBreakdown';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Button } from '../components/common/Button';
import { 
  HeartPulse, 
  ScanLine, 
  ChevronRight, 
  Sparkles, 
  Info,
  BookOpen
} from 'lucide-react';

export function HealthAnalysisPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealthData() {
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
        console.error('Failed to load health data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHealthData();
  }, [user]);

  const activeScan = scans.find(s => s.scan_id === selectedScanId);

  return (
    <div className="py-8 sm:py-10 space-y-8">
      <ResponsiveContainer>
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E6847]">
              Nutritional Quality Intelligence
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#17231C] flex items-center gap-2">
              <HeartPulse className="w-7 h-7 text-[#123C2A]" />
              Nutritional Health Analysis
            </h1>
            <p className="text-xs sm:text-sm text-[#68736B]">
              Transparent A+ to F health profiling assessing sugars, saturated fats, sodium, calories, and dietary fibre.
            </p>
          </div>

          <Link to="/scanner" className="shrink-0">
            <Button size="md" variant="primary" icon={ScanLine} className="font-bold shadow-xs">
              Scan Package Product
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft">
            <LoadingSkeleton lines={5} />
          </div>
        ) : scans.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-[#123C2A]/20 space-y-3">
            <HeartPulse className="w-10 h-10 text-[#68736B] mx-auto" />
            <h3 className="text-base font-bold text-[#17231C]">No Scanned Foods Available</h3>
            <p className="text-xs text-[#68736B] max-w-sm mx-auto">
              Scan food packaging with a nutrition table to compute its A+ to F health grade.
            </p>
            <Link to="/scanner" className="inline-block pt-2">
              <Button size="sm" variant="primary">Start Food Scan</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product Selector */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#123C2A]/15 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label htmlFor="health-scan-selector" className="text-xs font-bold text-[#17231C]">
                  Select Food Product:
                </label>
                <p className="text-[11px] text-[#68736B]">
                  Analyzing {activeScan?.product_name} ({activeScan?.scan_id})
                </p>
              </div>

              <select
                id="health-scan-selector"
                value={selectedScanId || ''}
                onChange={(e) => setSelectedScanId(e.target.value)}
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#123C2A]/20 bg-[#FAF9F5] text-[#17231C] focus:ring-2 focus:ring-[#123C2A] focus:outline-none"
              >
                {scans.map((s) => (
                  <option key={s.scan_id} value={s.scan_id}>
                    {s.product_name} ({s.health_rating ? `Grade ${s.health_rating}` : 'Grade N/A'})
                  </option>
                ))}
              </select>
            </div>

            {/* Health Grade Hero Card */}
            {activeScan && <HealthRatingCard scan={activeScan} />}

            {/* Nutritional Facts Grid */}
            {activeScan && (
              <NutrientBreakdown
                nutritionalData={activeScan.extracted_fields?.nutritionalData}
                ingredientsRaw={activeScan.extracted_fields?.ingredientsRaw}
              />
            )}

            {/* Methodology Documentation Section */}
            <div className="p-6 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#123C2A]" />
                <h3 className="text-base font-bold text-[#17231C]">
                  Documented Grading Methodology
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#17231C]/90 leading-relaxed">
                <div className="p-4 rounded-2xl bg-white border border-[#123C2A]/10 space-y-2">
                  <h4 className="font-bold text-[#B94A48]">Negative Nutritional Penalties:</h4>
                  <ul className="list-disc list-inside space-y-1 text-[#68736B]">
                    <li><strong>Added Sugars & Total Sugars:</strong> Penalized when exceeding 12.5g / 25g per 100g.</li>
                    <li><strong>Saturated Fats:</strong> Penalized when exceeding 4g / 10g per 100g.</li>
                    <li><strong>Sodium / Salt:</strong> Penalized when exceeding 400mg / 900mg per 100g.</li>
                    <li><strong>High Energy Density:</strong> Penalized when exceeding 450 kcal per 100g.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#123C2A]/10 space-y-2">
                  <h4 className="font-bold text-[#347A4D]">Positive Nutrient Rewards:</h4>
                  <ul className="list-disc list-inside space-y-1 text-[#68736B]">
                    <li><strong>Protein:</strong> Rewarded when protein content is ≥ 5g / 10g per 100g.</li>
                    <li><strong>Dietary Fibre:</strong> Rewarded when dietary fibre is ≥ 3g / 6g per 100g.</li>
                    <li><strong>Whole Food Ingredients:</strong> Minimal processing preservation.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
}
