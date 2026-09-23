import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { 
  ScanLine, 
  ShieldCheck, 
  HeartPulse, 
  Sparkles, 
  CheckCircle2, 
  UtensilsCrossed 
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-16 pb-12 sm:pb-20 border-b border-[#123C2A]/10 subtle-grain" aria-labelledby="hero-heading">
        <ResponsiveContainer>
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCE8D8] border border-[#2E6847]/30 text-[#123C2A] text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2E6847]" aria-hidden="true" />
              <span>Intelligent Food Packaging Compliance & Health Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 id="hero-heading" className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#17231C] tracking-tight leading-[1.15]">
              Scan. Verify. <br className="hidden sm:inline" />
              <span className="text-[#123C2A]">Understand.</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#47544C] max-w-2xl mx-auto leading-relaxed">
              Analyze food packaging and labels using intelligent multi-image scanning, OCR extraction, preliminary regulatory compliance checks (FSS Act 2006, Legal Metrology), and transparent A+ to F nutritional health grading.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link to="/scanner" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  icon={ScanLine}
                  className="w-full sm:w-auto font-extrabold px-8 shadow-md"
                >
                  Scan a Food Product
                </Button>
              </Link>
              <Link to="/compliance-analysis" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  icon={ShieldCheck}
                  className="w-full sm:w-auto font-bold px-7"
                >
                  Compliance Framework
                </Button>
              </Link>
            </div>

            {/* Key Capability Highlights / Feature Cards */}
            <div className="pt-6 sm:pt-8 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 lg:gap-4 max-w-3xl mx-auto w-full text-left">
              {[
                { 
                  label: 'Food-Only Classifier', 
                  desc: 'Automatic non-food gating',
                },
                { 
                  label: 'Multi-View OCR', 
                  desc: 'Front & back packaging views',
                },
                { 
                  label: 'FSS Act 2006', 
                  desc: 'Category-aware rules',
                },
                { 
                  label: 'A+ to F Grading', 
                  desc: 'Nutrient quality index',
                },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3.5 px-4.5 py-3.5 sm:px-5 sm:py-4 rounded-2xl bg-[#EAEFE9] border border-[#2E6847]/20 shadow-xs transition-all duration-200 hover:border-[#2E6847]/40 hover:bg-[#E4ECE3]"
                >
                  <Sparkles className="w-5 h-5 text-[#123C2A] shrink-0" aria-hidden="true" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm sm:text-base font-bold text-[#123C2A] tracking-tight leading-tight">
                      {item.label}
                    </span>
                    <span className="text-xs sm:text-[13px] text-[#47544C] mt-0.5 leading-snug">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="scroll-mt-20" aria-labelledby="workflow-heading">
        <ResponsiveContainer>
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E6847]">
              Step-by-Step Workflow
            </span>
            <h2 id="workflow-heading" className="text-2xl sm:text-3xl font-extrabold text-[#17231C]">
              How LabelSure Operates
            </h2>
            <p className="text-xs sm:text-sm text-[#47544C]">
              From raw packaging snapshots to comprehensive compliance auditing and nutritional profiling in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#DCE8D8] text-[#123C2A] font-black text-lg flex items-center justify-center">
                01
              </div>
              <h3 className="text-base font-bold text-[#17231C]">
                Upload Packaging Views
              </h3>
              <p className="text-xs sm:text-sm text-[#47544C] leading-relaxed">
                Capture or upload packaging photos: front display, back regulatory panel, ingredients list, and nutritional facts.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E9E8DC] text-[#123C2A] font-black text-lg flex items-center justify-center">
                02
              </div>
              <h3 className="text-base font-bold text-[#17231C]">
                Automated OCR & Field Parsing
              </h3>
              <p className="text-xs sm:text-sm text-[#47544C] leading-relaxed">
                Optical text extraction parses FSSAI numbers, Veg/Non-Veg indicators, Net Quantity, Ingredients, and nutritional tables.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#123C2A] text-[#F5F3EA] font-black text-lg flex items-center justify-center">
                03
              </div>
              <h3 className="text-base font-bold text-[#17231C]">
                Compliance & Health Audit
              </h3>
              <p className="text-xs sm:text-sm text-[#47544C] leading-relaxed">
                Inspect statutory findings (FSS Act 2006, Legal Metrology) alongside an independent A+ to F nutritional grade with exportable PDF reports.
              </p>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* Food-Only Platform & Safety Notice */}
      <section className="bg-[#FAF9F5] py-12 border-y border-[#123C2A]/10" aria-labelledby="food-safety-heading">
        <ResponsiveContainer>
          <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-[#123C2A]/15 shadow-medium flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FBEBEB] text-[#B94A48] flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-2 text-center md:text-left flex-1">
              <h2 id="food-safety-heading" className="text-base sm:text-lg font-bold text-[#17231C]">
                Dedicated Exclusively to Packaged Food Products
              </h2>
              <p className="text-xs sm:text-sm text-[#47544C] leading-relaxed">
                LabelSure incorporates an intelligent classifier that filters out non-food items (cosmetics, electronics, cleaners, pharmaceuticals). Non-food items immediately halt food compliance checks with clear explanatory guidance.
              </p>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* Dual Analysis Pillars */}
      <section id="compliance-framework" aria-labelledby="pillars-heading">
        <ResponsiveContainer>
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 id="pillars-heading" className="text-2xl sm:text-3xl font-extrabold text-[#17231C]">
              Statutory Compliance & Nutritional Standards
            </h2>
            <p className="text-xs sm:text-sm text-[#47544C]">
              Two independent intelligence engines powering your product evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pillar 1 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#DCE8D8] text-[#123C2A]">
                  <ShieldCheck className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#17231C]">
                    Statutory Regulatory Compliance
                  </h3>
                  <p className="text-xs text-[#47544C]">
                    Food Safety and Standards Act, 2006 & Legal Metrology Rules, 2011
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[#17231C]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#26693E] shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong>Category-Dependent FSSAI Rules:</strong> Accounts for artisanal/raw exemptions vs mandatory 14-digit licenses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#26693E] shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong>Nuanced Status Tracking:</strong> Compliant, Requires Review, and Not Applicable.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#26693E] shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong>Verified OCR Protocol:</strong> Inspects physical container declarations directly.</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div id="health-grading" className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#E9E8DC] text-[#123C2A]">
                  <HeartPulse className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#17231C]">
                    A+ to F Nutritional Health Grading
                  </h3>
                  <p className="text-xs text-[#47544C]">
                    Independent dietary quality profiling
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[#17231C]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#26693E] shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong>Decoupled from Legal Checks:</strong> Compliance and health quality are scored independently.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#26693E] shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong>Transparent Scoring:</strong> Penalizes added sugars, saturated fats, sodium; rewards protein & dietary fibre.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#26693E] shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong>Missing Data Safeguard:</strong> Does not invent zeroes; displays informative guidance if labels are absent.</span>
                </li>
              </ul>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* CTA Banner */}
      <section aria-labelledby="cta-heading">
        <ResponsiveContainer>
          <div className="p-8 sm:p-12 rounded-3xl bg-[#123C2A] text-[#F5F3EA] shadow-xl text-center space-y-6 max-w-4xl mx-auto">
            <h2 id="cta-heading" className="text-2xl sm:text-4xl font-black tracking-tight">
              Start Auditing Food Packaging Today
            </h2>
            <p className="text-xs sm:text-sm text-[#DCE8D8]/90 max-w-xl mx-auto leading-relaxed">
              Scan food packaging, verify mandatory statutory declarations, and maintain your 12-month compliance scan history.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/scanner">
                <Button size="lg" variant="secondary" icon={ScanLine} className="font-extrabold px-8 shadow-md">
                  Start Packaging Scan
                </Button>
              </Link>
              <Link to="/health-analysis">
                <Button size="lg" variant="outline" className="text-[#F5F3EA] border-[#DCE8D8] hover:bg-white/10 px-8">
                  Nutritional Health Index
                </Button>
              </Link>
            </div>
          </div>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
