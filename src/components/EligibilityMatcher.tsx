import React, { useState, useMemo } from 'react';
import { JobItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface EligibilityMatcherProps {
  jobs: JobItem[];
  onSelectJob: (jobId: string) => void;
  onNavigate: (tab: string, jobId?: string) => void;
}

export const EligibilityMatcher: React.FC<EligibilityMatcherProps> = ({
  jobs,
  onSelectJob,
  onNavigate,
}) => {
  const { language } = useLanguage();

  // User input states
  const [selectedQual, setSelectedQual] = useState<string>('graduate');
  const [dob, setDob] = useState<string>('2001-05-15');
  const [category, setCategory] = useState<string>('OBC');
  const [stateDomicile, setStateDomicile] = useState<string>('All India');
  const [gender, setGender] = useState<string>('all');

  // Calculate age from DOB
  const calculatedAge = useMemo(() => {
    if (!dob) return 23;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(16, age);
  }, [dob]);

  // Category relaxation in years
  const ageRelaxationYears = useMemo(() => {
    switch (category) {
      case 'OBC':
        return 3;
      case 'SC':
      case 'ST':
        return 5;
      case 'PwD':
        return 10;
      case 'Ex-Servicemen':
        return 5;
      default:
        return 0;
    }
  }, [category]);

  // Matching algorithm
  const matchedJobs = useMemo(() => {
    return jobs.map((job) => {
      let score = 100;
      const reasons: string[] = [];

      // 1. Qualification Check
      const qualText = (
        (job.qualificationSummary || '') +
        ' ' +
        (job.title || '') +
        ' ' +
        (job.shortTitle || '')
      ).toLowerCase();

      let qualMatch = false;
      if (selectedQual === '10th') {
        qualMatch =
          qualText.includes('10th') ||
          qualText.includes('matric') ||
          qualText.includes('secondary') ||
          qualText.includes('mts') ||
          qualText.includes('gd') ||
          qualText.includes('constable');
      } else if (selectedQual === '12th') {
        qualMatch =
          qualText.includes('12th') ||
          qualText.includes('intermediate') ||
          qualText.includes('chsl') ||
          qualText.includes('10th') ||
          qualText.includes('constable') ||
          qualText.includes('clerk');
      } else if (selectedQual === 'graduate') {
        qualMatch =
          qualText.includes('graduate') ||
          qualText.includes('degree') ||
          qualText.includes('bachelor') ||
          qualText.includes('cgl') ||
          qualText.includes('po') ||
          qualText.includes('si') ||
          qualText.includes('officer') ||
          qualText.includes('12th') ||
          qualText.includes('10th');
      } else if (selectedQual === 'engineering') {
        qualMatch =
          qualText.includes('b.tech') ||
          qualText.includes('b.e') ||
          qualText.includes('engineer') ||
          qualText.includes('alp') ||
          qualText.includes('graduate') ||
          qualText.includes('degree');
      } else if (selectedQual === 'post-graduate') {
        qualMatch = true; // higher qual matches almost all
      } else {
        qualMatch = true;
      }

      if (qualMatch) {
        reasons.push(
          language === 'hi' ? 'शैक्षणिक योग्यता मेल खाती है' : 'Education Criteria Matched'
        );
      } else {
        score -= 40;
        reasons.push(
          language === 'hi'
            ? 'विशिष्ट डिग्री/डिप्लोमा की आवश्यकता हो सकती है'
            : 'Specialized Degree may be required'
        );
      }

      // 2. Age Check with Category Relaxation
      const maxAgeLimit = 30 + ageRelaxationYears;
      const minAgeLimit = 18;

      if (calculatedAge < minAgeLimit) {
        score -= 50;
        reasons.push(
          language === 'hi'
            ? `न्यूनतम आयु 18 वर्ष से कम (${calculatedAge} वर्ष)`
            : `Under Minimum Age (${calculatedAge} yrs)`
        );
      } else if (calculatedAge <= maxAgeLimit) {
        if (ageRelaxationYears > 0) {
          reasons.push(
            language === 'hi'
              ? `${category} श्रेणी में +${ageRelaxationYears} वर्ष आयु छूट मान्य`
              : `${category} category +${ageRelaxationYears}y age relaxation applied`
          );
        } else {
          reasons.push(
            language === 'hi'
              ? `आयु सीमा के अंतर्गत (${calculatedAge} वर्ष)`
              : `Within Age Bracket (${calculatedAge} yrs)`
          );
        }
      } else {
        score -= 45;
        reasons.push(
          language === 'hi'
            ? `अधिकतम आयु सीमा पार (${calculatedAge} वर्ष)`
            : `Exceeds Upper Age (${calculatedAge} yrs)`
        );
      }

      // 3. Domicile / State Check
      if (
        stateDomicile !== 'All India' &&
        job.state !== 'All India' &&
        !job.state.toLowerCase().includes(stateDomicile.toLowerCase())
      ) {
        score -= 20;
        reasons.push(
          language === 'hi'
            ? `राज्य कोटा (${job.state}) अन्य राज्यों के लिए सीमित हो सकता है`
            : `State quota (${job.state}) may apply`
        );
      } else {
        reasons.push(
          language === 'hi'
            ? 'अखिल भारतीय/स्थानीय मूल निवास मान्य'
            : 'All-India / Domicile Eligible'
        );
      }

      const finalScore = Math.max(10, Math.min(100, score));
      return {
        job,
        matchScore: finalScore,
        isEligible: finalScore >= 60,
        reasons,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [jobs, selectedQual, calculatedAge, ageRelaxationYears, category, stateDomicile, language]);

  const eligibleCount = matchedJobs.filter((m) => m.isEligible).length;

  return (
    <div className="space-y-6 pb-12 font-sans max-w-7xl mx-auto">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682] dark:text-[#94a3b8]">
        <button
          onClick={() => onNavigate('home')}
          className="hover:text-[#00236f] dark:hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">home</span>{' '}
          {language === 'hi' ? 'होम' : 'Home'}
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] dark:text-white font-bold">
          {language === 'hi' ? 'एआई सरकारी भर्ती पात्रता मैचर' : 'AI Sarkari Eligibility Auto-Matcher'}
        </span>
      </nav>

      {/* 2. Banner Header */}
      <div className="bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#004a32] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-white/20">
            <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">
              psychology
            </span>
            <span>100% Instant AI Matching</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight">
            {language === 'hi'
              ? 'अपनी योग्यता दर्ज करें और देखें आप किन-किन सरकारी फॉर्म के लिए पात्र हैं'
              : 'Enter Your Profile & Instantly Find All Govt Jobs You Are Eligible For'}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            {language === 'hi'
              ? 'आपकी आयु, श्रेणी (OBC/SC/ST छूट), और डिग्री के आधार पर 180+ सक्रिय सरकारी रिक्तियों की ऑटो-जांच।'
              : 'Auto-calculates age relaxation, category exemptions, and minimum education requirements across all central and state boards.'}
          </p>
        </div>
      </div>

      {/* 3. Input Profile Card */}
      <div className="bg-white dark:bg-[#101b2c] rounded-3xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-sm">
        <h3 className="font-display font-black text-base text-[#00236f] dark:text-[#93c5fd] flex items-center gap-2 mb-4 pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
          <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
          {language === 'hi' ? 'आपकी प्रोफाइल जानकारी' : 'Candidate Profile Parameters'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          {/* Highest Qualification */}
          <div>
            <label className="block font-bold text-[#444651] dark:text-[#cbd5e1] mb-1.5">
              {language === 'hi' ? 'उच्चतम शैक्षणिक योग्यता' : 'Highest Qualification'}
            </label>
            <select
              value={selectedQual}
              onChange={(e) => setSelectedQual(e.target.value)}
              className="w-full bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:ring-2 focus:ring-[#00236f]"
            >
              <option value="10th">10th Pass (Matriculation)</option>
              <option value="12th">12th Pass (Intermediate / Arts / Sci / Com)</option>
              <option value="graduate">Graduate (BA / B.Sc / B.Com / Degree)</option>
              <option value="engineering">B.Tech / B.E. / Engineering</option>
              <option value="post-graduate">Post-Graduate (MA / M.Sc / M.Tech)</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block font-bold text-[#444651] dark:text-[#cbd5e1] mb-1.5">
              {language === 'hi' ? 'जन्म तिथि (DOB)' : 'Date of Birth (DOB)'}
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:ring-2 focus:ring-[#00236f]"
            />
            <span className="text-[10px] text-[#757682] dark:text-[#94a3b8] block mt-1">
              Current Age: <strong className="text-[#00236f] dark:text-[#38bdf8]">{calculatedAge} Years</strong>
            </span>
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-[#444651] dark:text-[#cbd5e1] mb-1.5">
              {language === 'hi' ? 'आरक्षण श्रेणी' : 'Social Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:ring-2 focus:ring-[#00236f]"
            >
              <option value="UR">General / Unreserved (UR)</option>
              <option value="EWS">Economically Weaker Section (EWS)</option>
              <option value="OBC">OBC-NCL (+3 Yrs Age Relaxation)</option>
              <option value="SC">SC (+5 Yrs Age Relaxation)</option>
              <option value="ST">ST (+5 Yrs Age Relaxation)</option>
              <option value="PwD">PwD (+10 Yrs Age Relaxation)</option>
              <option value="Ex-Servicemen">Ex-Servicemen (+5 Yrs)</option>
            </select>
          </div>

          {/* State Domicile */}
          <div>
            <label className="block font-bold text-[#444651] dark:text-[#cbd5e1] mb-1.5">
              {language === 'hi' ? 'मूल निवास (राज्य)' : 'State Domicile'}
            </label>
            <select
              value={stateDomicile}
              onChange={(e) => setStateDomicile(e.target.value)}
              className="w-full bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:ring-2 focus:ring-[#00236f]"
            >
              <option value="All India">All India / Central Open</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Bihar">Bihar</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Delhi">Delhi</option>
              <option value="Haryana">Haryana</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block font-bold text-[#444651] dark:text-[#cbd5e1] mb-1.5">
              {language === 'hi' ? 'लिंग' : 'Gender'}
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:ring-2 focus:ring-[#00236f]"
            >
              <option value="all">All / Open</option>
              <option value="male">Male</option>
              <option value="female">Female (Fee Waiver eligible)</option>
            </select>
          </div>
        </div>

        {/* Live Match Counter Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00236f] dark:bg-[#1e3a8a] text-[#85f8c4] flex items-center justify-center font-black text-lg">
              🎯
            </div>
            <div>
              <span className="text-xs font-bold text-[#0b1c30] dark:text-white block">
                {language === 'hi'
                  ? `आप ${eligibleCount} सरकारी भर्तियों के लिए 100% पात्र हैं!`
                  : `You are eligible for ${eligibleCount} active Sarkari recruitments!`}
              </span>
              <span className="text-[11px] text-[#757682] dark:text-[#94a3b8]">
                {language === 'hi'
                  ? `सत्यापित आयु: ${calculatedAge} वर्ष | श्रेणी: ${category} | योग्यता: ${selectedQual.toUpperCase()}`
                  : `Verified Age: ${calculatedAge} Yrs | Category: ${category} | Qualification: ${selectedQual.toUpperCase()}`}
              </span>
            </div>
          </div>
          <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-[#85f8c4] text-[#002114] shadow-xs">
            {eligibleCount} / {jobs.length} Matches
          </span>
        </div>
      </div>

      {/* 4. Matched Jobs Cards List */}
      <div className="space-y-3">
        <h3 className="font-display font-extrabold text-base text-[#0b1c30] dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#00236f] dark:text-[#38bdf8]">
            verified
          </span>
          {language === 'hi' ? 'पात्रता परिणाम' : 'Eligible Jobs Matching Your Criteria'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchedJobs.map(({ job, matchScore, isEligible, reasons }) => (
            <div
              key={job.id}
              className={`p-5 rounded-3xl border transition-all shadow-xs flex flex-col justify-between ${
                isEligible
                  ? 'bg-white dark:bg-[#101b2c] border-[#85f8c4]/60 dark:border-emerald-800/40 hover:shadow-md'
                  : 'bg-[#fafbff] dark:bg-[#070e1e] border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div>
                {/* Score & Post Count Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs ${
                        matchScore >= 80
                          ? 'bg-emerald-600 text-white'
                          : matchScore >= 60
                          ? 'bg-amber-500 text-[#2f1500]'
                          : 'bg-slate-300 text-slate-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {matchScore >= 80 ? 'check_circle' : 'info'}
                      </span>
                      {matchScore}% {language === 'hi' ? 'मेल' : 'Match'}
                    </span>
                    <span className="text-[11px] font-extrabold text-[#00236f] dark:text-[#93c5fd] bg-[#dce1ff] dark:bg-[#1e3a8a] px-2 py-0.5 rounded">
                      {job.vacanciesFormatted} Posts
                    </span>
                  </div>

                  <span className="text-[11px] text-[#757682] dark:text-[#94a3b8] font-bold">
                    {job.state}
                  </span>
                </div>

                {/* Job Title */}
                <h4
                  onClick={() => onSelectJob(job.id)}
                  className="font-display font-extrabold text-sm sm:text-base text-[#0b1c30] dark:text-white hover:text-[#00236f] dark:hover:text-[#38bdf8] cursor-pointer leading-snug line-clamp-2 mb-1"
                >
                  {job.title}
                </h4>
                <p className="text-xs text-[#444651] dark:text-[#94a3b8] mb-3">
                  {job.department} • <span className="font-semibold text-amber-600 dark:text-amber-400">{job.payLevel}</span>
                </p>

                {/* Match Reasons Bullet Checklist */}
                <div className="space-y-1 my-3 bg-[#eff4ff] dark:bg-[#070e1e] p-2.5 rounded-xl border border-[#d3e4fe]/50 dark:border-[#1e324c]/40 text-[11px]">
                  {reasons.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[#444651] dark:text-[#cbd5e1]">
                      <span className="material-symbols-outlined text-[14px] text-emerald-600 dark:text-emerald-400">
                        done
                      </span>
                      <span className="line-clamp-1">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-3 pt-3 border-t border-[#eff4ff] dark:border-[#1e324c] flex items-center justify-between text-xs">
                <span className="text-[#757682] dark:text-[#94a3b8] font-medium text-[11px]">
                  Last Date: <strong className="text-[#0b1c30] dark:text-white">{job.lastDate.split('(')[0]}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectJob(job.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#00174c] text-white font-bold text-xs shadow-xs transition-all hover:scale-105 cursor-pointer flex items-center gap-1"
                  >
                    <span>{language === 'hi' ? 'विवरण देखें' : 'View Details'}</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
