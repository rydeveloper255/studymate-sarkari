import React, { useState } from 'react';
import { AnswerKeyItem } from '../types';
import { DirectPdfModal } from './DirectPdfModal';

export interface AnswerKeyViewProps {
  answerKeys: AnswerKeyItem[];
  onNavigate: (tab: string, jobId?: string) => void;
}

export const AnswerKeyView: React.FC<AnswerKeyViewProps> = ({ answerKeys, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });
  const [expandedObjectionId, setExpandedObjectionId] = useState<string | null>(null);

  const filteredKeys = answerKeys.filter(
    (k) =>
      !searchQuery.trim() ||
      k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.board.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <span className="text-[#0b1c30] dark:text-white font-bold">Official Answer Keys & Response Sheets</span>
      </nav>

      {/* 2. Banner */}
      <div className="bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#00174c] rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <span className="inline-block bg-[#85f8c4] text-[#002114] text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          Direct Candidate Response Sheet & Objection Hub
        </span>
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
          Provisional & Final Examination Answer Keys
        </h1>
        <p className="text-white/90 text-xs md:text-sm mt-2 max-w-2xl">
          Direct candidate login to view marked responses, calculate estimated raw scores, and submit question challenges online before the objection window closes.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-bold">
          <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Server 1: Direct Response Sheet
          </span>
          <span className="bg-amber-500/20 text-amber-200 border border-amber-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Direct Objection Window
          </span>
          <span className="bg-blue-500/20 text-blue-200 border border-blue-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">timer</span>
            Objection Deadline Tracker
          </span>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-white dark:bg-[#101b2c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-4 shadow-xs">
        <div className="relative flex items-center bg-[#eff4ff] dark:bg-[#070e1e] rounded-xl px-3 py-2 w-full max-w-md border border-[#d3e4fe]/50 dark:border-[#1e324c]">
          <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">search</span>
          <input
            type="text"
            placeholder="Search answer key by exam (SSC CGL, UGC NET, RRB, CTET)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#0b1c30] dark:text-white placeholder:text-[#757682] focus:outline-none"
          />
        </div>
      </div>

      {/* 4. Answer Keys Cards */}
      <div className="space-y-4">
        {filteredKeys.map((item) => {
          const directResponse = item.directLoginUrl || item.answerKeyUrl;
          const server2 = item.server2Url || item.challengePortalUrl;
          const masterPdf = item.answerKeyUrl;
          const isObjectionOpen = expandedObjectionId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-[#101b2c] rounded-3xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="bg-[#ffdcc3] text-[#2f1500] dark:bg-amber-950 dark:text-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    {item.status}
                  </span>
                  <span className="text-xs font-bold text-[#444651] dark:text-[#cbd5e1] bg-[#eff4ff] dark:bg-[#1e293b] px-2.5 py-0.5 rounded-full">
                    {item.board}
                  </span>
                </div>

                <h2 className="font-display font-extrabold text-base md:text-lg text-[#0b1c30] dark:text-white leading-snug group-hover:text-[#00236f] dark:group-hover:text-[#38bdf8] transition-colors">
                  {item.title}
                </h2>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 p-3.5 bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe]/50 dark:border-[#1e324c] rounded-2xl text-xs">
                  <div>
                    <span className="text-[#757682] dark:text-[#94a3b8] block">Release Date:</span>
                    <strong className="text-[#0b1c30] dark:text-white">{item.releaseDate}</strong>
                  </div>
                  <div>
                    <span className="text-[#757682] dark:text-[#94a3b8] block">Objection Closes:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-black">{item.objectionLastDate}</strong>
                  </div>
                  <div>
                    <span className="text-[#757682] dark:text-[#94a3b8] block">Challenge Fee:</span>
                    <strong className="text-[#00236f] dark:text-[#93c5fd]">{item.feePerQuestion}</strong>
                  </div>
                </div>

                {/* Objection Procedure Accordion */}
                <div className="mt-3 pt-2 border-t border-[#eff4ff] dark:border-[#1e324c]">
                  <button
                    onClick={() => setExpandedObjectionId(isObjectionOpen ? null : item.id)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-[#00236f] dark:text-[#93c5fd] hover:underline cursor-pointer"
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">gavel</span>
                      How to Challenge a Wrong Question / Answer (Objection Rules)
                    </span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isObjectionOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isObjectionOpen && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs space-y-1.5 text-blue-950 dark:text-blue-200">
                      <div>
                        <strong>1. Login with Credentials:</strong> Click <em>Server 1 (Direct Response Sheet)</em> below with Roll No & Password.
                      </div>
                      <div>
                        <strong>2. Check Question ID:</strong> Identify Question ID and Option ID of the question you wish to challenge.
                      </div>
                      <div>
                        <strong>3. Upload Documentary Proof:</strong> Attach textbook reference or standard authority citation (NCERT/Gazette) in PDF.
                      </div>
                      <div>
                        <strong>4. Fee & Refund:</strong> Pay required fee per challenge. If challenge is accepted by expert committee, fee is refunded to source account.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Action Multi-Server Buttons */}
              <div className="pt-3 border-t border-[#eff4ff] dark:border-[#1e324c] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#757682] dark:text-[#94a3b8]">
                  <span className="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>
                  <span>Official Commission Portal Linked</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Server 1: Direct Candidate Response Sheet Login */}
                  <a
                    href={directResponse}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none bg-[#00236f] hover:bg-[#00174c] text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Server 1 (Response Sheet)</span>
                    <span className="material-symbols-outlined text-[14px]">login</span>
                  </a>

                  {/* Direct 1-Click Objection Portal */}
                  <a
                    href={item.challengePortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Submit Objection</span>
                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                  </a>

                  {/* Server 2: Alternate Fast Server */}
                  <a
                    href={server2}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#eff4ff] dark:bg-[#1e293b] hover:bg-[#dce9ff] text-[#00236f] dark:text-[#93c5fd] text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="Alternate Mirror Server"
                  >
                    <span>Server 2</span>
                    <span className="material-symbols-outlined text-[13px]">speed</span>
                  </a>

                  {/* Master Key PDF In-App Preview */}
                  <button
                    onClick={() => setPdfModal({ isOpen: true, url: masterPdf, title: item.title })}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="Preview Master PDF"
                  >
                    <span className="material-symbols-outlined text-[15px] text-rose-600">picture_as_pdf</span>
                    <span>PDF</span>
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
