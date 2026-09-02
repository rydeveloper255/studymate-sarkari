import React from 'react';

interface LoadingStateProps {
  message?: string;
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading government vacancies and exam updates...',
  count = 3,
}) => {
  return (
    <div className="w-full space-y-4 py-6" role="status" aria-label="Loading content">
      <div className="flex items-center justify-center gap-3 text-slate-400 text-sm mb-4">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>{message}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-pulse space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-800 rounded w-1/4" />
            </div>
            <div className="h-6 bg-slate-800 rounded w-4/5" />
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-800 rounded w-2/3" />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-800/60">
              <div className="h-4 bg-slate-800 rounded w-1/4" />
              <div className="h-7 bg-slate-800 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
