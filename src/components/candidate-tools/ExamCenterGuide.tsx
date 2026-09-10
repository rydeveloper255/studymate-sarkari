import React, { useState } from 'react';

interface ExamCenterGuideProps {
  examName?: string;
}

export const ExamCenterGuide: React.FC<ExamCenterGuideProps> = ({ examName }) => {
  const [centerCity, setCenterCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [guideResult, setGuideResult] = useState<{
    nearestStation: string;
    distanceKm: number;
    estimatedAutoFare: string;
    metroBusOption: string;
    reportingBufferMins: number;
  } | null>(null);

  const handleCalculateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerCity.trim()) return;

    // Simulate smart route and transit calculation
    setGuideResult({
      nearestStation: `${centerCity} Junction (Main Railway Terminal)`,
      distanceKm: Math.floor(Math.random() * 8) + 4,
      estimatedAutoFare: '₹70 - ₹120 (E-Rickshaw / Shared Auto)',
      metroBusOption: `City Bus Route 14 & Local E-Rickshaws operate every 5 mins from Railway Station to Exam Hub.`,
      reportingBufferMins: 90,
    });
  };

  return (
    <div id="exam-center-guide" className="bg-white dark:bg-[#0c182c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs scroll-mt-36">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-extrabold text-lg text-[#00236f] dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-teal-600">directions_bus</span>
          Live Exam Center Travel & Route Guide
        </h2>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200">
          Biometric Entry Advisory
        </span>
      </div>

      <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mb-5">
        Enter your allotted exam center city / PIN code to get nearest railway station, public transport connectivity, estimated auto fare, and strictly mandatory gate closing advisory.
      </p>

      <form onSubmit={handleCalculateRoute} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">
            Exam City (As on Admit Card):
          </label>
          <input
            type="text"
            placeholder="e.g. Prayagraj, Patna, Jaipur, Lucknow"
            value={centerCity}
            onChange={(e) => setCenterCity(e.target.value)}
            className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#00236f]"
            required
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">
            Center Pincode (Optional):
          </label>
          <input
            type="text"
            placeholder="e.g. 211002"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#00236f]"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">navigation</span>
            Get Travel & Transit Guide
          </button>
        </div>
      </form>

      {guideResult && (
        <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 text-xs space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#070e1e] p-3 rounded-xl border border-teal-100 dark:border-teal-900/30">
              <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 block">
                Nearest Train Terminal / Junction:
              </span>
              <span className="font-extrabold text-[#00236f] dark:text-white text-sm">
                {guideResult.nearestStation}
              </span>
              <span className="text-[11px] text-[#64748b] block mt-0.5">
                Approx {guideResult.distanceKm} KM distance to TCS iON / Exam Hub
              </span>
            </div>

            <div className="bg-white dark:bg-[#070e1e] p-3 rounded-xl border border-teal-100 dark:border-teal-900/30">
              <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 block">
                Local Commute & Expected Fare:
              </span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                {guideResult.estimatedAutoFare}
              </span>
              <span className="text-[11px] text-[#64748b] block mt-0.5">
                Prepaid booth or Ola/Uber available outside main gate
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#070e1e] p-3 rounded-xl border border-teal-100 dark:border-teal-900/30 text-[#0b1c30] dark:text-white">
            <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 block mb-1">
              Public Transit & Bus Connectivity:
            </span>
            <p>{guideResult.metroBusOption}</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">alarm</span>
            <div>
              <strong>Strict Biometric Gate Closing Rule:</strong> Central examination gates close exactly 45 minutes before exam start (e.g. 8:15 AM for 9:00 AM shift). Plan to arrive at least {guideResult.reportingBufferMins} minutes early to avoid disqualification.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
