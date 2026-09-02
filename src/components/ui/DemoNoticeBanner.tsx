import React, { useState } from 'react';
import { Info, X, ShieldAlert } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-indigo-950/80 border-b border-blue-500/20 text-xs text-slate-300 px-4 py-2 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5" />
            STEP 1 FOUNDATION
          </span>
          <span className="text-slate-300">
            All vacancy listings, dates, and updates displayed currently are <strong>DEMO & PLACEHOLDER DATA</strong> for UI foundation testing. Official data integration begins in later steps.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-200 p-1 transition-colors flex-shrink-0"
          aria-label="Dismiss demo notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
