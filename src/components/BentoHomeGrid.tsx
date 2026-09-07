import React from 'react';
import { JobItem, AdmitCardItem, ResultItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface BentoHomeGridProps {
  jobs: JobItem[];
  admitCards: AdmitCardItem[];
  results: ResultItem[];
  onNavigate: (tab: string, jobId?: string) => void;
  onSelectJob: (job: JobItem) => void;
}

export const BentoHomeGrid: React.FC<BentoHomeGridProps> = ({
  jobs,
  admitCards,
  results,
  onNavigate,
  onSelectJob,
}) => {
  const { language } = useLanguage();

  // Find a flagship spotlight job (e.g. SSC CGL 2025 or Railway NTPC or first job)
  const spotlightJob =
    jobs.find((j) => j.id === 'ssc-cgl-2025') ||
    jobs.find((j) => j.id === 'rrb-ntpc-2025') ||
    jobs[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <h2 className="font-display font-black text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            {language === 'hi' ? 'दैनिक मुख्य हाइलाइट्स' : 'Daily Recruitment Spotlight & Live Feeds'}
          </h2>
        </div>
        <span className="text-[11px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider">
          Gazette Stream
        </span>
      </div>

      {/* Bento Grid: 2 Columns on md/lg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ================= TILE 1 (Spotlight Major Vacancy - 7 Cols) ================= */}
        {spotlightJob && (
          <div className="lg:col-span-7 bg-gradient-to-br from-[#00236f] via-[#0b2b80] to-[#00174c] rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-amber-400 text-[#00236f] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  ★ National Spotlight
                </span>
                <span className="bg-white/15 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {spotlightJob.vacanciesFormatted} Total Vacancies
                </span>
                <span className="bg-rose-500/80 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  Closing Soon
                </span>
              </div>

              {/* Title & Commission */}
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                {spotlightJob.department}
              </p>
              <h3
                onClick={() => onNavigate('job-detail', spotlightJob.id)}
                className="font-display font-black text-xl sm:text-2xl text-white mt-1 leading-snug cursor-pointer group-hover:text-amber-200 transition-colors"
              >
                {spotlightJob.title}
              </h3>

              {/* Key Specs Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4 text-xs">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <span className="text-[10px] text-white/70 block uppercase">Qualification</span>
                  <span className="font-bold text-white block line-clamp-1">
                    {spotlightJob.qualificationSummary || 'Graduate / 12th Pass'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <span className="text-[10px] text-white/70 block uppercase">Pay Scale</span>
                  <span className="font-bold text-white block line-clamp-1">
                    {spotlightJob.payLevel || 'Level 4 to 8'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-white/70 block uppercase">Last Date</span>
                  <span className="font-black text-amber-300 block line-clamp-1">
                    {spotlightJob.lastDate.split('(')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-white/90 font-medium">
                <span className="material-symbols-outlined text-[18px] text-emerald-400">
                  verified
                </span>
                <span>Direct Commission Apply Link Verified</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('job-detail', spotlightJob.id)}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#00236f] hover:bg-amber-50 font-black text-xs shadow-md transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{language === 'hi' ? 'फॉर्म भरें / विवरण' : 'Apply / View Details'}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TILE 2 (Top Hall-Tickets & Results Ticker - 5 Cols) ================= */}
        <div className="lg:col-span-5 bg-white dark:bg-[#101b2c] rounded-3xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">
                  campaign
                </span>
                <h3 className="font-display font-extrabold text-sm text-[#0b1c30] dark:text-white">
                  {language === 'hi' ? 'लाइव एडमिट कार्ड व परिणाम' : 'Live Hall Tickets & Cutoffs'}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('admit-card')}
                className="text-xs font-bold text-[#00236f] dark:text-[#38bdf8] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-[#eff4ff] dark:divide-[#1e324c] pt-1">
              {admitCards.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('admit-card')}
                  className="py-2.5 hover:bg-[#eff4ff] dark:hover:bg-[#070e1e] rounded-xl px-2 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#ffdad6] text-[#93000a] dark:bg-rose-950 dark:text-rose-300 uppercase">
                      Admit Card Out
                    </span>
                    <span className="text-[10px] text-[#757682] dark:text-[#94a3b8] font-bold">
                      {item.examDate || 'Check Hall Ticket'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#0b1c30] dark:text-white group-hover:text-[#00236f] dark:group-hover:text-[#38bdf8] truncate">
                    {item.title}
                  </h4>
                </div>
              ))}

              {results.slice(0, 2).map((res) => (
                <div
                  key={res.id}
                  onClick={() => onNavigate('results')}
                  className="py-2.5 hover:bg-[#eff4ff] dark:hover:bg-[#070e1e] rounded-xl px-2 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#85f8c4] text-[#002114] uppercase">
                      Merit List Declared
                    </span>
                    <span className="text-[10px] text-[#757682] dark:text-[#94a3b8] font-bold">
                      Scorecard Active
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#0b1c30] dark:text-white group-hover:text-emerald-600 truncate">
                    {res.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#eff4ff] dark:border-[#1e324c] flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#757682] dark:text-[#94a3b8]">
              Updated in real-time by bot
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              100% Verified
            </span>
          </div>
        </div>

        {/* ================= TILE 4 (Official Telegram & WhatsApp Community Hub - 12 Cols Full Width) ================= */}
        <div className="lg:col-span-12 bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#128C7E] rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-[#00236f] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Community Hub
                </span>
                <span className="text-cyan-100 text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  2,50,000+ Active Aspirants
                </span>
              </div>
              <h3 className="font-display font-black text-lg sm:text-xl text-white mt-1">
                {language === 'hi'
                  ? 'टेलीग्राम एवं व्हाट्सएप पर पाएं 24x7 तत्काल भर्ती व एडमिट कार्ड सूचनाएं'
                  : 'Join Official Telegram & WhatsApp Fast-Alert Channels'}
              </h3>
              <p className="text-white/90 text-xs sm:text-sm mt-0.5 max-w-2xl">
                {language === 'hi'
                  ? 'हर 5 मिनट में 250+ आधिकारिक वेबसाइट्स से स्क्रैप किए गए नोटिफिकेशन बिना किसी विज्ञापन के।'
                  : 'Instant automated alerts right from 250+ official gazettes & commission portals without delays.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
            <a
              href="https://t.me/Sarkariupdatealerts"
              target="_blank"
              rel="noreferrer"
              className="flex-1 md:flex-initial px-5 py-2.5 bg-white text-[#0284c7] hover:bg-sky-50 font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>Join Telegram</span>
            </a>
            <a
              href="https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z"
              target="_blank"
              rel="noreferrer"
              className="flex-1 md:flex-initial px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-[#002114] font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Join WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
