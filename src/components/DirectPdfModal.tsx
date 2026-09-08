import React from 'react';

interface DirectPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

export const DirectPdfModal: React.FC<DirectPdfModalProps> = ({ isOpen, onClose, pdfUrl, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#101b2c] rounded-3xl max-w-4xl w-full h-[90vh] shadow-2xl border border-[#d3e4fe] dark:border-[#1e324c] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 bg-gradient-to-r from-[#00236f] to-[#0038a8] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="material-symbols-outlined text-amber-400 text-[22px] shrink-0">picture_as_pdf</span>
            <div className="truncate">
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white truncate">
                {title}
              </h3>
              <p className="text-[11px] text-white/80">Official Gazette Document / Merit List PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="px-3 py-1.5 rounded-xl bg-white text-[#00236f] hover:bg-slate-100 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="hidden sm:inline">Save PDF</span>
            </a>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Open in new tab"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Embedded Viewer with Fallback */}
        <div className="flex-1 bg-slate-100 dark:bg-[#070e1e] relative">
          <iframe
            src={`${pdfUrl}#toolbar=1`}
            title={title}
            className="w-full h-full border-0"
          />
          {/* Overlay notice in case browser blocks iframe for external gov domain */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-[#101b2c]/95 border border-[#d3e4fe] dark:border-[#1e324c] px-4 py-2 rounded-2xl shadow-lg flex items-center gap-3 text-xs">
            <span className="text-[#444651] dark:text-[#cbd5e1]">
              If PDF preview does not render due to commission security policy:
            </span>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[#00236f] dark:text-[#38bdf8] underline flex items-center gap-1"
            >
              Open Direct PDF Link <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
