import React, { useState } from 'react';

interface ExamAgeRule {
  id: string;
  name: string;
  commission: string;
  minAge: number;
  maxAgeUR: number;
  obcRelax: number;
  scstRelax: number;
  pwdRelax: number;
  exSmRelax: number;
  crucialDateDefault: string;
  qualification: string;
}

const EXAM_RULES: ExamAgeRule[] = [
  { id: 'ssc_cgl', name: 'SSC CGL (Combined Graduate Level)', commission: 'Staff Selection Commission', minAge: 18, maxAgeUR: 30, obcRelax: 3, scstRelax: 5, pwdRelax: 10, exSmRelax: 3, crucialDateDefault: '2025-08-01', qualification: 'Graduation Degree' },
  { id: 'ssc_chsl', name: 'SSC CHSL (10+2 DEO / LDC)', commission: 'Staff Selection Commission', minAge: 18, maxAgeUR: 27, obcRelax: 3, scstRelax: 5, pwdRelax: 10, exSmRelax: 3, crucialDateDefault: '2025-08-01', qualification: '12th Pass' },
  { id: 'rrb_ntpc', name: 'RRB NTPC (Graduate & Undergrad)', commission: 'Railway Recruitment Boards', minAge: 18, maxAgeUR: 33, obcRelax: 3, scstRelax: 5, pwdRelax: 10, exSmRelax: 3, crucialDateDefault: '2025-01-01', qualification: '12th / Degree' },
  { id: 'upsc_cse', name: 'UPSC Civil Services (IAS / IPS)', commission: 'Union Public Service Commission', minAge: 21, maxAgeUR: 32, obcRelax: 3, scstRelax: 5, pwdRelax: 10, exSmRelax: 5, crucialDateDefault: '2025-08-01', qualification: 'Graduation Degree' },
  { id: 'ibps_po', name: 'IBPS PO / Management Trainee', commission: 'Institute of Banking Personnel Selection', minAge: 20, maxAgeUR: 30, obcRelax: 3, scstRelax: 5, pwdRelax: 10, exSmRelax: 5, crucialDateDefault: '2025-08-01', qualification: 'Graduation Degree' },
  { id: 'up_police_const', name: 'UP Police Constable', commission: 'UPPRPB Lucknow', minAge: 18, maxAgeUR: 25, obcRelax: 5, scstRelax: 5, pwdRelax: 0, exSmRelax: 3, crucialDateDefault: '2025-07-01', qualification: '12th Pass' },
  { id: 'bihar_bpsc', name: 'BPSC CCE (Bihar Public Service)', commission: 'Bihar PSC Patna', minAge: 20, maxAgeUR: 37, obcRelax: 3, scstRelax: 5, pwdRelax: 10, exSmRelax: 3, crucialDateDefault: '2025-08-01', qualification: 'Graduation Degree' },
  { id: 'nda_exam', name: 'UPSC NDA & NA Exam', commission: 'UPSC Defence', minAge: 16.5 as any, maxAgeUR: 19.5 as any, obcRelax: 0, scstRelax: 0, pwdRelax: 0, exSmRelax: 0, crucialDateDefault: '2025-01-01', qualification: '12th Appearing / Pass' },
];

