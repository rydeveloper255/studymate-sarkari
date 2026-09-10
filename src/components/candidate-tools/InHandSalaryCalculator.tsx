import React, { useState } from 'react';

interface InHandSalaryCalculatorProps {
  defaultPayLevel?: string;
}

// 7th Central Pay Commission Level mapping (Basic pay start)
const PAY_LEVELS = [
  { level: 'Level 1', basic: 18000, gradePay: 1800, title: 'Group D / MTS / Peon' },
  { level: 'Level 2', basic: 19900, gradePay: 1900, title: 'Constable / Junior Clerk' },
  { level: 'Level 3', basic: 21700, gradePay: 2000, title: 'Head Constable / RPF' },
  { level: 'Level 4', basic: 25500, gradePay: 2400, title: 'Postal Assistant / LDC' },
  { level: 'Level 5', basic: 29200, gradePay: 2800, title: 'Senior Clerk / Auditor' },
  { level: 'Level 6', basic: 35400, gradePay: 4200, title: 'Sub Inspector / Station Master' },
  { level: 'Level 7', basic: 44900, gradePay: 4600, title: 'Inspector / ASO / IT Inspector' },
  { level: 'Level 8', basic: 47600, gradePay: 4800, title: 'AAO / Assistant Accounts Officer' },
  { level: 'Level 9', basic: 53100, gradePay: 5400, title: 'Section Officer' },
  { level: 'Level 10', basic: 56100, gradePay: 5400, title: 'UPSC IAS / IPS / Group A Entry' },
];

