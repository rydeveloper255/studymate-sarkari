import React, { useState, useMemo } from 'react';
import { ResultItem } from '../types';
import { DirectPdfModal } from './DirectPdfModal';

export interface ResultsViewProps {
  results: ResultItem[];
  onNavigate: (tab: string, jobId?: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });
  const [rollSearchItem, setRollSearchItem] = useState<{ id: string; roll: string; verified?: boolean } | null>(null);

  const filteredResults = useMemo(() => {
    return results.filter((res) => {
      const matchesSearch =
        !searchQuery.trim() ||
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.board.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'All' || res.resultType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [results, searchQuery, selectedType]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* In-App Direct PDF Modal */}
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
        <span className="text-[#0b1c30] dark:text-white font-bold">Sarkari Results, Merit Lists & Scorecards</span>
      </nav>

      {/* 2. Banner */}
      <div className="bg-gradient-to-r from-[#003120] via-[#004a32] to-[#012518] rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <span className="inline-block bg-[#85f8c4] text-[#002114] text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          Direct Candidate Scorecards & Merit Gateway
        </span>
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
          Official Examination Results & Cut-Off Marks
        </h1>
        <p className="text-white/90 text-xs md:text-sm mt-2 max-w-2xl">
          Direct roll number lookup, individual scorecards, normalized marks & category-wise selection lists without searching through complex commission submenus.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-bold">
          <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Server 1: Direct Scorecard Form
          </span>
          <span className="bg-amber-500/20 text-amber-200 border border-amber-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Server 2: High Traffic Mirror
          </span>
          <span className="bg-blue-500/20 text-blue-200 border border-blue-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
            Direct Merit List PDF
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#101b2c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex items-center bg-[#eff4ff] dark:bg-[#070e1e] rounded-xl px-3 py-2 w-full sm:max-w-md border border-[#d3e4fe]/50 dark:border-[#1e324c]">
          <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">search</span>
          <input
            type="text"
            placeholder="Search exam result (e.g. SSC GD, UPSSSC, NDA, BPSC, RRB)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#0b1c30] dark:text-white placeholder:text-[#757682] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['All', 'Final Result', 'Tier 1 Result', 'Score Card', 'Merit List'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedType === t
                  ? 'bg-[#003120] text-white shadow-xs'
                  : 'bg-[#eff4ff] dark:bg-[#1e293b] text-[#444651] dark:text-[#cbd5e1] hover:bg-[#dce9ff]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Results List Cards */}
      <div className="space-y-4">
        {filteredResults.map((res) => {
          const directScorecard = res.scorecardLoginUrl || res.downloadUrl;
          const server2 = res.server2Url || res.downloadUrl;
          const meritPdf = res.meritListPdfUrl || res.downloadUrl;

          return (
            <div
              key={res.id}
              className="bg-white dark:bg-[#101b2c] rounded-3xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#dce1ff] text-[#00164e] dark:bg-blue-950 dark:text-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {res.resultType}
                    </span>
                    <span className="text-[11px] font-bold text-[#444651] dark:text-[#cbd5e1] bg-[#eff4ff] dark:bg-[#1e293b] px-2.5 py-0.5 rounded-full">
                      {res.board}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#003120] dark:text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Declared: {res.declaredDate}
                  </span>
                </div>

                <h2 className="font-display font-extrabold text-base md:text-lg text-[#0b1c30] dark:text-white leading-snug group-hover:text-[#00236f] dark:group-hover:text-[#38bdf8] transition-colors">
                  {res.title}
                </h2>

                {/* Category Cut-Off Table if available */}
                {res.cutoffSummary && (
                  <div className="mt-3 p-3.5 bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe]/50 dark:border-[#1e324c] rounded-2xl text-xs">
                    <span className="font-bold text-[#00236f] dark:text-[#93c5fd] block mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">analytics</span>
                      Official Category-Wise Cut-Off Marks:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(res.cutoffSummary).map(([cat, mark]) => (
                        <div
                          key={cat}
                          className="bg-white dark:bg-[#101b2c] px-3 py-1.5 rounded-xl font-bold text-[#0b1c30] dark:text-white border border-[#d3e4fe] dark:border-[#1e324c] flex items-center gap-2 shadow-2xs"
                        >
                          <span className="text-[#757682] text-[11px]">{cat}</span>
                          <strong className="text-[#904d00] dark:text-amber-400">{mark}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Roll Number Search Tool */}
                <div className="mt-3 p-3 bg-slate-50 dark:bg-[#070e1e] border border-slate-200 dark:border-[#1e324c] rounded-2xl text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="material-symbols-outlined text-[#00236f] dark:text-[#93c5fd] text-[18px]">badge</span>
                    <span className="text-[#444651] dark:text-[#cbd5e1] font-medium">Quick Roll Number Finder:</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Enter Roll Number..."
                      value={rollSearchItem?.id === res.id ? rollSearchItem.roll : ''}
                      onChange={(e) => setRollSearchItem({ id: res.id, roll: e.target.value })}
                      className="bg-white dark:bg-[#101b2c] border border-slate-300 dark:border-[#1e324c] rounded-xl px-3 py-1 text-xs text-[#0b1c30] dark:text-white focus:outline-none w-full sm:w-40"
                    />
                    <button
                      onClick={() => {
                        if (rollSearchItem && rollSearchItem.roll.trim()) {
                          setPdfModal({ isOpen: true, url: meritPdf, title: `${res.title} (Search: ${rollSearchItem.roll})` });
                        }
                      }}
                      className="bg-[#00236f] hover:bg-[#00174c] text-white px-3 py-1 rounded-xl font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      Find in PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Multi-Server Action Bar */}
              <div className="pt-3 border-t border-[#eff4ff] dark:border-[#1e324c] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#757682] dark:text-[#94a3b8]">Exam Held: {res.examDate}</span>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Server 1: Direct Scorecard Form */}
                  <a
                    href={directScorecard}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none bg-[#003120] hover:bg-[#004a32] text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Server 1 (Direct Scorecard)</span>
                    <span className="material-symbols-outlined text-[14px]">login</span>
                  </a>

                  {/* Server 2: Alternate Mirror */}
                  <a
                    href={server2}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#eff4ff] dark:bg-[#1e293b] hover:bg-[#dce9ff] text-[#00236f] dark:text-[#93c5fd] text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="Alternate Mirror Server"
                  >
                    <span>Server 2 (Mirror)</span>
                    <span className="material-symbols-outlined text-[13px]">speed</span>
                  </a>

                  {/* Direct Merit List PDF Preview */}
                  <button
                    onClick={() => setPdfModal({ isOpen: true, url: meritPdf, title: res.title })}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 dark:bg-amber-950 dark:text-amber-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-rose-600">picture_as_pdf</span>
                    <span>Merit List PDF</span>
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
