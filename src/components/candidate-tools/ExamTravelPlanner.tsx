import React, { useState } from 'react';

interface CityRoute {
  home: string;
  center: string;
  distanceKm: number;
  trainTimeHrs: number;
  busTimeHrs: number;
  suggestedDeparture: string;
}

const COMMON_CITY_ROUTES: CityRoute[] = [
  { home: 'Prayagraj (Allahabad)', center: 'Lucknow', distanceKm: 200, trainTimeHrs: 3.5, busTimeHrs: 4.5, suggestedDeparture: 'Previous Evening or 4:30 AM early morning train' },
  { home: 'Patna', center: 'Varanasi', distanceKm: 250, trainTimeHrs: 4.0, busTimeHrs: 5.5, suggestedDeparture: 'Previous Evening by 8:00 PM' },
  { home: 'Jaipur', center: 'Delhi NCR', distanceKm: 280, trainTimeHrs: 4.5, busTimeHrs: 5.0, suggestedDeparture: 'Previous Night Sleeper or Vande Bharat Express' },
  { home: 'Kanpur', center: 'Agra', distanceKm: 270, trainTimeHrs: 4.0, busTimeHrs: 4.8, suggestedDeparture: 'Early morning express train' },
  { home: 'Bhopal', center: 'Indore', distanceKm: 195, trainTimeHrs: 3.0, busTimeHrs: 3.5, suggestedDeparture: 'Morning 5:00 AM Intercity Express' },
  { home: 'Ranchi', center: 'Kolkata', distanceKm: 410, trainTimeHrs: 7.0, busTimeHrs: 9.0, suggestedDeparture: 'Strictly 1 Day prior afternoon' },
];

export const ExamTravelPlanner: React.FC = () => {
  const [homeCity, setHomeCity] = useState('Prayagraj (Allahabad)');
  const [examCity, setExamCity] = useState('Lucknow');
  const [reportingTime, setReportingTime] = useState('08:00 AM (Shift 1)');
  const [customDistance, setCustomDistance] = useState<number>(200);

  const matchedRoute = COMMON_CITY_ROUTES.find(
    (r) =>
      r.home.toLowerCase().includes(homeCity.toLowerCase()) &&
      r.center.toLowerCase().includes(examCity.toLowerCase())
  );

  const distance = matchedRoute ? matchedRoute.distanceKm : customDistance;
  const trainHours = matchedRoute ? matchedRoute.trainTimeHrs : Math.round((distance / 55) * 10) / 10;
  const busHours = matchedRoute ? matchedRoute.busTimeHrs : Math.round((distance / 45) * 10) / 10;

  const mustLeavePreviousNight = distance > 180 || reportingTime.includes('08:00 AM');

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">directions_transit</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Exam Center Distance &amp; Travel Route Planner
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Estimate travel time, optimum departure schedule, and avoid missing entry gates due to biometric / frisking deadlines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="md:col-span-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
              Your Home District / City:
            </label>
            <input
              type="text"
              value={homeCity}
              onChange={(e) => setHomeCity(e.target.value)}
              placeholder="e.g. Prayagraj, Patna, Jaipur"
              className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
            />
          </div>

          <div>
            <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
              Allotted Exam Center City:
            </label>
            <input
              type="text"
              value={examCity}
              onChange={(e) => setExamCity(e.target.value)}
              placeholder="e.g. Lucknow, Varanasi, Delhi"
              className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Reporting Shift Time:
              </label>
              <select
                value={reportingTime}
                onChange={(e) => setReportingTime(e.target.value)}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              >
                <option value="07:30 AM (Shift 1)">07:30 AM (Shift 1 Morning)</option>
                <option value="08:00 AM (Shift 1)">08:00 AM (Shift 1)</option>
                <option value="11:30 AM (Shift 2)">11:30 AM (Shift 2 Noon)</option>
                <option value="02:30 PM (Shift 3)">02:30 PM (Shift 3 Evening)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Estimated Distance (KM):
              </label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setCustomDistance(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
          </div>

          {/* Exam Day Checklist */}
          <div className="bg-[#eff4ff] dark:bg-[#0c182c] border border-[#d3e4fe] dark:border-[#1e324c] p-3.5 rounded-xl space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-[#00236f] dark:text-[#38bdf8] block">
              🎒 Exam Day Travel Kit (Must Carry):
            </span>
            <ul className="text-[11px] text-[#334155] dark:text-[#cbd5e1] space-y-1">
              <li>✓ Printed Color/B&amp;W Admit Card with self-declaration</li>
              <li>✓ Original Photo ID Proof (Aadhaar / Voter ID / Driving License)</li>
              <li>✓ 2 Passport Size Photos matching admit card</li>
              <li>✓ Transparent Blue/Black Ballpoint Pen (No gel pens)</li>
              <li>✓ Transparent 500ml Water Bottle (Label removed)</li>
            </ul>
          </div>
        </div>

        {/* Right Travel Card */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#00236f] via-[#1e3a8a] to-[#003120] text-white p-6 rounded-2xl shadow-lg space-y-4">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#85f8c4] block">
            Travel Route Advisory
          </span>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/20">
            <div className="text-xs text-white/80">Route: {homeCity} ➔ {examCity}</div>
            <div className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
              ~{distance} Kilometers
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-white/70 text-[10px] block">Estimated Train Journey</span>
              <span className="text-base font-black text-emerald-300">~{trainHours} Hours</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-white/70 text-[10px] block">Estimated Bus / Road Trip</span>
              <span className="text-base font-black text-sky-300">~{busHours} Hours</span>
            </div>
          </div>

          <div className="p-3.5 bg-white/10 rounded-xl border border-white/15 text-xs text-white/90">
            <strong className="text-[#85f8c4] block mb-1">🚨 Recommended Departure Window:</strong>
            {mustLeavePreviousNight ? (
              <p className="leading-relaxed text-[11px]">
                Travel <strong>1 night prior</strong> or by late evening sleeper. Reaching the destination city early avoids gate closure panic (Gates strictly close 45 minutes prior to exam start).
              </p>
            ) : (
              <p className="leading-relaxed text-[11px]">
                Same day early morning travel is viable. Plan to reach the center venue at least <strong>90 minutes before</strong> reporting closure time.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
