import React from 'react';
import { SearchX, ArrowRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onReset?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No matching government vacancies or notifications available under selected filters.',
  actionLabel = 'Explore All Jobs',
  actionHref = '/jobs',
  onReset,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 my-4">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
        {icon || <SearchX className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-2 font-display">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700/60"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Filters
          </button>
        )}
        {actionHref && (
          <Link
            to={actionHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-sm shadow-blue-500/20"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
};
