import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Sparkles, Building2, MapPin } from 'lucide-react';

interface QuickSearchBarProps {
  placeholder?: string;
  initialValue?: string;
  compact?: boolean;
  onSearch?: (query: string) => void;
}

export const QuickSearchBar: React.FC<QuickSearchBarProps> = ({
  placeholder = 'Search jobs, exams, organizations (e.g. UPSC, SSC, Bihar, Railway)...',
  initialValue = '',
  compact = false,
  onSearch,
}) => {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    } else {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleQuickTag = (tag: string) => {
    setQuery(tag);
    if (onSearch) {
      onSearch(tag);
    } else {
      navigate(`/search?q=${encodeURIComponent(tag)}`);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearchSubmit} className="relative group">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none">
            <Search className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 placeholder-slate-400 transition-all shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
              compact
                ? 'py-2.5 pl-10 pr-20 text-sm'
                : 'py-4 pl-12 pr-28 text-sm sm:text-base'
            }`}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className={`absolute text-slate-400 hover:text-slate-200 p-1 transition-colors ${
                compact ? 'right-16' : 'right-24'
              }`}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className={`absolute right-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 ${
              compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
            }`}
          >
            <span>Search</span>
          </button>
        </div>
      </form>

      {!compact && (
        <div className="flex items-center gap-2 mt-3 flex-wrap text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Popular:
          </span>
          {['UPSC', 'SSC CGL', 'Railway ALP', 'Bihar BPSC', 'UP Police', 'Banking PO', 'Admit Card'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleQuickTag(tag)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
