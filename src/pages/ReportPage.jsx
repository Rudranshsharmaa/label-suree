import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, isFoodClassification, getAnonymousSessionId } from '../services/api';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { StatusBadge } from '../components/common/StatusBadge';
import { ComplianceCard } from '../components/compliance/ComplianceCard';
import { FindingsTable } from '../components/compliance/FindingsTable';
import { HealthRatingCard } from '../components/health/HealthRatingCard';
import { NutrientBreakdown } from '../components/health/NutrientBreakdown';
import { PackagingGallery } from '../components/report/PackagingGallery';
import { OCRTranscriptViewer } from '../components/report/OCRTranscriptViewer';
import { LoadingSkeleton, ErrorState } from '../components/common/LoadingSkeleton';
import { Button } from '../components/common/Button';
import { 
  FileText, 
  Printer, 
  Download, 
  ArrowLeft, 
  Calendar, 
  ShieldCheck, 
  HeartPulse, 
  AlertTriangle
} from 'lucide-react';

export function ReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      const effectiveUserId = user?.id || getAnonymousSessionId();
      try {
        setLoading(true);
        setError(null);
        const data = await api.scans.getScanById(id, effectiveUserId);
        setScan(data);
      } catch (err) {
        setError(err.message || 'Unable to load report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id, user]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !scan) return;
    try {
      setExportingPdf(true);
      // Dynamic import of PDF generator libraries only on demand
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`LabelSure_Report_${scan.scan_id}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveContainer className="py-12">
        <div className="p-8 rounded-3xl bg-white border border-[#123C2A]/15 shadow-soft space-y-4">
          <LoadingSkeleton lines={8} />
        </div>
      </ResponsiveContainer>
    );
  }

  if (error || !scan) {
    return (
      <ResponsiveContainer className="py-12">
        <ErrorState
          title="Report Not Accessible"
          description={error || 'The requested scan record does not exist or belongs to another user.'}
          onRetry={() => navigate('/history')}
        />
      </ResponsiveContainer>
    );
  }

  const isFood = isFoodClassification(scan.food_classification);

  return (
    <div className="py-8 sm:py-10 space-y-8">
      <ResponsiveContainer>
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123C2A] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to 12-Month History</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={Printer}
              className="font-bold text-xs"
            >
              Print Audit
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={exportingPdf}
              onClick={handleDownloadPdf}
              icon={Download}
              className="font-bold text-xs shadow-xs"
            >
              Export PDF Report
            </Button>
          </div>
        </div>

        {/* Printable Report Document Container */}
        <div ref={reportRef} className="space-y-8 print:p-0">
          {/* Official Report Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-soft space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-[#123C2A]/10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#123C2A] text-[#F5F3EA]">
                    REPORT #{scan.report_id || scan.scan_id}
                  </span>
                  <StatusBadge status={scan.food_classification} size="sm" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#17231C]">
                  {scan.product_name}
                </h1>
                <p className="text-xs sm:text-sm text-[#47544C]">
                  Brand: <strong className="text-[#17231C]">{scan.brand || 'Packaged Label'}</strong> | Category: <strong className="text-[#17231C]">{scan.product_category}</strong>
                </p>
              </div>

              <div className="flex flex-col md:items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={scan.compliance_status} size="md" />
                  {scan.health_rating && (
                    <StatusBadge status={scan.health_rating} size="md" />
                  )}
                </div>

                <div className="text-[11px] text-[#47544C] space-y-0.5 md:text-right">
                  <p className="flex items-center md:justify-end gap-1 font-semibold text-[#17231C]">
                    <Calendar className="w-3.5 h-3.5 text-[#2E6847]" />
                    Audit Date: {scan.scan_date} ({scan.scan_time || '14:30'})
                  </p>
                  <p>Auditor: {user?.fullName || user?.full_name || 'Auditor'} ({user?.organization || 'Verified Reviewer'})</p>
                </div>
              </div>
            </div>

            {/* Statutory Disclaimer Alert */}
            <div className="p-4 rounded-2xl bg-[#E9E8DC]/70 border border-[#123C2A]/10 flex items-start gap-3 text-xs text-[#17231C]">
              <AlertTriangle className="w-4 h-4 text-[#A86F15] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-[#17231C]">
                <strong>Preliminary Compliance Assessment: </strong>
                This automated report is generated using optical character recognition (OCR) and rule-based verification against the Food Safety and Standards Act, 2006 and Legal Metrology Rules, 2011. It does not constitute official statutory inspection or legal approval.
              </p>
            </div>
          </div>

          {/* Uploaded Packaging Gallery */}
          <PackagingGallery images={scan.uploaded_images} />

          {/* Extracted Declarations and OCR Transcript */}
          <OCRTranscriptViewer
            extractedFields={scan.extracted_fields}
            ocrText={scan.ocr_text}
            qrData={scan.extracted_fields?.qrData}
          />

          {/* If Food Product: Render Full Compliance & Health Modules */}
          {isFood ? (
            <>
              {/* Compliance Section */}
              <div className="space-y-4 print-break-inside-avoid">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#123C2A]" />
                  <h2 className="text-lg font-bold text-[#17231C]">
                    Statutory Compliance Assessment
                  </h2>
                </div>

                <ComplianceCard scan={scan} />

                <FindingsTable
                  findings={scan.compliance_findings}
                  regulatoryFramework={scan.regulatory_framework}
                />
              </div>

              {/* Nutritional Health Section */}
              <div className="space-y-4 print-break-inside-avoid">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-[#123C2A]" />
                  <h2 className="text-lg font-bold text-[#17231C]">
                    Nutritional Health Profiling
                  </h2>
                </div>

                <HealthRatingCard scan={scan} />

                <NutrientBreakdown
                  nutritionalData={scan.extracted_fields?.nutritionalData}
                  ingredientsRaw={scan.extracted_fields?.ingredientsRaw}
                />
              </div>
            </>
          ) : (
            <div className="p-6 rounded-3xl bg-[#FBEBEB] border border-[#B94A48]/30 space-y-2 text-left">
              <h3 className="text-base font-bold text-[#B94A48]">
                Non-Food Item: Food Checks Omitted
              </h3>
              <p className="text-xs sm:text-sm text-[#17231C] leading-relaxed">
                This item was classified as a non-food product ({scan.product_category}). LabelSure evaluates statutory packaging compliance and health ratings strictly for human food commodities.
              </p>
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </div>
  );
}
