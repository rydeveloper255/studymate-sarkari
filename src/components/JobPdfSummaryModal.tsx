import React from 'react';
import { JobItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface JobPdfSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobItem;
}

export const JobPdfSummaryModal: React.FC<JobPdfSummaryModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const applyUrl = job.links?.applyOnline || window.location.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    applyUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white text-[#0b1c30] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto border border-slate-200 print:max-w-none print:m-0 print:p-4 print:shadow-none print:rounded-none">
        {/* Top Control Bar (Hidden during Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-[#00236f]">
              picture_as_pdf
            </span>
            <div>
              <h3 className="font-display font-extrabold text-base text-[#00236f]">
                {language === 'hi' ? '1-पेज आधिकारिक संक्षिप्त विज्ञप्ति' : '1-Page Official Short Notification Summary'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'hi' ? 'प्रिंट करें या PDF के रूप में सहेजें' : 'Ready for A4 Printing & Offline Study Archive'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#00236f] hover:bg-[#00174c] text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>{language === 'hi' ? 'प्रिंट / PDF सेव करें' : 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* ================= Printable A4 Sheet Content ================= */}
        <div className="border-2 border-slate-800 p-6 rounded-2xl bg-white space-y-5 text-slate-900 font-sans">
          {/* Official Letterhead */}
          <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                GOVERNMENT OF INDIA &bull; STATE RECRUITMENT NOTICE
              </span>
            </div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900 uppercase tracking-tight">
              {job.department}
            </h1>
            <p className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">
              {job.title}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-slate-600 pt-1">
              <span>Notification No: <strong>{job.id.toUpperCase()}/2025</strong></span>
              <span>&bull;</span>
              <span>State/Region: <strong>{job.state}</strong></span>
              <span>&bull;</span>
              <span>Total Vacancies: <strong className="text-emerald-800">{job.vacanciesFormatted} Posts</strong></span>
            </div>
          </div>

          {/* 2-Column Grid: Dates & Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Important Dates */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
              <h4 className="font-extrabold text-blue-900 uppercase tracking-wide text-[11px] flex items-center gap-1 border-b border-slate-300 pb-1">
                <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                Important Application Dates
              </h4>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Apply Start Date:</span>
                  <span className="font-bold">{job.dates?.applicationStart || 'Refer Notification'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Last Date to Apply:</span>
                  <span className="font-black text-red-700">{job.lastDate.split('(')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Exam Date / Shift:</span>
                  <span className="font-bold text-blue-900">{job.dates?.examDate || 'Check Schedule'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Admit Card:</span>
                  <span className="font-bold text-emerald-800">10 Days Before Exam</span>
                </div>
              </div>
            </div>

            {/* Application Fee */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
              <h4 className="font-extrabold text-blue-900 uppercase tracking-wide text-[11px] flex items-center gap-1 border-b border-slate-300 pb-1">
                <span className="material-symbols-outlined text-[15px]">payments</span>
                Application Fee Matrix
              </h4>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">General / OBC / EWS:</span>
                  <span className="font-bold">{job.applicationFee?.general || '₹100/-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">SC / ST / PwD:</span>
                  <span className="font-bold text-emerald-700">{job.applicationFee?.scSt || '₹0/- (Exempted)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">All Female Candidates:</span>
                  <span className="font-bold text-emerald-700">₹0/- (Fee Exempted)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Mode:</span>
                  <span className="font-bold">Online UPI / NetBanking / Challan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Age Criteria & Pay Scale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1.5">
              <h4 className="font-extrabold text-blue-900 uppercase tracking-wide text-[11px] flex items-center gap-1 border-b border-slate-300 pb-1">
                <span className="material-symbols-outlined text-[15px]">cake</span>
                Age Limit &amp; Relaxation
              </h4>
              <p className="text-[11px] text-slate-700 font-medium">
                {job.ageLimitSummary || '18 to 30 Years (As per Commission Rules)'}
              </p>
              <div className="text-[10px] text-slate-600 flex flex-wrap gap-2 pt-1 font-semibold">
                <span className="bg-slate-200 px-1.5 py-0.5 rounded">OBC: +3 Yrs</span>
                <span className="bg-slate-200 px-1.5 py-0.5 rounded">SC/ST: +5 Yrs</span>
                <span className="bg-slate-200 px-1.5 py-0.5 rounded">PwD: +10 Yrs</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1.5">
              <h4 className="font-extrabold text-blue-900 uppercase tracking-wide text-[11px] flex items-center gap-1 border-b border-slate-300 pb-1">
                <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span>
                Salary &amp; Pay Commission
              </h4>
              <p className="text-sm font-black text-slate-900">
                {job.payLevel}
              </p>
              <p className="text-[10px] text-slate-600">
                Includes DA (50%+), HRA, Transport Allowance, CGHS/Medical benefits as per 7th CPC.
              </p>
            </div>
          </div>

          {/* Educational Qualification Section */}
          <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1.5 text-xs">
            <h4 className="font-extrabold text-blue-900 uppercase tracking-wide text-[11px] flex items-center gap-1 border-b border-slate-300 pb-1">
              <span className="material-symbols-outlined text-[15px]">school</span>
              Essential Educational Qualification
            </h4>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              {job.qualificationSummary || 'Bachelor Degree in Any Stream from a Recognized University in India.'}
            </p>
          </div>

          {/* Direct Apply Verification Box with QR Code */}
          <div className="p-4 rounded-xl border-2 border-dashed border-slate-400 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="bg-emerald-700 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
                Direct Official Link
              </span>
              <p className="font-bold text-slate-900 text-xs">
                Scan QR Code with your Smartphone to Open Apply Portal Directly
              </p>
              <p className="text-[11px] text-blue-800 break-all font-mono">
                {applyUrl}
              </p>
              <p className="text-[10px] text-slate-500">
                Verified by StudyMate Sarkari • Official Government Recruitment Gateway
              </p>
            </div>

            <div className="flex flex-col items-center flex-shrink-0 bg-white p-2 rounded-xl border border-slate-300">
              <img
                src={qrUrl}
                alt="QR Code for Online Apply Link"
                className="w-24 h-24 object-contain"
              />
              <span className="text-[9px] font-bold text-slate-600 mt-1 uppercase">Scan to Apply</span>
            </div>
          </div>

          {/* Footer Warning & Disclaimer */}
          <div className="text-center pt-2 text-[9px] text-slate-500 border-t border-slate-200">
            DISCLAIMER: Candidates are strictly advised to cross-verify all details from the official recruitment gazette notification before final form submission. Generated via StudyMate Sarkari.
          </div>
        </div>
      </div>
    </div>
  );
};
