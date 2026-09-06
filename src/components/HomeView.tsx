import React from 'react';
import { JobItem, AdmitCardItem, ResultItem, AnswerKeyItem } from '../types';
import { ALL_INDIAN_STATES } from '../data/mockData';

export interface HomeViewProps {
  jobs: JobItem[];
  admitCards: AdmitCardItem[];
  results: ResultItem[];
  answerKeys: AnswerKeyItem[];
  onNavigate: (tab: string, jobId?: string) => void;
  onSearch: (q: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  jobs,
  admitCards,
  results,
  answerKeys,
  onNavigate,
  onSearch,
}) => {
  return (
    <div className="space-y-8 pb-12 font-sans">
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
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-2 bg-white p-1.5 rounded-xl shadow-2xl">
            <div className="flex items-center flex-1 px-3 w-full">
              <span className="material-symbols-outlined text-[#757682] mr-2 text-[22px]">search</span>
              <input
                type="text"
                placeholder="Search SSC CGL, RRB NTPC, UP Police, BPSC, Admit Card..."
                className="w-full text-[#0b1c30] placeholder:text-[#757682] text-sm py-2 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSearch((e.target as HTMLInputElement).value);
                    onNavigate('latest-jobs');
                  }
                }}
              />
            </div>
            <button
              onClick={() => onNavigate('latest-jobs')}
              className="w-full sm:w-auto bg-[#904d00] hover:bg-[#6e3900] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
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
                <div className="flex items-center gap-1.5 mb-1">
                  {job.isClosingSoon && (
                    <span className="bg-[#ffdad6] text-[#93000a] text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                      Ending Soon
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

      {/* 5. Explore Jobs By State Directory */}
      <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">map</span>
              Explore State-Wise Sarkari Jobs
            </h2>
            <p className="text-xs text-[#444651]">Direct portal access for State Public Service Commissions & Boards</p>
          </div>
          <button
            onClick={() => onNavigate('state-wise')}
            className="text-xs font-bold text-[#00236f] hover:text-[#1e3a8a] flex items-center gap-1"
          >
            All 28 States & 8 UTs <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {ALL_INDIAN_STATES.slice(0, 12).map((st) => (
            <button
              key={st.code}
              onClick={() => onNavigate('state-wise')}
              className="p-3 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] border border-[#d3e4fe]/60 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-[#00236f] group-hover:text-[#00164e] block">
                  {st.name}
                </span>
                <span className="text-[10px] text-[#444651] block">{st.hindiName}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#904d00]">
                <span>{st.activeJobsCount} Jobs</span>
                <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

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