export const AgeRelaxationCalculator: React.FC = () => {
  const [selectedExamId, setSelectedExamId] = useState('ssc_cgl');
  const [dob, setDob] = useState('1998-05-15');
  const [category, setCategory] = useState<'UR' | 'EWS' | 'OBC' | 'SC' | 'ST' | 'PwD' | 'ExSM'>('OBC');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [crucialDate, setCrucialDate] = useState('2025-08-01');

  const currentRule = EXAM_RULES.find((r) => r.id === selectedExamId) || EXAM_RULES[0];

  const handleExamChange = (id: string) => {
    setSelectedExamId(id);
    const rule = EXAM_RULES.find((r) => r.id === id);
    if (rule) {
      setCrucialDate(rule.crucialDateDefault);
    }
  };

  // Age calculation
  const d1 = new Date(dob);
  const d2 = new Date(crucialDate);

  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();

  if (days < 0) {
    months--;
    days += 30;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  // Relaxation determination
  let relaxation = 0;
  if (category === 'OBC') relaxation = currentRule.obcRelax;
  else if (category === 'SC' || category === 'ST') relaxation = currentRule.scstRelax;
  else if (category === 'PwD') relaxation = currentRule.pwdRelax;
  else if (category === 'ExSM') relaxation = currentRule.exSmRelax;
  else if (category === 'UR' || category === 'EWS') relaxation = 0;

  // Female relaxation in certain state exams (e.g., BPSC)
  let extraFemaleRelax = 0;
  if (gender === 'Female' && selectedExamId === 'bihar_bpsc' && (category === 'UR' || category === 'EWS')) {
    extraFemaleRelax = 3; // 40 yrs for UR Female in BPSC
  }

  const effectiveMaxAge = Number(currentRule.maxAgeUR) + relaxation + extraFemaleRelax;
  const effectiveMinAge = Number(currentRule.minAge);

  const exactAgeFloat = years + months / 12 + days / 365.25;
  const isEligible = exactAgeFloat >= effectiveMinAge && exactAgeFloat <= effectiveMaxAge;

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">cake</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Category-Wise Age Relaxation &amp; Eligibility Checker
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Accurate age calculation as per official DoPT &amp; State Commission reservation guidelines (OBC +3 yrs, SC/ST +5 yrs, PwD +10 yrs).
        </p>
      </div>

      {/* Exam Selector */}
      <div>
        <label className="text-xs font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
          Select Target Government Recruitment:
        </label>
        <select
          value={selectedExamId}
          onChange={(e) => handleExamChange(e.target.value)}
          className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-sm text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#00236f]"
        >
          {EXAM_RULES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.commission})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="md:col-span-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Your Date of Birth (DOB)
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Crucial Cutoff Date
              </label>
              <input
                type="date"
                value={crucialDate}
                onChange={(e) => setCrucialDate(e.target.value)}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Reservation Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              >
                <option value="UR">UR / General</option>
                <option value="EWS">EWS (Economically Weaker)</option>
                <option value="OBC">OBC (+3 Yrs Relax)</option>
                <option value="SC">SC (+5 Yrs Relax)</option>
                <option value="ST">ST (+5 Yrs Relax)</option>
                <option value="PwD">PwBD (+10 Yrs Relax)</option>
                <option value="ExSM">Ex-Servicemen (Ex-SM)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="bg-[#eff4ff] dark:bg-[#0c182c] border border-[#d3e4fe] dark:border-[#1e324c] p-3 rounded-xl">
            <span className="text-[10px] font-extrabold uppercase text-[#00236f] dark:text-[#38bdf8] block mb-1">
              Official Prescribed Rules for this Exam:
            </span>
            <div className="space-y-1 text-[11px] text-[#334155] dark:text-[#cbd5e1]">
              <div>• Base UR Age Bracket: <strong>{currentRule.minAge} to {currentRule.maxAgeUR} Years</strong></div>
              <div>• OBC-NCL Relaxation: <strong>+{currentRule.obcRelax} Years (Max: {currentRule.maxAgeUR + currentRule.obcRelax} Yrs)</strong></div>
              <div>• SC/ST Relaxation: <strong>+{currentRule.scstRelax} Years (Max: {currentRule.maxAgeUR + currentRule.scstRelax} Yrs)</strong></div>
              <div>• Minimum Education: <strong>{currentRule.qualification}</strong></div>
            </div>
          </div>
        </div>

        {/* Right Result Card */}
        <div className={`md:col-span-6 p-6 rounded-2xl shadow-lg space-y-4 border ${
          isEligible
            ? 'bg-gradient-to-br from-[#003120] via-[#004a32] to-[#00236f] text-white border-emerald-400/30'
            : 'bg-gradient-to-br from-[#450a0a] via-[#7f1d1d] to-[#0b1c30] text-white border-red-400/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#85f8c4]">
              Official Eligibility Verdict
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              isEligible ? 'bg-emerald-400 text-emerald-950' : 'bg-red-400 text-red-950'
            }`}>
              {isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/20">
            <span className="text-xs text-white/80 block">Your Exact Age on {crucialDate}:</span>
            <div className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
              {years} <span className="text-xs font-normal">Yrs</span> {months} <span className="text-xs font-normal">Mos</span> {days} <span className="text-xs font-normal">Days</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-white/70 text-[10px] block">Your Category Max Limit</span>
              <span className="text-base font-black text-white">{effectiveMaxAge} Years</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-white/70 text-[10px] block">Age Relaxation Applied</span>
              <span className="text-base font-black text-[#85f8c4]">+{relaxation + extraFemaleRelax} Years</span>
            </div>
          </div>

          <div className="p-3 bg-white/10 rounded-xl border border-white/15 text-xs text-white/90">
            {isEligible ? (
              <p className="leading-relaxed">
                ✅ <strong>Congratulations!</strong> You satisfy the age eligibility criteria for <strong>{currentRule.name}</strong> under the <strong>{category}</strong> category.
              </p>
            ) : (
              <p className="leading-relaxed">
                ❌ <strong>Disqualified by Age:</strong> Your computed age ({years} Yrs {months} M) exceeds the maximum ceiling of {effectiveMaxAge} Years or is below the minimum entry age of {effectiveMinAge} Years.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
