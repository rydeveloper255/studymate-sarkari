import React from 'react';
import { JobItem, AdmitCardItem, ResultItem, AnswerKeyItem } from '../types';
import { ALL_INDIAN_STATES } from '../data/mockData';
import { HomeHeroBanner } from './HomeHeroBanner';
import { BentoHomeGrid } from './BentoHomeGrid';
import { InteractiveIndiaMap } from './InteractiveIndiaMap';
import { useLanguage } from '../context/LanguageContext';

export interface HomeViewProps {
  jobs: JobItem[];
  admitCards: AdmitCardItem[];
  results: ResultItem[];
  answerKeys: AnswerKeyItem[];
  onNavigate: (tab: string, jobId?: string) => void;
  onSearch?: (q: string) => void;
  onSelectJob?: (job: JobItem) => void;
  onSelectState?: (st: string) => void;
  onUnlockAdmin?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  jobs,
  admitCards,
  results,
  answerKeys,
  onNavigate,
  onSearch,
  onSelectJob,
  onSelectState,
  onUnlockAdmin,
}) => {
  const [localSearch, setLocalSearch] = React.useState('');
  const { language, t } = useLanguage();

  const handleHeroSearch = (query: string) => {
    const trimmed = query.trim();
    if (/^adminy\s*n$/i.test(trimmed) || trimmed.toLowerCase() === 'adminyn') {
      if (onUnlockAdmin) {
        onUnlockAdmin();
        setLocalSearch('');
        return;
      }
    }
    if (onSearch) {
      onSearch(query);
    }
    onNavigate('latest-jobs');
  };
  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 0. Official Top Heading Banner (StudyMate Sarkari All-in-One Gateway) */}
      <HomeHeroBanner onNavigate={onNavigate} />

      {/* 1. Flash Gazette Bulletin Bar */}
      <div className="bg-[#ffdcc3] border-l-4 border-[#904d00] rounded-r-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#904d00] text-[20px] animate-bounce">
            campaign
          </span>
          <span className="text-xs font-bold text-[#2f1500]">
            <strong className="text-[#904d00]">Flash Alert:</strong> SSC CGL 2025 (17,727 Posts) application window closes in 3 days. Railway RRB NTPC CEN 05/2025 portal is live!
          </span>
        </div>
        <button
          onClick={() => onNavigate('job-detail', 'ssc-cgl-2025')}
          className="text-xs font-extrabold text-[#904d00] hover:text-[#6e3900] underline flex items-center gap-1 shrink-0"
        >
          Apply Now <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>

      {/* 2. Hero Search Section with Rich Backdrop */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#00236f] via-[#1e3a8a] to-[#00164e] p-6 md:p-10 text-white shadow-xl overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#90a8ff]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-[#ffdcc3]/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#85f8c4] animate-ping"></span>
            100% Official Gazette & Commission Verified
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
            Find 1,24,800+ Verified Government Job Vacancies Across India
          </h1>
          <p className="text-white/80 text-sm md:text-base mt-2 max-w-2xl">
            Live updates for Central Ministries, SSC, UPSC, Railways, Banking, Defence, State PSCs & Police recruitments.
          </p>

          {/* Quick Hero Search Input */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-[#070e1e] p-1.5 rounded-xl shadow-2xl border border-white/20 dark:border-[#1e324c]">
            <div className="flex items-center flex-1 px-3 w-full">
              <span className="material-symbols-outlined text-[#757682] dark:text-[#94a3b8] mr-2 text-[22px]">search</span>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search SSC CGL, RRB NTPC, UP Police or type adminY n..."
                className="w-full text-[#0b1c30] dark:text-white placeholder:text-[#757682] dark:placeholder:text-[#64748b] bg-transparent text-sm py-2 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleHeroSearch(localSearch);
                  }
                }}
              />
            </div>
            <button
              onClick={() => handleHeroSearch(localSearch)}
              className="w-full sm:w-auto bg-[#904d00] hover:bg-[#6e3900] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Search Vacancies</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Trending Search Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/60 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> Trending:
            </span>
            {[
              { label: 'SSC CGL 2025 (17.7K)', id: 'ssc-cgl-2025' },
              { label: 'Railway RRB NTPC (11.5K)', id: 'rrb-ntpc-2025' },
              { label: 'UP Police SI (4.2K)', id: 'up-police-si-2025' },
              { label: 'UPSC CDS II 2025', id: 'upsc-cds-2025' },
              { label: 'IBPS PO XV', id: 'ibps-po-2025' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => onNavigate('job-detail', chip.id)}
                className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border border-white/15"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 4 Primary Quick Access Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Latest Jobs Card */}
        <div
          onClick={() => onNavigate('latest-jobs')}
          className="bg-white hover:bg-[#eff4ff] border border-[#d3e4fe] rounded-2xl p-4 md:p-5 cursor-pointer shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#dce1ff] text-[#00236f] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">work</span>
            </div>
            <span className="text-[11px] font-bold bg-[#85f8c4] text-[#002114] px-2 py-0.5 rounded-full">
              1,480+ Live
            </span>
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#0b1c30] group-hover:text-[#00236f]">
              Latest Jobs
            </h3>
            <p className="text-xs text-[#444651] mt-0.5">Central & State vacancies with direct apply links</p>
          </div>
        </div>

        {/* Admit Card Card */}
        <div
          onClick={() => onNavigate('admit-card')}
          className="bg-white hover:bg-[#eff4ff] border border-[#d3e4fe] rounded-2xl p-4 md:p-5 cursor-pointer shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">badge</span>
            </div>
            <span className="text-[11px] font-bold bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full">
              Hall Tickets
            </span>
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#0b1c30] group-hover:text-[#904d00]">
              Admit Card
            </h3>
            <p className="text-xs text-[#444651] mt-0.5">Exam center city slips & hall ticket downloads</p>
          </div>
        </div>

        {/* Results Card */}
        <div
          onClick={() => onNavigate('results')}
          className="bg-white hover:bg-[#eff4ff] border border-[#d3e4fe] rounded-2xl p-4 md:p-5 cursor-pointer shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#85f8c4] text-[#002114] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
            </div>
            <span className="text-[11px] font-bold bg-[#dce1ff] text-[#00164e] px-2 py-0.5 rounded-full">
              Merit Lists
            </span>
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#0b1c30] group-hover:text-[#004a32]">
              Sarkari Results
            </h3>
            <p className="text-xs text-[#444651] mt-0.5">Scorecards, cut-off marks & selection lists</p>
          </div>
        </div>

        {/* Answer Key Card */}
        <div
          onClick={() => onNavigate('answer-key')}
          className="bg-white hover:bg-[#eff4ff] border border-[#d3e4fe] rounded-2xl p-4 md:p-5 cursor-pointer shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#e5eeff] text-[#00236f] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">key</span>
            </div>
            <span className="text-[11px] font-bold bg-[#eff4ff] text-[#444651] px-2 py-0.5 rounded-full">
              Objection Link
            </span>
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#0b1c30] group-hover:text-[#00236f]">
              Answer Key
            </h3>
            <p className="text-xs text-[#444651] mt-0.5">Response sheets & online objection challenge</p>
          </div>
        </div>
      </div>

      {/* Official WhatsApp Channel Join Banner */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#075E54] flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
            📲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Official WhatsApp Channel
              </span>
              <span className="text-emerald-100 text-xs font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> 2.5L+ Aspirants
              </span>
            </div>
            <h3 className="font-display font-black text-base sm:text-lg text-white mt-0.5">
              Get Instant Job, Result &amp; Admit Card Alerts on WhatsApp
            </h3>
            <p className="text-white/90 text-xs">
              Direct official notifications &amp; direct apply links delivered straight to your WhatsApp.
            </p>
          </div>
        </div>
        <a
          href="https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z"
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto px-5 py-2.5 bg-white text-[#075E54] hover:bg-emerald-50 rounded-xl font-black text-xs shadow-md transition-all hover:scale-105 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] text-[#25D366]">chat</span>
          <span>Join WhatsApp Channel</span>
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </a>
      </div>

      {/* Official Bento-Grid Spotlight (Feature 5 UI without Quiz Tile 3) */}
      <BentoHomeGrid
        jobs={jobs}
        admitCards={admitCards}
        results={results}
        onNavigate={onNavigate}
        onSelectJob={onSelectJob || (() => {})}
      />

      {/* 4. 3-Column Direct Recruitment Noticeboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Sarkari Results */}
        <div className="bg-white rounded-2xl border border-[#d3e4fe] shadow-xs overflow-hidden flex flex-col">
          <div className="bg-[#00236f] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">emoji_events</span>
              <h2 className="font-display font-bold text-sm">Latest Results</h2>
            </div>
            <button
              onClick={() => onNavigate('results')}
              className="text-xs font-semibold text-[#90a8ff] hover:text-white underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-[#eff4ff] flex-1">
            {results.slice(0, 5).map((res) => (
              <div
                key={res.id}
                onClick={() => onNavigate('results')}
                className="p-3.5 hover:bg-[#eff4ff] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {res.isNew && (
                    <span className="bg-[#ba1a1a] text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                      New
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-[#444651] bg-[#eff4ff] px-1.5 py-0.5 rounded">
                    {res.board}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#0b1c30] group-hover:text-[#00236f] leading-snug line-clamp-2">
                  {res.title}
                </h3>
                <div className="flex items-center justify-between mt-2 text-[11px] text-[#757682]">
                  <span>Declared: {res.declaredDate}</span>
                  <span className="text-[#00236f] font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                    Check →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Admit Card & City Slips */}
        <div className="bg-white rounded-2xl border border-[#d3e4fe] shadow-xs overflow-hidden flex flex-col">
          <div className="bg-[#904d00] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
              <h2 className="font-display font-bold text-sm">Admit Card Hub</h2>
            </div>
            <button
              onClick={() => onNavigate('admit-card')}
              className="text-xs font-semibold text-[#ffdcc3] hover:text-white underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-[#eff4ff] flex-1">
            {admitCards.slice(0, 5).map((card) => (
              <div
                key={card.id}
                onClick={() => onNavigate('admit-card')}
                className="p-3.5 hover:bg-[#eff4ff] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="bg-[#ffdcc3] text-[#2f1500] text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                    {card.statusBadge}
                  </span>
                  <span className="text-[10px] font-bold text-[#444651] bg-[#eff4ff] px-1.5 py-0.5 rounded">
                    {card.commission}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#0b1c30] group-hover:text-[#904d00] leading-snug line-clamp-2">
                  {card.title}
                </h3>
                <div className="flex items-center justify-between mt-2 text-[11px] text-[#757682]">
                  <span>Exam: {card.examDateFormatted}</span>
                  <span className="text-[#904d00] font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                    Download →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Latest Jobs */}
        <div className="bg-white rounded-2xl border border-[#d3e4fe] shadow-xs overflow-hidden flex flex-col">
          <div className="bg-[#003120] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">campaign</span>
              <h2 className="font-display font-bold text-sm">Latest Jobs</h2>
            </div>
            <button
              onClick={() => onNavigate('latest-jobs')}
              className="text-xs font-semibold text-[#85f8c4] hover:text-white underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-[#eff4ff] flex-1">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                onClick={() => onNavigate('job-detail', job.id)}
                className="p-3.5 hover:bg-[#eff4ff] transition-colors cursor-pointer group"
              >
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {job.isClosingSoon ? (
                    <span className="bg-[#ba1a1a] text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      Ending Soon
                    </span>
                  ) : (
                    <span className="bg-[#85f8c4] text-[#002114] text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                      New Today
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold text-[#00236f] bg-[#dce1ff] px-1.5 py-0.5 rounded">
                    {job.vacanciesFormatted} Posts
                  </span>
                  <span className="text-[10px] text-[#444651] font-semibold">{job.state}</span>
                </div>
                <h3 className="text-xs font-bold text-[#0b1c30] group-hover:text-[#00236f] leading-snug line-clamp-2">
                  {job.shortTitle || job.title}
                </h3>
                <div className="flex items-center justify-between mt-2 text-[11px] text-[#757682]">
                  <span className="font-medium">Last Date: {job.lastDate.split('(')[0]}</span>
                  <span className="text-[#003120] font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                    Apply →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4.5. 12 Candidate Study Tools Interactive Showcase */}
      <div className="bg-gradient-to-br from-[#00236f] via-[#001c59] to-[#003120] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#85f8c4] text-[#002114] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Aspirant Utilities
              </span>
              <span className="text-white/80 text-xs font-semibold">12 Self-Service Tools</span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
              Candidate Study Tools &amp; Form Fill Calculators
            </h2>
            <p className="text-xs text-white/80 mt-0.5">
              Photo name/date stamping, age relaxation, OMR simulator, typing test, negative marking &amp; syllabus tracker.
            </p>
          </div>
          <button
            onClick={() => onNavigate('candidate-tools')}
            className="px-4 py-2 bg-[#85f8c4] hover:bg-[#85f8c4]/90 text-[#002114] font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Open All 12 Tools</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: 'Photo & Date Adder', icon: 'badge', desc: 'Add DOP/Name' },
            { name: 'Age Relaxation', icon: 'cake', desc: 'OBC/SC/ST/PwD Cutoff' },
            { name: 'Negative Marking', icon: 'calculate', desc: '1/3rd & 1/4th Score' },
            { name: 'Fee Exemption', icon: 'payments', desc: 'Category Fee Waiver' },
            { name: 'OMR Sheet Simulator', icon: 'radio_button_checked', desc: 'Practice & Print A4' },
            { name: 'Typing Speed Test', icon: 'keyboard', desc: 'Hindi & English WPM' },
            { name: 'Syllabus Tracker', icon: 'checklist', desc: 'Chapter Progress' },
            { name: 'DV & Certificate Check', icon: 'verified_user', desc: 'EWS/OBC-NCL Validity' },
            { name: 'Exam Travel Planner', icon: 'directions_transit', desc: 'Route & Gate Time' },
            { name: 'Zone Preferences', icon: 'reorder', desc: 'RRB & SSC Vacancies' },
            { name: 'Photo Resizer', icon: 'crop', desc: 'Exact px & 20-50KB' },
            { name: 'CBT Normalizer', icon: 'functions', desc: 'Shift Marks Estimator' },
          ].map((tool) => (
            <button
              key={tool.name}
              onClick={() => onNavigate('candidate-tools')}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-left transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/15 text-[#85f8c4] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[18px]">{tool.icon}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-white block line-clamp-1">{tool.name}</span>
                <span className="text-[10px] text-white/70 block mt-0.5">{tool.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Interactive India Map & State Explorer (UI Suggestion 2) */}
      <InteractiveIndiaMap
        onSelectState={(st) => {
          if (onSelectState) onSelectState(st);
          onNavigate('state-wise');
        }}
        onNavigate={onNavigate}
      />

      {/* 6. Popular Exam Categories Bar */}
      <div className="bg-[#eff4ff] rounded-2xl p-6 border border-[#d3e4fe]">
        <h2 className="font-display font-extrabold text-base text-[#00236f] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">category</span>
          Recruitment Sectors
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Staff Selection (SSC)', count: '48,200+ Posts', cat: 'SSC' },
            { label: 'Indian Railways (RRB)', count: '32,500+ Posts', cat: 'Railway' },
            { label: 'Banking & IBPS', count: '14,800+ Posts', cat: 'Banking' },
            { label: 'UPSC & Civil Services', count: '2,400+ Posts', cat: 'UPSC' },
            { label: 'Defence & Agniveer', count: '18,900+ Posts', cat: 'Defence' },
            { label: 'State Police Bharti', count: '68,000+ Posts', cat: 'Police' },
            { label: 'Teaching & TET', count: '29,400+ Posts', cat: 'Teaching' },
          ].map((sec) => (
            <button
              key={sec.label}
              onClick={() => onNavigate('latest-jobs')}
              className="bg-white hover:bg-[#00236f] text-[#0b1c30] hover:text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs border border-[#d3e4fe] transition-all flex items-center gap-2 group"
            >
              <span>{sec.label}</span>
              <span className="bg-[#eff4ff] group-hover:bg-white/20 group-hover:text-white text-[#00236f] text-[10px] px-2 py-0.5 rounded-md font-bold">
                {sec.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
