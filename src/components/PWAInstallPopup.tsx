import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallPopup: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // If already installed, do not show popup
    if (isInstalled) return;

    // Check if user dismissed the popup during this session
    const dismissed = sessionStorage.getItem('studymate_pwa_popup_dismissed');
    if (dismissed === 'true') return;

    // Trigger popup after 6.5 seconds (between 6 and 7 seconds as requested)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 6500);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('studymate_pwa_popup_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setIsOpen(false);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      // For iOS or browsers without native prompt, keep modal open to show step-by-step instructions
      // The guide is rendered below
    }
  };

  if (!isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#101b2c] rounded-3xl shadow-2xl border border-[#d3e4fe] dark:border-[#1e324c] overflow-hidden text-[#0b1c30] dark:text-[#f1f5f9] animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header with gradient banner & Close icon */}
        <div className="relative bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#2563eb] p-4 text-white">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl overflow-hidden shadow-lg border-2 border-[#38bdf8] bg-[#070e1e] flex-shrink-0 p-0.5">
              <img
                src="/logo.png"
                alt="StudyMate Sarkari Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <span className="px-2 py-0.5 bg-[#fe932c] text-[#2f1500] text-[10px] font-black uppercase rounded-full tracking-wider">
                Official Web App
              </span>
              <h3 className="text-lg font-black text-white leading-tight mt-0.5">
                StudyMate Sarkari
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Install on Phone or PC for 1-Tap Access
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-[#444651] dark:text-[#cbd5e1]">
              <span className="material-symbols-outlined text-[18px] text-[#16a34a] flex-shrink-0">
                check_circle
              </span>
              <span><strong>Instant Job Alerts:</strong> UPSC, SSC, Railway &amp; State PSC updates sidhe mobile par.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#444651] dark:text-[#cbd5e1]">
              <span className="material-symbols-outlined text-[18px] text-[#2563eb] flex-shrink-0">
                offline_bolt
              </span>
              <span><strong>Fast &amp; Offline Ready:</strong> Low data usage aur bina browser bar ke full-screen experience.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#444651] dark:text-[#cbd5e1]">
              <span className="material-symbols-outlined text-[18px] text-[#d97706] flex-shrink-0">
                badge
              </span>
              <span><strong>1-Tap Hall Tickets:</strong> Direct admit card and result links anytime.</span>
            </div>
          </div>

          {/* iOS Specific Instructions */}
          {isIOS ? (
            <div className="bg-[#eff4ff] dark:bg-[#070e1e] p-3 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] text-xs">
              <p className="font-bold text-[#00236f] dark:text-[#93c5fd] mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">ios_share</span> iPhone / iPad Install Instructions:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[#444651] dark:text-[#94a3b8] text-[11px]">
                <li>Safari ke bottom me <strong>Share button</strong> tap karein.</li>
                <li>Niche scroll karke <strong>"Add to Home Screen"</strong> chunein.</li>
                <li>Top right me <strong>"Add"</strong> par click karein.</li>
              </ol>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#d3e4fe] dark:border-[#1e324c] text-[#444651] dark:text-[#94a3b8] text-xs font-bold hover:bg-[#eff4ff] dark:hover:bg-[#1e293b] transition-colors text-center"
            >
              Abhi Nahi (Later)
            </button>

            {!isIOS ? (
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00236f] to-[#1e40af] hover:from-[#1e3a8a] hover:to-[#2563eb] text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-[#60a5fa]">
                  download
                </span>
                <span>Install App (Free)</span>
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#00236f] text-white text-xs font-black hover:bg-[#1e3a8a] transition-all text-center"
              >
                Samajh Gaya (Done)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Temporary Success Toast */}
      {installSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-[#16a34a] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          StudyMate App Successfully Installed!
        </div>
      )}
    </div>
  );
};
