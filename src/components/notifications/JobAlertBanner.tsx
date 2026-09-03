import React from 'react';
import { Bell, Sparkles, SlidersHorizontal, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useNotificationPreferences } from '../../lib/notifications/NotificationContext';

interface JobAlertBannerProps {
  className?: string;
}

export const JobAlertBanner: React.FC<JobAlertBannerProps> = ({ className = '' }) => {
  const { preferences, openPreferencesModal, permissionState } = useNotificationPreferences();

  const selectedCount = preferences.categories.length;
  const statesCount = preferences.states.includes('ALL') ? 'All India' : `${preferences.states.length} states`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/60 via-[#0c1425] to-indigo-950/60 border border-cyan-500/30 p-4 sm:p-5 shadow-xl shadow-cyan-950/30 ${className}`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Tailored Push Alerts
              </span>
              {permissionState === 'granted' ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Push Active
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Customizable
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Get Notified When Jobs Open in Your Preferred State & Exam Board
            </h3>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Active filters:{' '}
              <strong className="text-cyan-300">{selectedCount} exam categories</strong> across{' '}
              <strong className="text-cyan-300">{statesCount}</strong>. We instantly alert you to official vacancy releases.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={openPreferencesModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 hover:scale-[1.02]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Customize My Alerts</span>
          </button>
        </div>
      </div>
    </div>
  );
};
