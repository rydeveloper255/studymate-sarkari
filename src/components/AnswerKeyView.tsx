import React, { useState } from 'react';
import { AnswerKeyItem } from '../types';

export interface AnswerKeyViewProps {
  answerKeys: AnswerKeyItem[];
  onNavigate: (tab: string, jobId?: string) => void;
}

export const AnswerKeyView: React.FC<AnswerKeyViewProps> = ({ answerKeys, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredKeys = answerKeys.filter(
    (k) =>
      !searchQuery.trim() ||
      k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.board.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#00236f] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] font-bold">Answer Keys & Response Sheet Portal 2025</span>
      </nav>

      {/* 2. Banner */}
      <div className="bg-gradient-to-r from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <span className="inline-block bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          Candidate Response Sheets & Keys
        </span>
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
          Provisional & Final Examination Answer Keys
        </h1>
        <p className="text-white/80 text-xs md:text-sm mt-2 max-w-2xl">
          Check your marked answers, calculate estimated raw scores, and submit question challenges online before the objection window closes.
        </p>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-white rounded-2xl border border-[#d3e4fe] p-4 shadow-xs">
        <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2 w-full max-w-md">
          <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">search</span>
          <input
            type="text"
            placeholder="Search answer key by exam (SSC, UGC NET, RRB)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#0b1c30] placeholder:text-[#757682] focus:outline-none"
          />
        </div>
      </div>

      {/* 4. Answer Keys Cards */}
      <div className="space-y-4">
        {filteredKeys.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="bg-[#ffdcc3] text-[#2f1500] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  {item.status}
                </span>
                <span className="text-xs font-bold text-[#444651] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                  {item.board}
                </span>
              </div>

              <h2 className="font-display font-extrabold text-base md:text-lg text-[#0b1c30] leading-snug">
                {item.title}
              </h2>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#eff4ff] p-3 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#757682] block">Release Date</span>
                  <span className="font-bold text-[#00236f]">{item.releaseDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#757682] block">Objection Deadline</span>
                  <span className="font-extrabold text-[#ba1a1a]">{item.objectionLastDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#757682] block">Objection Fee</span>
                  <span className="font-bold text-[#0b1c30]">{item.feePerQuestion}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#eff4ff] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#757682]">Requires Login Registration ID & Password</span>
              <div className="flex items-center gap-2">
                <a
                  href={item.answerKeyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Download Response Key PDF</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
