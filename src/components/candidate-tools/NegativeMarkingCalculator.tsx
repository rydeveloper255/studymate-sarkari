import React, { useState } from 'react';

interface ExamPattern {
  id: string;
  name: string;
  totalQs: number;
  positiveMarks: number;
  negativePenalty: number;
  durationMins: number;
}

const EXAM_PATTERNS: ExamPattern[] = [
  { id: 'ssc_cgl', name: 'SSC CGL / CHSL Tier 1 (+2 / -0.50)', totalQs: 100, positiveMarks: 2, negativePenalty: 0.50, durationMins: 60 },
  { id: 'rrb_ntpc', name: 'RRB NTPC / Group D (+1 / -0.33)', totalQs: 100, positiveMarks: 1, negativePenalty: 0.3333, durationMins: 90 },
  { id: 'upsc_prelims', name: 'UPSC CSE GS-1 (+2 / -0.66)', totalQs: 100, positiveMarks: 2, negativePenalty: 0.6666, durationMins: 120 },
  { id: 'ibps_po', name: 'IBPS PO / Clerk Prelims (+1 / -0.25)', totalQs: 100, positiveMarks: 1, negativePenalty: 0.25, durationMins: 60 },
  { id: 'up_police', name: 'UP Police Constable (+2 / -0.50)', totalQs: 150, positiveMarks: 2, negativePenalty: 0.50, durationMins: 120 },
  { id: 'nda_maths', name: 'UPSC NDA Maths (+2.5 / -0.83)', totalQs: 120, positiveMarks: 2.5, negativePenalty: 0.833, durationMins: 150 },
  { id: 'custom', name: 'Custom Exam Pattern', totalQs: 100, positiveMarks: 1, negativePenalty: 0.25, durationMins: 60 },
];

