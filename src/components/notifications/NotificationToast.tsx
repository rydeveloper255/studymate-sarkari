import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useNotificationPreferences } from '../../lib/notifications/NotificationContext';

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast } = useNotificationPreferences();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-[#0d1527] border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Tailored Alert
            </span>
            <span className="text-[10px] text-slate-400">{activeToast.timestamp}</span>
          </div>

          <h4 className="text-xs font-bold text-white line-clamp-1">
            {activeToast.title}
          </h4>

          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            {activeToast.category && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {activeToast.category}
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {activeToast.url && (
                <Link
                  to={activeToast.url}
                  onClick={dismissToast}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>View Jobs</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={dismissToast}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