export const InHandSalaryCalculator: React.FC<InHandSalaryCalculatorProps> = ({ defaultPayLevel }) => {
  // Infer starting level
  const initialLevel = PAY_LEVELS.find(l => defaultPayLevel && defaultPayLevel.toLowerCase().includes(l.level.toLowerCase())) || PAY_LEVELS[5]; // Default to Level 6

  const [selectedLevel, setSelectedLevel] = useState(initialLevel.level);
  const [cityCategory, setCityCategory] = useState<'X' | 'Y' | 'Z'>('X'); // X=30% HRA, Y=20%, Z=10%
  const [daPercent, setDaPercent] = useState<number>(50); // Current official DA rate (50%)

  const currentLevelData = PAY_LEVELS.find(l => l.level === selectedLevel) || PAY_LEVELS[5];
  const basicPay = currentLevelData.basic;

  // Dearness Allowance (DA) = Basic * DA%
  const daAmount = Math.round((basicPay * daPercent) / 100);

  // House Rent Allowance (HRA) (30% for X, 20% for Y, 10% for Z when DA reaches 50%)
  const hraRate = cityCategory === 'X' ? 30 : cityCategory === 'Y' ? 20 : 10;
  const hraAmount = Math.round((basicPay * hraRate) / 100);

  // Transport Allowance (TA)
  const taBase = cityCategory === 'X' ? 3600 : 1800;
  const taDaAmount = Math.round((taBase * daPercent) / 100);
  const totalTa = taBase + taDaAmount;

  // Gross Monthly Salary
  const grossSalary = basicPay + daAmount + hraAmount + totalTa;

  // Deductions: NPS (10% of Basic + DA), CGHS (approx 650), CGEGIS (approx 60)
  const npsDeduction = Math.round(((basicPay + daAmount) * 10) / 100);
  const healthInsurance = 650;
  const govtInsurance = 60;
  const totalDeductions = npsDeduction + healthInsurance + govtInsurance;

  // In-Hand Take Home Salary
  const netInHandSalary = grossSalary - totalDeductions;

  return (
    <div id="salary-calc" className="bg-white dark:bg-[#0c182c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs scroll-mt-36">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-extrabold text-lg text-[#00236f] dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-emerald-600">calculate</span>
          In-Hand Salary Calculator (7th Pay Commission)
        </h2>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
          DA Rate: 50% Active
        </span>
      </div>

      <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mb-5">
        Calculate your exact take-home bank credited salary including Dearness Allowance (DA), HRA, Transport Allowance, and mandatory NPS savings.
      </p>

      {/* Control Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-[11px] font-bold text-[#00236f] dark:text-white block mb-1.5">
            Select 7th CPC Pay Matrix Level:
          </label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#00236f]"
          >
            {PAY_LEVELS.map(l => (
              <option key={l.level} value={l.level}>
                {l.level} (Basic ₹{l.basic.toLocaleString('en-IN')}) - {l.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#00236f] dark:text-white block mb-1.5">
            Posting City Category:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setCityCategory('X')}
              className={`py-2 text-center rounded-xl text-xs font-bold transition-all ${
                cityCategory === 'X'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-[#f8fafc] dark:bg-[#070e1e] text-[#444651] dark:text-white/70 border border-[#cbd5e1] dark:border-[#1e324c]'
              }`}
              title="Delhi, Mumbai, Kolkata, Chennai, Bangalore, Hyderabad, Pune, Ahmedabad (30% HRA)"
            >
              Class X (30%)
            </button>
            <button
              onClick={() => setCityCategory('Y')}
              className={`py-2 text-center rounded-xl text-xs font-bold transition-all ${
                cityCategory === 'Y'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-[#f8fafc] dark:bg-[#070e1e] text-[#444651] dark:text-white/70 border border-[#cbd5e1] dark:border-[#1e324c]'
              }`}
              title="State Capitals & Major Tier 2 Cities (20% HRA)"
            >
              Class Y (20%)
            </button>
            <button
              onClick={() => setCityCategory('Z')}
              className={`py-2 text-center rounded-xl text-xs font-bold transition-all ${
                cityCategory === 'Z'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-[#f8fafc] dark:bg-[#070e1e] text-[#444651] dark:text-white/70 border border-[#cbd5e1] dark:border-[#1e324c]'
              }`}
              title="District headquarters & Rural areas (10% HRA)"
            >
              Class Z (10%)
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#00236f] dark:text-white block mb-1.5">
            Dearness Allowance (DA):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="46"
              max="54"
              value={daPercent}
              onChange={(e) => setDaPercent(Number(e.target.value))}
              className="w-full accent-[#00236f]"
            />
            <span className="font-extrabold text-xs text-[#00236f] dark:text-white w-12 text-right">
              {daPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Big Result Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#0b1c30] text-white shadow-md mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-white/70 text-xs font-semibold uppercase tracking-wider block">
            Estimated Monthly In-Hand Net Salary
          </span>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#85f8c4] tracking-tight">
            ₹{netInHandSalary.toLocaleString('en-IN')}
            <span className="text-sm font-normal text-white/80 ml-1">/ month</span>
          </span>
          <p className="text-[11px] text-white/70 mt-1">
            Gross Salary: ₹{grossSalary.toLocaleString('en-IN')} | Total Deductions: ₹{totalDeductions.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 text-right shrink-0">
          <span className="text-[10px] uppercase text-white/80 block">Annual CTC Package</span>
          <span className="font-extrabold text-lg text-white">
            ₹{(grossSalary * 12).toLocaleString('en-IN')} PA
          </span>
        </div>
      </div>

      {/* Itemized Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Earnings */}
        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
          <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-3">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Monthly Allowances (Earnings)
          </h4>
          <div className="space-y-2 text-[#0b1c30] dark:text-white">
            <div className="flex justify-between">
              <span>Basic Pay:</span>
              <strong className="font-bold">₹{basicPay.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span>Dearness Allowance (DA @ {daPercent}%):</span>
              <strong className="font-bold">₹{daAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span>House Rent Allowance (HRA @ {hraRate}%):</span>
              <strong className="font-bold">₹{hraAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span>Transport Allowance (TA + DA):</span>
              <strong className="font-bold">₹{totalTa.toLocaleString('en-IN')}</strong>
            </div>
            <div className="border-t border-emerald-200 dark:border-emerald-800 pt-2 flex justify-between font-extrabold text-emerald-900 dark:text-emerald-200">
              <span>Total Gross Monthly Salary:</span>
              <span>₹{grossSalary.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
          <h4 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-3">
            <span className="material-symbols-outlined text-[18px]">remove_circle</span>
            Statutory Deductions (Savings & Benefits)
          </h4>
          <div className="space-y-2 text-[#0b1c30] dark:text-white">
            <div className="flex justify-between">
              <span>National Pension System (NPS 10%):</span>
              <strong className="font-bold text-rose-700 dark:text-rose-400">-₹{npsDeduction.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span>Central Govt Health Scheme (CGHS):</span>
              <strong className="font-bold text-rose-700 dark:text-rose-400">-₹{healthInsurance}</strong>
            </div>
            <div className="flex justify-between">
              <span>Govt Employees Insurance (CGEGIS):</span>
              <strong className="font-bold text-rose-700 dark:text-rose-400">-₹{govtInsurance}</strong>
            </div>
            <div className="border-t border-rose-200 dark:border-rose-800 pt-2 flex justify-between font-extrabold text-rose-900 dark:text-rose-200">
              <span>Total Monthly Deductions:</span>
              <span>-₹{totalDeductions.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
