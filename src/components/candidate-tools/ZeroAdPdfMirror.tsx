import React, { useState } from 'react';

interface ZeroAdPdfMirrorProps {
  officialPdfUrl?: string;
  jobTitle?: string;
  advtNo?: string;
}

export const ZeroAdPdfMirror: React.FC<ZeroAdPdfMirrorProps> = ({
  officialPdfUrl = 'https://ssc.gov.in',
  jobTitle = 'Official Gazette Notification',
  advtNo = 'EN/2026/01',
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleInstantDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      window.open(officialPdfUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 600);
  };

  return (
    <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-[#00236f] rounded-2xl p-5 text-white shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <span className="material-symbols-outlined text-rose-300 text-[28px]">picture_as_pdf</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                100% Zero-Ads Mirror
              </span>
              <span className="text-[11px] text-white/80 font-mono">{advtNo}</span>
            </div>
            <h3 className="font-display font-black text-sm sm:text-base text-white mt-1">
              Direct Official Notification PDF (Bypass 3rd Party Ads)
            </h3>
            <p className="text-xs text-white/70">
              Download clean official notification gazette directly from central high-speed CDN without annoying popups or multi-step redirects.
            </p>
          </div>
        </div>

        <button
          onClick={handleInstantDownload}
          disabled={downloading}
          className="w-full sm:w-auto bg-white hover:bg-rose-50 text-rose-900 font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">
            {downloading ? 'sync' : downloadSuccess ? 'task_alt' : 'download'}
          </span>
          <span>
            {downloading
              ? 'Connecting High-Speed Mirror...'
              : downloadSuccess
              ? 'Opening Direct PDF! ✅'
              : 'Download Official PDF (Direct)'}
          </span>
        </button>
      </div>
    </div>
  );
};
