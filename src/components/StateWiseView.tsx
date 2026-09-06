import React, { useState } from 'react';
import { ALL_INDIAN_STATES } from '../data/mockData';
import { JobItem } from '../types';

export interface StateWiseViewProps {
  jobs: JobItem[];
  onSelectJob: (jobId: string) => void;
  onNavigate: (tab: string) => void;
}

export const StateWiseView: React.FC<StateWiseViewProps> = ({ jobs, onSelectJob, onNavigate }) => {
  const [selectedState, setSelectedState] = useState<string>('Uttar Pradesh');
  const [searchState, setSearchState] = useState('');

  const filteredStates = ALL_INDIAN_STATES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchState.toLowerCase()) ||
      s.hindiName.toLowerCase().includes(searchState.toLowerCase())
  );

  const activeStateInfo = ALL_INDIAN_STATES.find((s) => s.name === selectedState) || ALL_INDIAN_STATES[0];
  const stateJobs = jobs.filter((j) => j.state === selectedState || j.state === 'All India');

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#00236f] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] font-bold">State-Wise Sarkari Jobs Directory 2025</span>
      </nav>

      {/* 2. Banner */}
      <div className="bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#904d00] rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <span className="inline-block bg-white/20 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          Pan-India State Recruitment Gateway
        </span>
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
          28 Indian States & 8 Union Territories Job Portal
        </h1>
        <p className="text-white/80 text-xs md:text-sm mt-2 max-w-2xl">
          Direct recruitment links for State Public Service Commissions, Police Boards, Teacher Recruitment Boards (TET), and District courts.
        </p>
      </div>

      {/* 3. Main Grid: State Selector (Left) + Selected State Jobs & Commissions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: State Selector List */}
        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-[#00236f] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              Select State
            </h3>
            <span className="text-[11px] bg-[#dce1ff] text-[#00164e] font-extrabold px-2 py-0.5 rounded-full">
              {ALL_INDIAN_STATES.length} States
            </span>
          </div>

          <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-2.5 py-1.5">
            <span className="material-symbols-outlined text-[#757682] text-[18px] mr-1.5">search</span>
            <input
              type="text"
              placeholder="Search state (e.g. Bihar, UP)..."
              value={searchState}
              onChange={(e) => setSearchState(e.target.value)}
              className="w-full bg-transparent text-xs text-[#0b1c30] placeholder:text-[#757682] focus:outline-none"
            />
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {filteredStates.map((st) => {
              const isSelected = selectedState === st.name;
              return (
                <button
                  key={st.code}
                  onClick={() => setSelectedState(st.name)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#00236f] text-white shadow-xs'
                      : 'hover:bg-[#eff4ff] text-[#0b1c30]'
                  }`}
                >
                  <div>
                    <span>{st.name}</span>
                    <span className={`block text-[10px] ${isSelected ? 'text-white/80' : 'text-[#757682]'}`}>
                      {st.hindiName}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#eff4ff] text-[#904d00]'
                    }`}
                  >
                    {st.activeJobsCount} Jobs
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Selected State Hub & Active Notifications */}
        <div className="lg:col-span-2 space-y-4">
          {/* State Commission Card */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#ffdcc3] text-[#2f1500] text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Capital: {activeStateInfo.capital}
                </span>
                <span className="text-xs text-[#757682]">Recruiting Commission:</span>
              </div>
              <h2 className="font-display font-black text-xl md:text-2xl text-[#00236f]">
                {activeStateInfo.name} ({activeStateInfo.hindiName})
              </h2>
              <p className="text-xs font-bold text-[#904d00] mt-1">{activeStateInfo.pscName}</p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-[#757682] font-semibold">Popular Exams:</span>
                {activeStateInfo.popularExams.map((ex, i) => (
                  <span key={i} className="bg-[#eff4ff] text-[#00236f] px-2 py-0.5 rounded-md font-bold">
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            <a
              href={activeStateInfo.pscUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Official PSC Portal</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>

          {/* Jobs in this State */}
          <div className="space-y-3">
            <h3 className="font-display font-extrabold text-base text-[#00236f] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">feed</span>
              Active Vacancies for {activeStateInfo.name} Aspirants
            </h3>

            {stateJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-[#d3e4fe] p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[#dce1ff] text-[#00164e] text-[10px] font-black px-2 py-0.5 rounded">
                      {job.category}
                    </span>
                    <span className="text-[10px] font-extrabold text-[#004a32] bg-[#85f8c4]/30 px-2 py-0.5 rounded">
                      {job.vacanciesFormatted} Posts
                    </span>
                  </div>
                  <h4
                    onClick={() => onSelectJob(job.id)}
                    className="font-display font-bold text-sm md:text-base text-[#0b1c30] hover:text-[#00236f] cursor-pointer"
                  >
                    {job.shortTitle || job.title}
                  </h4>
                  <p className="text-xs text-[#757682] mt-0.5">
                    Last Date: <strong className="text-[#904d00]">{job.lastDate.split('(')[0]}</strong> • {job.qualificationSummary}
                  </p>
                </div>

                <button
                  onClick={() => onSelectJob(job.id)}
                  className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors shrink-0"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
