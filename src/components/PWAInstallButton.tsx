import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'mobile';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as standalone installed app, hide install trigger
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'nav' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00236f] to-[#1e40af] hover:from-[#1e3a8a] hover:to-[#2563eb] text-white text-xs font-black shadow-sm transition-all hover:scale-105 active:scale-95 border border-[#60a5fa]/30 ${className}`}
          type="button"
          title="Install StudyMate Web App on your Device"
        >
          <span className="material-symbols-outlined text-[17px] text-[#60a5fa] animate-pulse">
            install_mobile
          </span>
          <span className="whitespace-nowrap">App Install</span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-bold bg-[#fe932c] text-[#2f1500] rounded-full uppercase tracking-tighter">
            PWA
          </span>
        </button>
      )}

      {variant === 'banner' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00236f] hover:bg-[#00174c] text-white text-xs md:text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 border border-[#38bdf8]/40 ${className}`}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] text-[#38bdf8]">
            download_for_offline
          </span>
          <span>Install Web App (Free)</span>
        </button>
      )}

      {variant === 'mobile' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#00236f] to-[#1e3a8a] text-white text-xs font-bold shadow-sm ${className}`}
          type="button"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#60a5fa]">
              install_mobile
            </span>
            <div className="text-left">
              <div className="leading-tight font-extrabold">Install StudyMate App</div>
              <div className="text-[10px] text-blue-200">1-Tap Homescreen Access & Fast Alerts</div>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-1 bg-white/10 rounded-lg border border-white/20">
            Install
          </span>
        </button>
      )}

      {/* Guide Modal for iOS or manual install */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#101b2c] p-6 shadow-2xl border border-[#d3e4fe] dark:border-[#1e324c] text-[#0b1c30] dark:text-[#f1f5f9] relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-[#757682] hover:text-[#0b1c30] dark:hover:text-white p-1 rounded-lg"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="StudyMate Logo"
                className="w-12 h-12 rounded-xl shadow-md border border-[#38bdf8]/40"
              />
              <div>
                <h3 className="text-base font-black leading-tight text-[#00236f] dark:text-[#60a5fa]">
                  Install StudyMate Sarkari
                </h3>
                <p className="text-xs text-[#444651] dark:text-[#94a3b8]">
                  Web App for Android, iPhone &amp; PC
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs bg-[#eff4ff] dark:bg-[#0b172a] p-4 rounded-xl border border-[#d3e4fe] dark:border-[#1e324c]">
                <p className="font-bold text-[#00236f] dark:text-[#93c5fd]">
                  How to install on iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-2 text-[#444651] dark:text-[#cbd5e1] leading-relaxed">
                  <li>
                    Tap the <strong>Share button</strong>{' '}
                    <span className="material-symbols-outlined text-[15px] align-middle">ios_share</span> in Safari's bottom toolbar.
                  </li>
                  <li>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>{' '}
                    <span className="material-symbols-outlined text-[15px] align-middle">add_box</span>.
                  </li>
                  <li>
                    Tap <strong>"Add"</strong> on top-right. StudyMate icon will appear on your home screen!
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs bg-[#eff4ff] dark:bg-[#0b172a] p-4 rounded-xl border border-[#d3e4fe] dark:border-[#1e324c]">
                <p className="font-bold text-[#00236f] dark:text-[#93c5fd]">
                  How to install on Chrome / Edge / Android:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-[#444651] dark:text-[#cbd5e1] leading-relaxed">
                  <li>
                    Tap the browser menu <strong>(3 dots ⋮)</strong> in the top-right corner.
                  </li>
                  <li>
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </li>
                  <li>
                    Confirm <strong>Install</strong> to get fast, offline-ready sarkari job updates!
                  </li>
                </ol>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#00236f] text-white text-xs font-bold hover:bg-[#00174c] transition"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {installSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-[#16a34a] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          StudyMate Web App installed successfully!
        </div>
      )}
    </>
  );
};