export const NegativeMarkingCalculator: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<string>('ssc_cgl');
  const [totalQuestions, setTotalQuestions] = useState<number>(100);
  const [posMark, setPosMark] = useState<number>(2);
  const [negMark, setNegMark] = useState<number>(0.50);

  const [attempted, setAttempted] = useState<number>(85);
  const [correct, setCorrect] = useState<number>(72);

  const handlePatternChange = (patternId: string) => {
    setSelectedPattern(patternId);
    const pat = EXAM_PATTERNS.find((p) => p.id === patternId);
    if (pat) {
      setTotalQuestions(pat.totalQs);
      setPosMark(pat.positiveMarks);
      setNegMark(pat.negativePenalty);
    }
  };

  const handleAttemptedChange = (val: number) => {
    const clamped = Math.max(0, Math.min(totalQuestions, val));
    setAttempted(clamped);
    if (correct > clamped) {
      setCorrect(clamped);
    }
  };

  const handleCorrectChange = (val: number) => {
    const clamped = Math.max(0, Math.min(attempted, val));
    setCorrect(clamped);
  };

  const wrong = attempted - correct;
  const unattempted = totalQuestions - attempted;
  const maxPossibleMarks = totalQuestions * posMark;
  const grossPositiveMarks = correct * posMark;
  const totalNegativeMarks = wrong * negMark;
  const netRawScore = Math.max(0, grossPositiveMarks - totalNegativeMarks);
  const accuracyPercent = attempted > 0 ? (correct / attempted) * 100 : 0;
  const scorePercent = maxPossibleMarks > 0 ? (netRawScore / maxPossibleMarks) * 100 : 0;

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">calculate</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Negative Marking &amp; Raw Score Calculator
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Calculate exact 1/3rd, 1/4th or custom negative deductions, net score, accuracy percentage, and test verdict instantly.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#475569] dark:text-[#94a3b8] block">
          Select Exam Marking Scheme:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {EXAM_PATTERNS.map((pat) => (
            <button
              key={pat.id}
              onClick={() => handlePatternChange(pat.id)}
              className={`p-2.5 rounded-xl text-left border transition-all text-xs font-bold ${
                selectedPattern === pat.id
                  ? 'bg-[#00236f] text-white border-[#00236f] shadow-sm'
                  : 'bg-[#f8fafc] dark:bg-[#0c182c] border-[#e2e8f0] dark:border-[#1e324c] text-[#334155] dark:text-[#cbd5e1] hover:bg-[#eff4ff]'
              }`}
            >
              <div className="truncate">{pat.name.split('(')[0]}</div>
              <div className="text-[10px] opacity-80 mt-0.5">
                +{pat.positiveMarks} / -{Math.round(pat.negativePenalty * 100) / 100}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Form */}
        <div className="md:col-span-6 space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">Total Qs</label>
              <input
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">Marks per Q (+)</label>
              <input
                type="number"
                step="0.25"
                value={posMark}
                onChange={(e) => setPosMark(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">Penalty per Wrong (-)</label>
              <input
                type="number"
                step="0.01"
                value={negMark}
                onChange={(e) => setNegMark(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-red-600 dark:text-red-400"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-[#334155] dark:text-[#cbd5e1]">Questions Attempted</span>
                <span className="text-[#00236f] dark:text-[#38bdf8]">{attempted} / {totalQuestions}</span>
              </div>
              <input
                type="range"
                min={0}
                max={totalQuestions}
                value={attempted}
                onChange={(e) => handleAttemptedChange(Number(e.target.value))}
                className="w-full accent-[#00236f]"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-[#334155] dark:text-[#cbd5e1]">Correct Answers</span>
                <span className="text-emerald-600 font-bold">{correct} / {attempted}</span>
              </div>
              <input
                type="range"
                min={0}
                max={attempted}
                value={correct}
                onChange={(e) => handleCorrectChange(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>

          {/* Quick Breakdown Badges */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">CORRECT</span>
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{correct}</span>
            </div>
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-2 rounded-xl">
              <span className="text-[10px] font-bold text-red-800 dark:text-red-300 block">WRONG</span>
              <span className="text-sm font-black text-red-700 dark:text-red-400">{wrong}</span>
            </div>
            <div className="bg-slate-50 dark:bg-[#0c182c] border border-slate-200 dark:border-[#1e324c] p-2 rounded-xl">
              <span className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] block">LEFT</span>
              <span className="text-sm font-black text-[#334155] dark:text-[#cbd5e1]">{unattempted}</span>
            </div>
          </div>
        </div>

        {/* Right Result Card */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#00236f] via-[#1e3a8a] to-[#003120] text-white p-6 rounded-2xl shadow-lg space-y-4">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#85f8c4] block">
            Net Evaluation Report
          </span>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/20 text-center">
            <span className="text-xs font-semibold text-white/80 block">Final Raw Marks</span>
            <div className="font-display font-black text-3xl sm:text-4xl text-white mt-1">
              {netRawScore.toFixed(2)}
              <span className="text-xs font-bold text-white/70 ml-1">/ {maxPossibleMarks}</span>
            </div>
            <span className="text-[11px] text-[#85f8c4] font-bold block mt-1">
              ({scorePercent.toFixed(1)}% of total maximum)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-white/70 text-[10px] block">Gross Positive</span>
              <span className="text-base font-black text-emerald-300">+{grossPositiveMarks.toFixed(2)}</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-white/70 text-[10px] block">Negative Penalty</span>
              <span className="text-base font-black text-red-300">-{totalNegativeMarks.toFixed(2)}</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-white/70 text-[10px] block">Accuracy Rate</span>
              <span className="text-base font-black text-yellow-300">{accuracyPercent.toFixed(1)}%</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-white/70 text-[10px] block">Attempt Ratio</span>
              <span className="text-base font-black text-sky-300">{((attempted / totalQuestions) * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 text-xs">
            <span className="font-bold text-white block">Aspirant Insight:</span>
            <p className="text-white/80 text-[11px] mt-0.5 leading-relaxed">
              {accuracyPercent >= 85
                ? '🌟 Excellent high accuracy! You are minimizing negative wastage.'
                : accuracyPercent >= 70
                ? '⚠️ Moderate risk: Negative marking is trimming down your score. Avoid blind guesses.'
                : '❌ High negative deduction! Stick to confident choices during CBT examination.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
