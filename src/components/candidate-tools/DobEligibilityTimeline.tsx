import React, { useState } from 'react';

interface DobTimelineProps {
  minAge?: number;
  maxAge?: number;
  crucialDateStr?: string;
}

export const DobEligibilityTimeline: React.FC<DobTimelineProps> = ({
  minAge = 18,
  maxAge = 27,
  crucialDateStr = '01-08-2026',
}) => {
  const [candidateDob, setCandidateDob] = useState('2001-07-14');
  const [selectedCategory, setSelectedCategory] = useState<'UR' | 'OBC' | 'SC_ST' | 'PwD' | 'Ex_SM'>('OBC');

  // Calculate age as on Crucial Date (01-08-2026)
  const crucialDate = new Date(2026, 7, 1); // 1st August 2026
  const birthDate = new Date(candidateDob || '2001-07-14');

  let years = crucialDate.getFullYear() - birthDate.getFullYear();
  let months = crucialDate.getMonth() - birthDate.getMonth();
  let days = crucialDate.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    days += 30;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  // Category relaxation
  const relaxationYears =
    selectedCategory === 'SC_ST'
      ? 5
      : selectedCategory === 'OBC'
      ? 3
      : selectedCategory === 'PwD'
      ? 10
      : selectedCategory === 'Ex_SM'
      ? 3
      : 0;

  const effectiveMaxAge = maxAge + relaxationYears;
  const isEligible = years >= minAge && (years < effectiveMaxAge || (years === effectiveMaxAge && months === 0 && days === 0));

  // Visual percentage along the eligibility timeline
  const progressPercent = Math.min(100, Math.max(0, ((years - minAge) / (effectiveMaxAge - minAge)) * 100));

  return (
    <div id="dob-timeline" className="bg-white dark:bg-[#0c182c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs scroll-mt-36">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-extrabold text-lg text-[#00236f] dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-indigo-600">hourglass_top</span>
          Age Relaxation Visual Timeline & Eligibility Stamp
        </h2>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
          Crucial Date: {crucialDateStr}
        </span>
      </div>

      <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mb-5">
        Select your Date of Birth and Reservation Category to see your exact age on the cut-off date with official DOPT central government age relaxation.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">
            Enter Your Date of Birth (DOB):
          </label>
          <input
            type="date"
            value={candidateDob}
            onChange={(e) => setCandidateDob(e.target.value)}
            className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#00236f]"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">
            Select Your Category (Reservation):
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#00236f]"
          >
            <option value="UR">UR / General (No relaxation - Max {maxAge} yrs)</option>
            <option value="OBC">OBC-NCL (+3 Years Relaxation - Max {maxAge + 3} yrs)</option>
            <option value="SC_ST">SC / ST (+5 Years Relaxation - Max {maxAge + 5} yrs)</option>
            <option value="PwD">PwD / Divyangjan (+10 Years Relaxation - Max {maxAge + 10} yrs)</option>
            <option value="Ex_SM">Ex-Servicemen (+3 Years after deduction of service)</option>
          </select>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="bg-[#f8fafc] dark:bg-[#070e1e] p-4 rounded-xl border border-[#e2e8f0] dark:border-[#1e324c] mb-5">
        <div className="flex justify-between text-[11px] font-bold text-[#64748b] mb-1.5">
          <span>Min Age: {minAge} Yrs</span>
          <span className="text-[#00236f] dark:text-white">Your Age: {years} Yrs, {months} M, {days} D</span>
          <span>Max Allowed ({selectedCategory}): {effectiveMaxAge} Yrs</span>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 ${isEligible ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1">
          <span>{minAge} Years</span>
          <span>50% Window</span>
          <span>{effectiveMaxAge} Years Cutoff</span>
        </div>
      </div>

      {/* Stamp Status */}
      <div
        className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${
          isEligible
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 text-rose-900 dark:text-rose-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[32px]">
            {isEligible ? 'verified' : 'cancel'}
          </span>
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wide">
              {isEligible ? '✅ 100% ELIGIBLE TO APPLY' : '❌ NOT ELIGIBLE (AGE LIMIT EXCEEDED)'}
            </h4>
            <p className="text-xs opacity-90">
              Exact calculated age: <strong>{years} Years, {months} Months, {days} Days</strong> as on {crucialDateStr}.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold block opacity-75">Category Relief</span>
          <span className="font-black text-xs">+{relaxationYears} Yrs Applied</span>
        </div>
      </div>
    </div>
  );
};
