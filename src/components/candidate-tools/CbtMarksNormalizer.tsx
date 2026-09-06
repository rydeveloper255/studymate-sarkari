import React, { useState } from 'react';

export const CbtMarksNormalizer: React.FC = () => {
  const [rawScore, setRawScore] = useState<number>(135);
  const [shiftMean, setShiftMean] = useState<number>(115);
  const [shiftStdDev, setShiftStdDev] = useState<number>(18);
  const [baseMean, setBaseMean] = useState<number>(120);
  const [baseStdDev, setBaseStdDev] = useState<number>(20);
  const [normalizedScore, setNormalizedScore] = useState<number | null>(null);

  const calculateNormalized = () => {
    // Standard Normalization Formula: ( (Raw - ShiftMean) / ShiftStdDev ) * BaseStdDev + BaseMean
    const z = (rawScore - shiftMean) / (shiftStdDev || 1);
    const norm = z * baseStdDev + baseMean;
    setNormalizedScore(Math.round(norm * 1000) / 1000);
  };

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">functions</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Multi-Shift CBT Marks Normalization Calculator
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Based on the official mathematical normalization standard used by SSC, Railway RRB, and TCS iON for multi-day exams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="md:col-span-6 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">Your Raw Score</label>
              <input
                type="number"
                value={rawScore}
                onChange={(e) => setRawScore(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">Your Shift Average (Mean)</label>
              <input
                type="number"
                value={shiftMean}
                onChange={(e) => setShiftMean(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">Your Shift Std. Deviation</label>
              <input
                type="number"
                value={shiftStdDev}
                onChange={(e) => setShiftStdDev(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">Base Benchmark Average</label>
              <input
                type="number"
                value={baseMean}
                onChange={(e) => setBaseMean(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={calculateNormalized}
            className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold py-3 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Calculate Estimated Normalized Marks
          </button>
        </div>

        {/* Right Output */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#00236f] via-[#1e3a8a] to-[#003120] text-white p-6 rounded-2xl shadow-lg space-y-4">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#85f8c4] block">
            Normalized Performance
          </span>

          <div className="bg-white/10 backdrop-blur-xs p-5 rounded-xl border border-white/20 text-center">
            <span className="text-xs text-white/80 block">Estimated Normalized Score:</span>
            <div className="font-display font-black text-4xl text-white mt-1">
              {normalizedScore !== null ? normalizedScore : '--'}
              <span className="text-xs font-normal text-white/80 ml-1">Marks</span>
            </div>
          </div>

          <div className="text-[11px] text-white/80 leading-relaxed bg-white/10 p-3.5 rounded-xl border border-white/15">
            <strong>Formula Reference:</strong> If your shift was difficult (lower Shift Mean), normalization gives bonus boost points. If your shift was easier than average, marks are normalized to equalize all shifts fairly.
          </div>
        </div>
      </div>
    </div>
  );
};
