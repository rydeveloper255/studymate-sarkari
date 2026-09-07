import React, { useState, useMemo } from 'react';
import { JobItem } from '../types';

interface EligibilityCalculatorModalProps {
  job: JobItem;
  isOpen: boolean;
  onClose: () => void;
}

export const EligibilityCalculatorModal: React.FC<EligibilityCalculatorModalProps> = ({
  job,
  isOpen,
  onClose,
}) => {
  const [dob, setDob] = useState('2001-05-20');
  const [category, setCategory] = useState<'UR' | 'OBC' | 'EWS' | 'SC' | 'ST' | 'PwD' | 'ESM'>('UR');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [qualification, setQualification] = useState<string>('Graduate');
  const [heightCm, setHeightCm] = useState<number>(170);

  if (!isOpen) return null;

  // Crucial date calculation
  const crucialDateStr = job.crucialAgeDate || '01-08-2026';
  // Parse date formatted like DD-MM-YYYY
  const parseCrucialDate = (str: string) => {
    const parts = str.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(2026, 7, 1);
  };

  const crucialDate = parseCrucialDate(crucialDateStr);

  // Exact age calculation
  const ageDetail = useMemo(() => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;

    let years = crucialDate.getFullYear() - birth.getFullYear();
    let months = crucialDate.getMonth() - birth.getMonth();
    let days = crucialDate.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(crucialDate.getFullYear(), crucialDate.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }, [dob, crucialDate]);

  // Relaxation logic
  const relaxationYears = useMemo(() => {
    switch (category) {
      case 'SC':
      case 'ST':
        return 5;
      case 'OBC':
        return 3;
      case 'PwD':
        return 10;
      case 'ESM':
        return 3;
      default:
        return 0;
    }
  }, [category]);

  // Standard job age limit parsing
  const minJobAge = 18;
  const maxJobAge = 32; // Default for general central posts
  const effectiveMaxAge = maxJobAge + relaxationYears;

  const isAgeEligible = useMemo(() => {
    if (!ageDetail) return false;
    return ageDetail.years >= minJobAge && ageDetail.years < effectiveMaxAge;
  }, [ageDetail, minJobAge, effectiveMaxAge]);

  // Qualification hierarchy check
  const qualWeights: { [key: string]: number } = {
    '10th Pass': 1,
    '12th Pass': 2,
    'Diploma': 2,
    'ITI': 2,
    'Graduate': 3,
    'Engineering': 3,
    'Teaching': 3,
    'Medical': 3,
    'Post Graduate': 4,
  };

  const jobReqLevel = job.qualificationLevel || 'Graduate';
  const userQualWeight = qualWeights[qualification] || 3;
  const jobReqWeight = qualWeights[jobReqLevel] || 3;
  const isQualEligible = userQualWeight >= jobReqWeight;

  // Physical standards check if applicable
  const hasPhysicalStandards = !!job.physicalStandards;
  const requiredMinHeight = gender === 'female' ? 152 : 165;
  const isPhysicalEligible = !hasPhysicalStandards || heightCm >= requiredMinHeight;

  const isFullyEligible = isAgeEligible && isQualEligible && isPhysicalEligible;

  // Filter eligible posts for this candidate
  const matchingPosts = useMemo(() => {
    if (!job.postWiseVacancies || job.postWiseVacancies.length === 0) return [];
    return job.postWiseVacancies.filter(() => isFullyEligible);
  }, [job.postWiseVacancies, isFullyEligible]);

  const shareEligibilityText = `🎯 *I CHECKED MY SARKARI JOB ELIGIBILITY* 🇮🇳
📌 Recruitment: *${job.shortTitle || job.title}*
🎂 My Age as on ${crucialDateStr}: *${ageDetail?.years} Yrs, ${ageDetail?.months} Mos, ${ageDetail?.days} Days*
🏷️ Category: *${category}* (Relaxation: +${relaxationYears} Yrs)
🎓 Qualification: *${qualification}*
${isFullyEligible ? '✅ STATUS: 100% ELIGIBLE TO APPLY!' : '❌ STATUS: NOT CURRENTLY ELIGIBLE'}

Check your eligibility for 1,24,000+ Sarkari vacancies here:
👉 ${window.location.origin}#job-detail?id=${job.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="relative bg-white dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-[#0b1c30] dark:text-white">
        {/* Header */}
        <div className="bg-[#00236f] text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#85f8c4] text-[24px]">verified_user</span>
            <div>
              <h2 className="font-display font-black text-base leading-tight">
                Am I Eligible? (पात्रता जांचें)
              </h2>
              <p className="text-[11px] text-white/80">
                Instant Age &amp; Qualification Verification Calculator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Recruitment Target Info */}
          <div className="p-3 bg-[#eff4ff] dark:bg-white/5 rounded-xl border border-[#d3e4fe] dark:border-white/10">
            <span className="text-[10px] font-bold text-[#757682] uppercase block">Recruitment Target</span>
            <span className="font-bold text-[#00236f] dark:text-[#90a8ff] text-sm block">{job.title}</span>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#444651] dark:text-white/70">
              <span>Crucial Cutoff Date: <strong>{crucialDateStr}</strong></span>
              <span>•</span>
              <span>General Age Bracket: <strong>{minJobAge} - {maxJobAge} Years</strong></span>
            </div>
          </div>

          {/* Interactive Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#444651] dark:text-white/80 block mb-1">
                Date of Birth (DOB)
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#eff4ff] dark:bg-white/10 border border-[#d3e4fe] dark:border-white/20 rounded-xl p-2.5 font-bold text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#444651] dark:text-white/80 block mb-1">
                Category &amp; Quota
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#eff4ff] dark:bg-white/10 border border-[#d3e4fe] dark:border-white/20 rounded-xl p-2.5 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="UR">UR / General (No relaxation)</option>
                <option value="OBC">OBC (+3 Years Relaxation)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
                <option value="SC">SC (+5 Years Relaxation)</option>
                <option value="ST">ST (+5 Years Relaxation)</option>
                <option value="PwD">PwBD (+10 Years Relaxation)</option>
                <option value="ESM">Ex-Servicemen (+3 Years)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#444651] dark:text-white/80 block mb-1">
                Gender
              </label>
              <div className="flex gap-2">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-xl font-bold capitalize transition-all border ${
                      gender === g
                        ? 'bg-[#00236f] text-white border-[#00236f]'
                        : 'bg-[#eff4ff] dark:bg-white/5 text-[#444651] dark:text-white/70 border-transparent hover:bg-[#dce9ff]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#444651] dark:text-white/80 block mb-1">
                Highest Qualification
              </label>
              <select
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full bg-[#eff4ff] dark:bg-white/10 border border-[#d3e4fe] dark:border-white/20 rounded-xl p-2.5 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="10th Pass">10th (Matriculation)</option>
                <option value="12th Pass">12th (Intermediate / 10+2)</option>
                <option value="ITI">ITI Certified</option>
                <option value="Diploma">Polytechnic Diploma</option>
                <option value="Graduate">Bachelor's Degree (Graduate)</option>
                <option value="Engineering">B.Tech / B.E. (Engineering)</option>
                <option value="Post Graduate">Post Graduate / Master's</option>
              </select>
            </div>
          </div>

          {/* Physical Standards Field if uniform post */}
          {hasPhysicalStandards && (
            <div className="p-3 bg-[#ffdcc3]/30 rounded-xl border border-[#ffb77d] flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-[#904d00] block">Physical Standard (Height in cm)</span>
                <span className="text-[10px] text-[#6e3900]">
                  Required: {requiredMinHeight} cms for {gender === 'female' ? 'Female' : 'Male'} candidates
                </span>
              </div>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 150)}
                className="w-24 bg-white dark:bg-black/30 border border-[#ffb77d] rounded-lg p-2 text-center font-black text-sm"
              />
            </div>
          )}

          {/* Result Calculation Banner */}
          {ageDetail && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isFullyEligible
                  ? 'bg-[#85f8c4]/20 border-[#85f8c4] text-[#003120]'
                  : 'bg-[#ffdad6]/40 border-[#ba1a1a] text-[#410002]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-3xl shrink-0 mt-0.5">
                  {isFullyEligible ? 'check_circle' : 'cancel'}
                </span>
                <div className="flex-1">
                  <h3 className="font-display font-black text-base leading-tight">
                    {isFullyEligible
                      ? '🎉 Congratulations! You are 100% Eligible!'
                      : '❌ Not Eligible for this Specific Recruitment'}
                  </h3>
                  <div className="mt-2 space-y-1 text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span>Exact Age as on {crucialDateStr}:</span>
                      <strong className="font-mono">
                        {ageDetail.years} Years, {ageDetail.months} Months, {ageDetail.days} Days
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Permissible Age Range:</span>
                      <span>{minJobAge} to {effectiveMaxAge} Years (Relaxation: +{relaxationYears} Yrs)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Qualification Status:</span>
                      <span>{isQualEligible ? '✅ Meets Minimum Requirement' : `❌ Needs at least ${jobReqLevel}`}</span>
                    </div>
                    {hasPhysicalStandards && (
                      <div className="flex items-center justify-between">
                        <span>Physical Height Standard:</span>
                        <span>{isPhysicalEligible ? '✅ Height Criteria Satisfied' : `❌ Below ${requiredMinHeight} cms`}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Matching Cadre Posts */}
          {isFullyEligible && matchingPosts.length > 0 && (
            <div>
              <span className="font-bold text-[#00236f] dark:text-[#90a8ff] block mb-2">
                Eligible Cadres / Posts you can Apply for:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingPosts.slice(0, 4).map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#eff4ff] dark:bg-white/5 rounded-xl border border-[#d3e4fe] dark:border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-[#00236f] dark:text-white block">{p.postName}</span>
                      <span className="text-[10px] text-[#757682]">{p.department} • {p.payLevel}</span>
                    </div>
                    <span className="material-symbols-outlined text-[#008851] text-[18px]">verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer & Share */}
        <div className="p-4 bg-[#eff4ff]/60 dark:bg-black/30 border-t border-[#d3e4fe] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareEligibilityText)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span>Share Result on WhatsApp</span>
          </a>

          <a
            href={job.directLinks?.[0]?.url || 'https://ssc.gov.in'}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto bg-[#00236f] hover:bg-[#1e3a8a] text-white font-black text-xs py-2.5 px-5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <span>Proceed to Apply Online</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  );
};
