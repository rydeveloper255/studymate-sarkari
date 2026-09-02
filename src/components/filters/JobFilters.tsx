import React from 'react';
import { Filter, RotateCcw, Building2, MapPin, GraduationCap, ArrowUpDown, Check } from 'lucide-react';
import { ALL_STATES_AND_UTS } from '../../data/statesData';
import { JobFilterState } from '../../types';

interface JobFiltersProps {
  filters: JobFilterState;
  onChange: (updatedFilters: Partial<JobFilterState>) => void;
  onReset: () => void;
  totalResultsCount: number;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalResultsCount,
}) => {
  const centralCategories = [
    'All Central',
    'UPSC',
    'SSC',
    'Railway',
    'Banking',
    'Defence',
    'Postal',
    'Public Sector',
    'Other Central Government',
  ];

  const qualifications = [
    'All Qualifications',
    '10th / Matric Pass',
    '12th / Intermediate',
    'ITI / Diploma',
    'Graduate / Bachelor Degree',
    'Post Graduate / Masters',
    'Engineering / B.Tech',
    'B.Ed / Teaching Degree',
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header with Title & Reset */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-slate-100 font-display">Filter Vacancies</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30">
            {totalResultsCount} found
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Primary Sector Tabs (All / Central / State) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Government Sector
        </label>
        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onChange({ sector: 'all' })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              filters.sector === 'all'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Sectors
          </button>
          <button
            type="button"
            onClick={() => onChange({ sector: 'central' })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              filters.sector === 'central'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Central Govt
          </button>
          <button
            type="button"
            onClick={() => onChange({ sector: 'state' })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              filters.sector === 'state'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            State Govt
          </button>
        </div>
      </div>

      {/* Grid of Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* State Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>State / UT</span>
          </label>
          <select
            value={filters.state}
            onChange={(e) => onChange({ state: e.target.value })}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All States & UTs (36)</option>
            {ALL_STATES_AND_UTS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.type === 'state' ? 'State' : 'UT'})
              </option>
            ))}
          </select>
        </div>

        {/* Central Category */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Central Category</span>
          </label>
          <select
            value={filters.centralCategory}
            onChange={(e) => onChange({ centralCategory: e.target.value })}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {centralCategories.slice(1).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Qualification */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span>Qualification</span>
          </label>
          <select
            value={filters.qualification}
            onChange={(e) => onChange({ qualification: e.target.value })}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Qualifications</option>
            {qualifications.slice(1).map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort Vacancies</span>
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as any })}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="latest">Latest Published First</option>
            <option value="last_date">Closing Soonest First</option>
            <option value="vacancies">Highest Vacancy Count</option>
          </select>
        </div>
      </div>
    </div>
  );
};
