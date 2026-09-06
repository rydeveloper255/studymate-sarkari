import React, { useState, useMemo } from 'react';
import { ResultItem } from '../types';

export interface ResultsViewProps {
  results: ResultItem[];
  onNavigate: (tab: string, jobId?: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');

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
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#00236f] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] font-bold">Sarkari Results, Merit Lists & Scorecards 2025</span>
      </nav>

      {/* 2. Banner */}
      <div className="bg-gradient-to-r from-[#003120] to-[#004a32] rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <span className="inline-block bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          Official Gazette Declared Lists
        </span>
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
          Government Examination Results & Cut-Off Marks
        </h1>
        <p className="text-white/80 text-xs md:text-sm mt-2 max-w-2xl">
          Direct merit list PDFs, candidate scorecards, normalized marks & category-wise selection lists for Central and State exams.
        </p>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#d3e4fe] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2 w-full sm:max-w-md">
          <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">search</span>
          <input
            type="text"
            placeholder="Search exam result (e.g. SSC GD, UPSSSC, NDA, BPSC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#0b1c30] placeholder:text-[#757682] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['All', 'Final Result', 'Tier 1 Result', 'Score Card', 'Merit List'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                selectedType === t
                  ? 'bg-[#003120] text-white'
                  : 'bg-[#eff4ff] text-[#444651] hover:bg-[#dce9ff]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Results List Cards */}
      <div className="space-y-4">
        {filteredResults.map((res) => (
          <div
            key={res.id}
            className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[#dce1ff] text-[#00164e] text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                    {res.resultType}
                  </span>
                  <span className="text-[11px] font-bold text-[#444651] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                    {res.board}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#003120] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Declared: {res.declaredDate}
                </span>
              </div>

              <h2 className="font-display font-extrabold text-base md:text-lg text-[#0b1c30] leading-snug">
                {res.title}
              </h2>

              {res.cutoffSummary && (
                <div className="mt-3 p-3 bg-[#eff4ff] rounded-xl text-xs">
                  <span className="font-bold text-[#00236f] block mb-1">Official Category Cut-Off Marks:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(res.cutoffSummary).map(([cat, mark]) => (
                      <span key={cat} className="bg-white px-2 py-1 rounded-md font-bold text-[#0b1c30] border border-[#d3e4fe]">
                        {cat}: <strong className="text-[#904d00]">{mark}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#eff4ff] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#757682]">Exam Held: {res.examDate}</span>
              <div className="flex items-center gap-2">
                <a
                  href={res.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#003120] hover:bg-[#004a32] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Download Merit List PDF</span>
                  <span className="material-symbols-outlined text-[14px]">download</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
