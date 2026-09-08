import React, { useState, useMemo } from 'react';
import { AdmitCardItem } from '../types';
import { RegionalPortalsModal } from './RegionalPortalsModal';
import { DirectPdfModal } from './DirectPdfModal';

export interface AdmitCardViewProps {
  admitCards: AdmitCardItem[];
  onNavigate: (tab: string, jobId?: string) => void;
}

export const AdmitCardView: React.FC<AdmitCardViewProps> = ({ admitCards, onNavigate }) => {
  const [selectedCommission, setSelectedCommission] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegionalModal, setActiveRegionalModal] = useState<{ isOpen: boolean; examName: string; type: 'ssc' | 'railways' }>({
    isOpen: false,
    examName: '',
    type: 'ssc',
  });
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    return admitCards.filter((card) => {
      const matchesSearch =
        !searchQuery.trim() ||
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.commission.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.examName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesComm =
        selectedCommission === 'all' || card.commissionCode === selectedCommission;
      const matchesMonth =
        selectedMonth === 'all' ||
        card.month.toLowerCase().includes(selectedMonth.toLowerCase()) ||
        card.examDateFormatted.toLowerCase().includes(selectedMonth.split('-')[0].toLowerCase());

      return matchesSearch && matchesComm && matchesMonth;
    });
  }, [admitCards, searchQuery, selectedCommission, selectedMonth]);

  const commissionFilters = [
    { code: 'all', label: 'All Commissions' },
    { code: 'upsc', label: 'UPSC (Civil)' },
    { code: 'ssc', label: 'SSC (All Regions)' },
    { code: 'railways', label: 'Railways (RRB)' },
    { code: 'banking', label: 'Banking (IBPS/SBI)' },
    { code: 'state-psc', label: 'State PSC & Police' },
    { code: 'nta', label: 'NTA & Teaching' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Regional Portals Modal */}
      <RegionalPortalsModal
        isOpen={activeRegionalModal.isOpen}
        onClose={() => setActiveRegionalModal({ isOpen: false, examName: '', type: 'ssc' })}
        examName={activeRegionalModal.examName}
        type={activeRegionalModal.type}
      />

      {/* Direct PDF In-App Preview Modal */}
      <DirectPdfModal
        isOpen={pdfModal.isOpen}
        onClose={() => setPdfModal({ isOpen: false, url: '', title: '' })}
        pdfUrl={pdfModal.url}
        title={pdfModal.title}
      />

      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#00236f] flex items-center gap-1 cursor-pointer">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] dark:text-white font-bold">Admit Card & Direct Hall Ticket Gateway</span>
      </nav>

      {/* 2. Asymmetric Bento Header */}
      <div className="bg-gradient-to-r from-[#904d00] via-[#c25e00] to-[#5b2700] rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block bg-white/20 text-white text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
            Direct Candidate Login & Hall Ticket Hub
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
            Official Admit Card Download Gateway
          </h1>
          <p className="text-white/90 text-xs md:text-sm mt-2">
            Bypasses generic commission homepages. Click below for <strong>Direct Roll Number / DOB Login Forms</strong>, Server 1, Server 2, and SSC/RRB Regional Portals.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-bold">
            <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Server 1: Ultra High Speed
            </span>
            <span className="bg-amber-500/20 text-amber-200 border border-amber-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Server 2: High Traffic Mirror
            </span>
            <span className="bg-blue-500/20 text-blue-200 border border-blue-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">public</span>
              SSC 9 Regions & RRB 21 Zones
            </span>
          </div>
        </div>
      </div>

      {/* 3. Three Candidate Journey Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#101b2c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-4 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#dce1ff] dark:bg-blue-950 text-[#00236f] dark:text-[#93c5fd] flex items-center justify-center shrink-0 font-black">
            1
          </div>
          <div>
            <h3 className="font-display font-bold text-xs md:text-sm text-[#00236f] dark:text-[#93c5fd]">Application Status</h3>
            <p className="text-[11px] text-[#444651] dark:text-[#cbd5e1] mt-0.5">
              Check if your application is accepted or rejected by commission with exact scrutiny reason.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#101b2c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-4 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffdcc3] dark:bg-amber-950 text-[#904d00] dark:text-amber-300 flex items-center justify-center shrink-0 font-black">
            2
          </div>
          <div>
            <h3 className="font-display font-bold text-xs md:text-sm text-[#904d00] dark:text-amber-300">City Intimation Slip</h3>
            <p className="text-[11px] text-[#444651] dark:text-[#cbd5e1] mt-0.5">
              Know your allotted exam city & shift timing 10 days before the exam for train/bus reservations.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#101b2c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-4 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#85f8c4] dark:bg-emerald-950 text-[#002114] dark:text-emerald-300 flex items-center justify-center shrink-0 font-black">
            3
          </div>
          <div>
            <h3 className="font-display font-bold text-xs md:text-sm text-emerald-800 dark:text-emerald-300">Final Hall Ticket</h3>
            <p className="text-[11px] text-[#444651] dark:text-[#cbd5e1] mt-0.5">
              Download printable e-Admit Card with venue code, roll number & instructions 4 days before exam.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="bg-white dark:bg-[#101b2c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex items-center bg-[#eff4ff] dark:bg-[#070e1e] rounded-xl px-3 py-2 w-full sm:max-w-md border border-[#d3e4fe]/50 dark:border-[#1e324c]">
            <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">search</span>
            <input
              type="text"
              placeholder="Search exam, commission, or job title (e.g. SSC CGL, RRB ALP, UP Police)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#0b1c30] dark:text-white placeholder:text-[#757682] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#757682] shrink-0">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] text-xs font-bold text-[#0b1c30] dark:text-white rounded-xl px-3 py-2 focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Examination Dates</option>
              <option value="august">August 2026</option>
              <option value="september">September 2026</option>
              <option value="october">October 2026</option>
              <option value="november">November 2026</option>
              <option value="december">December 2026</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {commissionFilters.map((comm) => {
            const isSelected = selectedCommission === comm.code;
            return (
              <button
                key={comm.code}
                onClick={() => setSelectedCommission(comm.code)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00236f] dark:bg-[#2563eb] text-white shadow-xs'
                    : 'bg-[#eff4ff] dark:bg-[#1e293b] text-[#444651] dark:text-[#cbd5e1] hover:bg-[#dce9ff]'
                }`}
              >
                {comm.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Active Admit Cards List with Direct Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCards.map((card) => {
          const isSSC = card.commissionCode === 'ssc' || card.title.toLowerCase().includes('ssc');
          const isRRB = card.commissionCode === 'railways' || card.title.toLowerCase().includes('rrb');
          const directLogin = card.directLoginUrl || card.hallTicketUrl;
          const server2 = card.server2Url || card.citySlipUrl;
          const noticePdf = card.officialNoticePdfUrl || card.citySlipUrl;
          const isGuideOpen = expandedGuideId === card.id;

          return (
            <div
              key={card.id}
              className="bg-white dark:bg-[#101b2c] rounded-3xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="bg-[#ffdcc3] text-[#2f1500] dark:bg-amber-950 dark:text-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {card.statusBadge}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Direct Server Online</span>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#757682] dark:text-[#94a3b8] block">{card.commission}</span>
                <h2 className="font-display font-extrabold text-base text-[#0b1c30] dark:text-white leading-snug mt-0.5 group-hover:text-[#00236f] dark:group-hover:text-[#38bdf8] transition-colors">
                  {card.title}
                </h2>
                <p className="text-xs font-semibold text-[#00236f] dark:text-[#93c5fd] mt-1">{card.examName}</p>

                {/* Exam Date & Credentials */}
                <div className="mt-3 p-3 bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe]/50 dark:border-[#1e324c] rounded-2xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#757682] dark:text-[#94a3b8]">Exam Date:</span>
                    <strong className="text-[#904d00] dark:text-amber-400 font-black">{card.examDateFormatted}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#757682] dark:text-[#94a3b8]">Login Credentials:</span>
                    <span className="font-bold text-[#0b1c30] dark:text-white">{card.requirements}</span>
                  </div>
                </div>

                {/* Regional Modal Button (for SSC/RRB) */}
                {(isSSC || isRRB) && (
                  <button
                    onClick={() =>
                      setActiveRegionalModal({
                        isOpen: true,
                        examName: card.title,
                        type: isRRB ? 'railways' : 'ssc',
                      })
                    }
                    className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00236f] to-[#0038a8] hover:from-[#00174c] hover:to-[#002b80] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">public</span>
                    <span>
                      {isSSC ? 'Choose Your SSC Region (CR, NR, ER, WR, SR)' : 'Choose Your RRB Zone (21 Boards)'}
                    </span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                )}

                {/* 10-Second Candidate Guide Accordion */}
                <div className="mt-3 pt-2 border-t border-[#eff4ff] dark:border-[#1e324c]">
                  <button
                    onClick={() => setExpandedGuideId(isGuideOpen ? null : card.id)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-[#00236f] dark:text-[#93c5fd] hover:underline cursor-pointer"
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">help_outline</span>
                      How to Download in 10 Seconds (Step-by-Step Guide)
                    </span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isGuideOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isGuideOpen && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-[#1c1917] border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs space-y-1.5 text-amber-950 dark:text-amber-200">
                      <div className="flex items-start gap-2">
                        <strong className="text-amber-700 dark:text-amber-400">Step 1:</strong>
                        <span>Click on <strong>Server 1 (Direct Login)</strong> below.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <strong className="text-amber-700 dark:text-amber-400">Step 2:</strong>
                        <span>Enter your Registration No. / Roll No. & Date of Birth in DD/MM/YYYY format.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <strong className="text-amber-700 dark:text-amber-400">Step 3:</strong>
                        <span>If Server 1 is slow due to heavy traffic, use <strong>Server 2</strong> immediately.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <strong className="text-amber-700 dark:text-amber-400">Step 4:</strong>
                        <span>Carry printed colored Admit Card, 2 passport size photos, and original Photo ID (Aadhaar / Voter ID).</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Action Multi-Server Buttons */}
              <div className="pt-3 border-t border-[#eff4ff] dark:border-[#1e324c] space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Server 1: Direct Candidate Login */}
                  <a
                    href={directLogin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#00236f] hover:bg-[#00174c] text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Server 1 (Direct Login)</span>
                    <span className="material-symbols-outlined text-[15px]">login</span>
                  </a>

                  {/* Server 2: Alternate Fast Server */}
                  <a
                    href={server2}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-[#eff4ff] dark:bg-[#1e293b] hover:bg-[#dce9ff] text-[#00236f] dark:text-[#93c5fd] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Alternate Mirror Server in case of heavy rush"
                  >
                    <span>Server 2 (Mirror)</span>
                    <span className="material-symbols-outlined text-[14px]">speed</span>
                  </a>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                  <a
                    href={card.citySlipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#904d00] dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    Exam City Slip
                  </a>

                  <button
                    onClick={() => setPdfModal({ isOpen: true, url: noticePdf, title: card.title })}
                    className="font-bold text-[#757682] dark:text-[#94a3b8] hover:text-[#00236f] dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                    Official Notice PDF
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
