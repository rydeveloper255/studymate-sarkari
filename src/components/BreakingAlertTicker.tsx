import React from 'react';
import { AdmitCardItem, ResultItem } from '../types';

interface BreakingAlertTickerProps {
  admitCards: AdmitCardItem[];
  results: ResultItem[];
  onNavigate: (tab: string, id?: string) => void;
  onOpenPdf?: (url: string, title: string) => void;
}

export const BreakingAlertTicker: React.FC<BreakingAlertTickerProps> = ({
  admitCards,
  results,
  onNavigate,
}) => {
  const latestAdmit = admitCards[0];
  const latestResult = results[0];

  if (!latestAdmit && !latestResult) return null;

  return (
    <div className="bg-gradient-to-r from-[#00174c] via-[#00236f] to-[#1e3a8a] text-white py-2 px-4 rounded-2xl shadow-sm border border-[#2563eb]/30 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
      <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          LIVE UPDATES
        </div>

        <div className="truncate text-white font-medium text-xs">
          {latestAdmit && (
            <span className="mr-3">
              🎫 <strong>Admit Card Out:</strong> {latestAdmit.title}
            </span>
          )}
          {latestResult && (
            <span className="hidden md:inline text-amber-200">
              🏆 <strong>Result:</strong> {latestResult.title}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
        {latestAdmit && (
          <a
            href={latestAdmit.directLoginUrl || latestAdmit.hallTicketUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black px-3 py-1 rounded-xl text-[11px] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span>Direct Hall Ticket</span>
            <span className="material-symbols-outlined text-[13px]">download</span>
          </a>
        )}

        {latestResult && (
          <button
            onClick={() => onNavigate('results')}
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1 rounded-xl text-[11px] transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Check Merit List</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
};
