import React from 'react';
import { useTheme } from '../context/ThemeContext';

export interface FooterProps {
  onNavigate: (tab: string, jobId?: string) => void;
  onOpenTelegram?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenTelegram }) => {
  const { theme, setTheme } = useTheme();

  const handleTelegramClick = () => {
    if (onOpenTelegram) {
      onOpenTelegram();
    } else {
      window.open('https://t.me/StudyMateSarkariLive', '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <footer className="bg-[#eff4ff] border-t border-[#d3e4fe] pt-12 pb-8 mt-16 font-sans">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        {/* Telegram / WhatsApp Alert Subscription Callout Banner */}
        <div className="bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#003120] rounded-2xl p-6 md:p-8 text-white mb-12 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-[#85f8c4] animate-pulse"></span>
                Instant Sarkari Alerts On Mobile
              </div>
              <h3 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
                Never Miss a Single Govt Recruitment Deadline
              </h3>
              <p className="text-white/80 text-sm mt-2">
                Join over 2,50,000+ serious aspirants receiving automated hourly gazette notifications, direct application links, answer keys & admit card hall tickets directly on Telegram.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleTelegramClick}
                className="bg-[#fe932c] hover:bg-[#fe932c]/90 text-[#2f1500] font-black text-sm px-6 py-3 rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                Join Telegram Channel
              </button>
              <button
                onClick={() => onNavigate('telegram-bot')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-5 py-3 rounded-xl border border-white/20 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                Bot Setup & Code
              </button>
            </div>
          </div>
        </div>

        {/* 5-Column Institutional Directory */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pb-12 border-b border-[#d3e4fe]">
          {/* Col 1: Central Commissions */}
          <div>
            <h4 className="font-display font-extrabold text-[#00236f] text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">account_balance</span>
              Central Boards
            </h4>
            <ul className="space-y-2 text-xs text-[#444651]">
              <li>
                <button onClick={() => onNavigate('job-detail', 'ssc-cgl-2025')} className="hover:text-[#00236f] text-left">
                  SSC CGL 2025 (17,727)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('job-detail', 'rrb-ntpc-2025')} className="hover:text-[#00236f] text-left">
                  Railway RRB NTPC (11,558)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('job-detail', 'upsc-cds-2025')} className="hover:text-[#00236f] text-left">
                  UPSC CDS-II 2025
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('job-detail', 'ibps-po-2025')} className="hover:text-[#00236f] text-left">
                  IBPS PO / MT XV 2025
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('latest-jobs')} className="hover:text-[#00236f] text-left font-semibold text-[#00236f]">
                  View All Central Jobs →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: State Recruitment Portals */}
          <div>
            <h4 className="font-display font-extrabold text-[#00236f] text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">map</span>
              State PSCs
            </h4>
            <ul className="space-y-2 text-xs text-[#444651]">
              <li>
                <button onClick={() => onNavigate('state-wise')} className="hover:text-[#00236f] text-left">
                  Uttar Pradesh (UPPSC / UPPRPB)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('state-wise')} className="hover:text-[#00236f] text-left">
                  Bihar (BPSC / CSBC)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('state-wise')} className="hover:text-[#00236f] text-left">
                  Rajasthan (RPSC / RSMSSB)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('state-wise')} className="hover:text-[#00236f] text-left">
                  Karnataka (KPSC KAS)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('state-wise')} className="hover:text-[#00236f] text-left font-semibold text-[#00236f]">
                  All 28 Indian States →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Key Gateways */}
          <div>
            <h4 className="font-display font-extrabold text-[#00236f] text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">category</span>
              Fast Categories
            </h4>
            <ul className="space-y-2 text-xs text-[#444651]">
              <li>
                <button onClick={() => onNavigate('admit-card')} className="hover:text-[#00236f] text-left">
                  Admit Cards Hub
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('results')} className="hover:text-[#00236f] text-left">
                  Sarkari Results & Scorecards
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('answer-key')} className="hover:text-[#00236f] text-left">
                  Answer Keys & Objections
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-calendar')} className="hover:text-[#00236f] text-left">
                  2025 Exam Calendar
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('notifications')} className="hover:text-[#00236f] text-left">
                  Live Gazette Circulars
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Candidate Utility Tools */}
          <div>
            <h4 className="font-display font-extrabold text-[#00236f] text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">build</span>
              Aspirant Tools
            </h4>
            <ul className="space-y-2 text-xs text-[#444651]">
              <li>
                <button onClick={() => onNavigate('candidate-tools')} className="hover:text-[#00236f] text-left">
                  Age Eligibility Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('candidate-tools')} className="hover:text-[#00236f] text-left">
                  Photo & Signature Resizer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('candidate-tools')} className="hover:text-[#00236f] text-left">
                  Marks Normalization Calc
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('candidate-tools')} className="hover:text-[#00236f] text-left">
                  Syllabus Breakdown PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('telegram-bot')} className="hover:text-[#00236f] text-left">
                  Auto Scraper Manager
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Institutional & Trust */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo.png" alt="StudyMate Sarkari Logo" className="w-8 h-8 rounded-lg shadow-xs border border-[#38bdf8]/40" />
              <h4 className="font-display font-extrabold text-[#00236f] text-xs uppercase tracking-wider">
                StudyMate Sarkari
              </h4>
            </div>
            <p className="text-xs text-[#444651] leading-relaxed mb-3">
              India's premier real-time Sarkari job intelligence network. All notices are verified against official Gazette notifications.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#004a32]"></span>
              <span className="text-[11px] font-bold text-[#004a32]">100% Free & Ad-Light</span>
            </div>
          </div>
        </div>

        {/* Statutory Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#757682]">
          <div className="max-w-2xl text-center md:text-left text-[11px] leading-normal">
            <strong className="text-[#0b1c30]">Statutory Disclaimer:</strong> StudyMate Sarkari is an independent educational informational portal designed to aggregate public employment news and examination notices. We are not directly affiliated with any Central or State Government recruiting commission. All official applications must be submitted only on respective verified government portals.
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Theme switcher pill in footer */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#101b2c] p-1 rounded-lg border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs">
              <button
                onClick={() => setTheme('light')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                  theme === 'light' ? 'bg-[#00236f] text-white' : 'text-[#444651] dark:text-[#94a3b8]'
                }`}
                title="Light Mode (Din)"
              >
                <span className="material-symbols-outlined text-[13px]">light_mode</span> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                  theme === 'dark' ? 'bg-[#00236f] text-white' : 'text-[#444651] dark:text-[#94a3b8]'
                }`}
                title="Dark Mode (Raat)"
              >
                <span className="material-symbols-outlined text-[13px]">dark_mode</span> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                  theme === 'system' ? 'bg-[#00236f] text-white' : 'text-[#444651] dark:text-[#94a3b8]'
                }`}
                title="System OS Theme"
              >
                Auto
              </button>
            </div>

            <div className="text-center md:text-right font-medium text-[11px] flex-shrink-0">
              © 2025 StudyMate Sarkari. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
