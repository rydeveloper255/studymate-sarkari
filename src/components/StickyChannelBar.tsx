import React, { useState, useEffect } from 'react';

export const StickyChannelBar: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('studymate_sticky_bar_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('studymate_sticky_bar_dismissed', 'true');
  };

  if (dismissed) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-fade-in font-sans">
        <button
          onClick={() => setMinimized(false)}
          className="bg-[#00236f] text-white p-3 rounded-full shadow-2xl border-2 border-[#85f8c4] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Open Official Live Recruitment Alerts"
        >
          <span className="material-symbols-outlined text-[22px] text-[#85f8c4] animate-pulse">campaign</span>
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Live Sarkari Recruitment Channel Alerts" className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-3 pointer-events-none font-sans">
      <div className="max-w-4xl mx-auto bg-[#070e1e]/95 dark:bg-[#070e1e]/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-2.5 sm:p-3 pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-white animate-slide-up">
        {/* Left Side: Live Ticker Pulse */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#85f8c4] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#85f8c4]"></span>
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span className="text-[#85f8c4] uppercase tracking-wider text-[10px] bg-[#85f8c4]/15 px-1.5 py-0.5 rounded">
                  24x7 Live Desk
                </span>
                <span className="truncate max-w-[210px] sm:max-w-xs md:max-w-sm">
                  Railway NTPC &amp; SSC CGL 2026 Portals Active
                </span>
              </div>
              <span className="text-[10px] text-white/70 block">
                Join 48,000+ candidates receiving instant PDF notifications
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={() => setMinimized(true)}
              className="text-white/60 hover:text-white p-1"
              title="Minimize bar"
            >
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white p-1"
              title="Dismiss for this session"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>

        {/* Right Side: Fast 1-Tap CTA Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Telegram Channel Button */}
          <a
            href="https://t.me/Sarkariupdatealerts"
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-initial bg-[#229ED9] hover:bg-[#1e8ec3] text-white font-black text-xs py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>48K+ Telegram</span>
          </a>

          {/* WhatsApp Channel Button */}
          <a
            href="https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z"
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-initial bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>WhatsApp Channel</span>
          </a>

          {/* Desktop minimize & dismiss */}
          <div className="hidden sm:flex items-center gap-1 text-white/50 pl-1 border-l border-white/10">
            <button
              onClick={() => setMinimized(true)}
              className="hover:text-white p-1 transition-colors"
              title="Minimize"
            >
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            <button
              onClick={handleDismiss}
              className="hover:text-white p-1 transition-colors"
              title="Close"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
