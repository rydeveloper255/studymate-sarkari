import React, { useState, useMemo } from 'react';
import { JobItem, JobCategory, QualificationLevel } from '../types';
import { ALL_INDIAN_STATES } from '../data/mockData';

export interface LatestJobsViewProps {
  jobs: JobItem[];
  bookmarkedJobIds: string[];
  onToggleBookmark: (jobId: string) => void;
  onSelectJob: (jobId: string) => void;
  onNavigate: (tab: string) => void;
  initialSearchQuery?: string;
}

export const LatestJobsView: React.FC<LatestJobsViewProps> = ({
  jobs,
  bookmarkedJobIds,
  onToggleBookmark,
  onSelectJob,
  onNavigate,
  initialSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedQualification, setSelectedQualification] = useState<QualificationLevel>('All');
  const [sortBy, setSortBy] = useState<'latest' | 'vacancies' | 'deadline'>('latest');

  const qualifications: QualificationLevel[] = [
    'All',
    '10th Pass',
    '12th Pass',
    'Graduate',
    'Post Graduate',
    'Engineering',
    'Diploma',
    'ITI',
    'Teaching',
    'Medical',
  ];

  const categories: JobCategory[] = [
    'All',
    'SSC',
    'Railway',
    'Banking',
    'UPSC',
    'Defence',
    'Police',
    'State PSC',
    'Teaching',
  ];

  // Filter and Sort Logic
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const matchesSearch =
          !searchQuery.trim() ||
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.shortTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.advtNo.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
        const matchesState = selectedState === 'All' || job.state === selectedState;
        const matchesQual =
          selectedQualification === 'All' || job.qualificationLevel === selectedQualification;

        return matchesSearch && matchesCategory && matchesState && matchesQual;
      })
      .sort((a, b) => {
        if (sortBy === 'vacancies') return b.vacanciesCount - a.vacanciesCount;
        if (sortBy === 'deadline') return a.lastDate.localeCompare(b.lastDate);
        return 0; // default latest order
      });
  }, [jobs, searchQuery, selectedCategory, selectedState, selectedQualification, sortBy]);

  const totalFilteredVacancies = useMemo(() => {
    return filteredJobs.reduce((acc, curr) => acc + (curr.vacanciesCount || 0), 0);
  }, [filteredJobs]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Breadcrumb Bar */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#00236f] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] font-bold">Latest Sarkari Jobs & Vacancies 2025</span>
      </nav>

      {/* 2. Header Banner & Metric Ticker */}
      <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {filteredJobs.length} Notifications Active
            </span>
            <span className="bg-[#ffdcc3] text-[#2f1500] text-[11px] font-bold px-2 py-0.5 rounded-full">
              {totalFilteredVacancies.toLocaleString()} Total Vacancies
            </span>
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-[#00236f] tracking-tight">
            Latest Government Jobs & Vacancies (2025-26)
          </h1>
          <p className="text-xs md:text-sm text-[#444651] mt-1">
            Official central and state recruitment notifications with direct apply links, salary scales & syllabus.
          </p>
        </div>

        <button
          onClick={() => onNavigate('telegram-bot')}
          className="bg-[#003120] hover:bg-[#004a32] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          Get Hourly Alerts via Bot
        </button>
      </div>

      {/* 3. Multi-Attribute Filter Console */}
      <div className="bg-white rounded-2xl border border-[#d3e4fe] p-4 md:p-5 shadow-xs space-y-3">
        {/* Search and Dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2">
            <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">search</span>
            <input
              type="text"
              placeholder="Search by post, board, advt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#0b1c30] placeholder:text-[#757682] focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#757682] hover:text-[#0b1c30]">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Sector / Commission Filter */}
          <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2">
            <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as JobCategory)}
              className="w-full bg-transparent text-xs text-[#0b1c30] font-semibold focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Sector: {c === 'All' ? 'All Sectors' : c}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2">
            <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">location_on</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-transparent text-xs text-[#0b1c30] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">Location: All India & States</option>
              <option value="All India">Central (All India)</option>
              {ALL_INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2">
            <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-transparent text-xs text-[#0b1c30] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="latest">Sort: Latest Notification</option>
              <option value="vacancies">Sort: Highest Vacancies</option>
              <option value="deadline">Sort: Closing Soonest</option>
            </select>
          </div>
        </div>

        {/* Qualification Pills */}
        <div className="pt-2 border-t border-[#eff4ff] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-[#757682] shrink-0 uppercase tracking-wider">
            Qualification:
          </span>
          {qualifications.map((q) => {
            const isSelected = selectedQualification === q;
            return (
              <button
                key={q}
                onClick={() => setSelectedQualification(q)}
                className={`text-xs px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#00236f] text-white shadow-xs'
                    : 'bg-[#eff4ff] text-[#444651] hover:bg-[#dce9ff] hover:text-[#00236f]'
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Layout: Jobs List (Left) + Utility Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Job Cards List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#d3e4fe] p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-[#757682] mb-2">search_off</span>
              <h3 className="font-bold text-base text-[#0b1c30]">No matching vacancies found</h3>
              <p className="text-xs text-[#757682] mt-1">Try resetting your filters or search keywords.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedState('All');
                  setSelectedQualification('All');
                }}
                className="mt-4 bg-[#00236f] text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isSaved = bookmarkedJobIds.includes(job.id);
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group"
                >
                  {/* Top Left Urgency Ribbon */}
                  {job.isClosingSoon && (
                    <div className="absolute top-0 right-0 bg-[#ba1a1a] text-white text-[10px] font-black px-3 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      Closing Soon
                    </div>
                  )}

                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between gap-3 mb-2 pr-20">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-[#dce1ff] text-[#00164e] text-[11px] font-extrabold px-2.5 py-0.5 rounded-md">
                          {job.category}
                        </span>
                        <span className="text-[11px] font-bold text-[#444651] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                          {job.state}
                        </span>
                        <span className="text-[11px] font-bold text-[#757682]">{job.advtNo}</span>
                      </div>
                      <button
                        onClick={() => onToggleBookmark(job.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSaved
                            ? 'text-[#904d00] bg-[#ffdcc3]'
                            : 'text-[#757682] hover:text-[#00236f] hover:bg-[#eff4ff]'
                        }`}
                        title={isSaved ? 'Remove from Saved' : 'Save this job'}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {isSaved ? 'bookmark_added' : 'bookmark_add'}
                        </span>
                      </button>
                    </div>

                    {/* Job Title */}
                    <h2
                      onClick={() => onSelectJob(job.id)}
                      className="font-display font-extrabold text-base md:text-lg text-[#0b1c30] group-hover:text-[#00236f] transition-colors cursor-pointer leading-snug"
                    >
                      {job.title}
                    </h2>

                    <p className="text-xs font-semibold text-[#00236f] mt-1">{job.department}</p>

                    {/* Specifications Grid */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#eff4ff]/60 p-3 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#757682] block">Total Posts</span>
                        <span className="font-extrabold text-[#00236f] text-sm">
                          {job.vacanciesFormatted} Posts
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#757682] block">Pay Scale</span>
                        <span className="font-bold text-[#0b1c30]">{job.payLevel}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#757682] block">Last Date</span>
                        <span className="font-bold text-[#904d00]">{job.lastDate.split('(')[0]}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#757682] block">Eligibility</span>
                        <span className="font-bold text-[#0b1c30] truncate block">{job.qualificationLevel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-4 pt-3 border-t border-[#eff4ff] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#004a32] font-bold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Official Gazette Verified</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectJob(job.id)}
                        className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00236f] text-xs font-bold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        View Full Details
                      </button>
                      <button
                        onClick={() => onSelectJob(job.id)}
                        className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                      >
                        Apply Online
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 1 Col: Sidebar Widgets */}
        <div className="space-y-6">
          {/* Ending This Week Tracker */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs">
            <h3 className="font-display font-bold text-sm text-[#00236f] flex items-center gap-1.5 mb-3">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">alarm</span>
              Ending This Week
            </h3>
            <div className="space-y-3">
              {jobs
                .filter((j) => j.isClosingSoon)
                .slice(0, 3)
                .map((j) => (
                  <div
                    key={j.id}
                    onClick={() => onSelectJob(j.id)}
                    className="p-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-[#93000a] bg-[#ffdad6] px-1.5 py-0.2 rounded">
                        {j.closingDaysLeft ? `${j.closingDaysLeft} Days Left` : 'Closing Soon'}
                      </span>
                      <span className="font-bold text-[#00236f]">{j.vacanciesFormatted} Posts</span>
                    </div>
                    <p className="text-xs font-bold text-[#0b1c30] mt-1 line-clamp-1">{j.shortTitle}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Instant Age Eligibility Calculator Mini-Widget */}
          <div className="bg-gradient-to-br from-[#eff4ff] to-[#dce9ff] rounded-2xl border border-[#d3e4fe] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#00236f] text-[20px]">calculate</span>
              <h3 className="font-display font-bold text-sm text-[#00236f]">Age Eligibility Tool</h3>
            </div>
            <p className="text-xs text-[#444651] mb-3">
              Check if you are eligible for central and state exams as per crucial date cutoff.
            </p>
            <button
              onClick={() => onNavigate('candidate-tools')}
              className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold py-2 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1"
            >
              Open Age Calculator <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>

          {/* Telegram Channel Ad Card */}
          <div className="bg-[#003120] rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#85f8c4] text-[22px]">send</span>
              <h3 className="font-display font-bold text-sm text-white">Join 2.5L+ Aspirants</h3>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Get hourly job notifications pushed to your phone the second they release on government portals.
            </p>
            <button
              onClick={() => onNavigate('telegram-bot')}
              className="mt-3 w-full bg-[#85f8c4] hover:bg-[#68dba9] text-[#002114] text-xs font-black py-2 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1"
            >
              Configure Telegram Bot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
