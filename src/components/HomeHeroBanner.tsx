import React from 'react';

interface HomeHeroBannerProps {
  onNavigate: (tab: string, jobId?: string) => void;
  onOpenNotifications?: () => void;
}

export const HomeHeroBanner: React.FC<HomeHeroBannerProps> = ({
  onNavigate,
  onOpenNotifications,
}) => {
  const categoryShortcuts = [
    {
      id: 'latest-jobs',
      label: 'Jobs',
      countBadge: '180+ Active',
      icon: 'work',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      id: 'admit-card',
      label: 'Admit Card',
      countBadge: 'Hall Tickets',
      icon: 'badge',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      id: 'results',
      label: 'Results',
      countBadge: 'Merit Lists',
      icon: 'emoji_events',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/50',
      iconBg: 'bg-purple-600 text-white',
    },
    {
      id: 'answer-key',
      label: 'Answer Key',
      countBadge: 'Solutions',
      icon: 'assignment_turned_in',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50',
      iconBg: 'bg-amber-600 text-white',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      countBadge: 'Live Ticker',
      icon: 'notifications_active',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50',
      iconBg: 'bg-rose-600 text-white',
    },
  ];

  const handleChipClick = (id: string) => {
    if (id === 'notifications') {
      if (onOpenNotifications) {
        onOpenNotifications();
      } else {
        onNavigate('latest-jobs');
      }
    } else {
      onNavigate(id);
    }
  };

  return (
    <div className="mb-6">
      {/* Primary Visual Header Banner Card */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-[#d3e4fe] dark:border-[#1e324c] bg-gradient-to-b from-white to-[#f0f5ff] dark:from-[#0d1626] dark:to-[#080e18] shadow-lg transition-all">
        {/* Subtle decorative glowing corner aura */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/15 via-purple-400/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-400/15 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="px-4 py-6 sm:px-8 sm:py-8 md:py-10 max-w-7xl mx-auto">
          {/* Main Visual Row matching User Image 1 */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
            
            {/* Left Brand Illustration & 3D Emblem */}
            <div className="flex-shrink-0 flex items-center justify-center relative">
              <div className="relative group">
                <img
                  src="/banner.png"
                  alt="StudyMate Sarkari All in One Portal"
                  className="hidden" // rendered via accessible structured SVG/elements below for extreme crispness
                />
                <div className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-68 md:h-68 flex items-center justify-center">
                  {/* Glowing squircle halo */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/30 to-purple-600/20 blur-xl animate-pulse" />
                  <img
                    src="/logo.png"
                    alt="StudyMate Sarkari Official Mascot & Logo"
                    className="relative z-10 w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Center/Right Brand Typography & Portal Highlights */}
            <div className="flex-1 text-center lg:text-left">
              {/* Government Jobs & Exam Updates Verified Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00236f] dark:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs mb-3">
                <span className="material-symbols-outlined text-[16px] text-amber-300">
                  verified
                </span>
                <span>Central &amp; State Govt Jobs &bull; Exam Updates</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-[#00236f] text-[10px] font-black uppercase">
                  Verified
                </span>
              </div>

              {/* Main Heading Text */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#0b1c30] dark:text-white leading-[1.1] mb-2 font-sans">
                StudyMate <span className="bg-gradient-to-r from-[#00236f] via-[#2563eb] to-[#7c3aed] dark:from-[#60a5fa] dark:via-[#93c5fd] dark:to-[#c084fc] bg-clip-text text-transparent">Sarkari</span>
              </h1>

              {/* Divider & Tagline */}
              <div className="flex items-center justify-center lg:justify-start gap-3 my-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#00236f] dark:text-[#93c5fd]">
                <div className="h-[2px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-[#00236f] dark:to-[#60a5fa]" />
                <span>All in One Place</span>
                <div className="h-[2px] w-12 sm:w-28 bg-gradient-to-r from-[#00236f] dark:from-[#60a5fa] to-transparent" />
              </div>

              <p className="mt-2 text-xs sm:text-sm md:text-base text-[#444651] dark:text-[#cbd5e1] max-w-2xl leading-relaxed mx-auto lg:mx-0 font-medium">
                India's premier real-time educational gateway for UPSC, SSC, Banking, Railways, State PSCs, Defence notifications, Hall Tickets, Answer Keys, and Exam Results.
              </p>

              {/* Action Buttons Row: Quick Actions */}
              <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={() => onNavigate('candidate-tools')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00236f] hover:bg-[#00174c] text-white text-xs md:text-sm font-bold shadow-md transition-all hover:scale-105 border border-[#38bdf8]/40"
                  title="Age Calculator, Photo Resizer, Typing Test, Normalization"
                >
                  <span className="material-symbols-outlined text-[19px] text-[#38bdf8]">
                    construction
                  </span>
                  <span>Candidate Tools &amp; Calculator</span>
                </button>

                <button
                  onClick={() => onNavigate('latest-jobs')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#101b2c] hover:bg-[#eff4ff] dark:hover:bg-[#1e293b] text-[#00236f] dark:text-[#93c5fd] text-xs md:text-sm font-bold border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs transition-all hover:scale-105"
                >
                  <span className="material-symbols-outlined text-[18px]">explore</span>
                  <span>Browse 180+ Active Jobs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: 5 Category Pill Chips (Exact layout from Image 1) */}
          <div className="mt-8 pt-6 border-t border-[#d3e4fe]/80 dark:border-[#1e324c]">
            <div className="text-center lg:text-left mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#757682] dark:text-[#94a3b8]">
                ⚡ Quick Section Access
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {categoryShortcuts.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleChipClick(cat.id)}
                  className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-xs cursor-pointer text-left ${cat.bgClass}`}
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${cat.iconBg}`}>
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-xs sm:text-sm leading-tight truncate">
                      {cat.label}
                    </div>
                    <div className="text-[10px] opacity-80 font-semibold truncate">
                      {cat.countBadge}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
