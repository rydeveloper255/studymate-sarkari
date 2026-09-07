import React, { useState } from 'react';
import { ALL_INDIAN_STATES } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';

export interface InteractiveIndiaMapProps {
  onSelectState: (stateName: string) => void;
  onNavigate: (tab: string) => void;
}

export const InteractiveIndiaMap: React.FC<InteractiveIndiaMapProps> = ({
  onSelectState,
  onNavigate,
}) => {
  const { language } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const regions = [
    { id: 'All', label: language === 'hi' ? 'सभी राज्य' : 'All States (28+8)' },
    { id: 'North', label: language === 'hi' ? 'उत्तर भारत' : 'North India' },
    { id: 'Central', label: language === 'hi' ? 'मध्य भारत' : 'Central' },
    { id: 'East', label: language === 'hi' ? 'पूर्वी भारत' : 'East India' },
    { id: 'West', label: language === 'hi' ? 'पश्चिम भारत' : 'West India' },
    { id: 'South', label: language === 'hi' ? 'दक्षिण भारत' : 'South India' },
  ];

  const regionMapping: { [key: string]: string[] } = {
    North: ['UP', 'DL', 'RJ', 'HR', 'PB', 'UK', 'HP', 'JK'],
    Central: ['MP', 'CG'],
    East: ['BR', 'JH', 'WB', 'OD'],
    West: ['MH', 'GJ', 'GA'],
    South: ['KA', 'TN', 'AP', 'TS', 'KL'],
  };

  const filteredStates = ALL_INDIAN_STATES.filter((st) => {
    if (selectedRegion === 'All') return true;
    const allowed = regionMapping[selectedRegion] || [];
    return allowed.includes(st.code);
  });

  return (
    <div className="bg-white dark:bg-[#101b2c] rounded-3xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eff4ff] dark:border-[#1e324c]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#00236f] dark:bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px] text-[#85f8c4]">
              map
            </span>
          </div>
          <div>
            <h3 className="font-display font-black text-base sm:text-lg text-[#0b1c30] dark:text-white">
              {language === 'hi'
                ? 'भारत का इंटरएक्टिव राज्य-वार भर्ती नक्शा'
                : 'Interactive All-India State Recruitment Map & Explorer'}
            </h3>
            <p className="text-xs text-[#757682] dark:text-[#94a3b8]">
              {language === 'hi'
                ? 'अपने राज्य पर क्लिक करें और सीधे राज्य पीएससी व पुलिस की रिक्तियां देखें'
                : 'Tap on any state to view local State PSC, Police, High Court & Board recruitments'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('state-wise')}
          className="text-xs font-bold text-[#00236f] dark:text-[#93c5fd] hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>{language === 'hi' ? 'सभी 36 राज्य एवं केंद्र शासित प्रदेश' : 'View Full State Directory'}</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>

      {/* Region Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {regions.map((reg) => (
          <button
            key={reg.id}
            onClick={() => setSelectedRegion(reg.id)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedRegion === reg.id
                ? 'bg-[#00236f] dark:bg-[#2563eb] text-white shadow-xs'
                : 'bg-[#eff4ff] dark:bg-[#070e1e] text-[#444651] dark:text-[#cbd5e1] hover:bg-[#dce9ff]'
            }`}
          >
            {reg.label}
          </button>
        ))}
      </div>

      {/* Grid of Interactive State Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredStates.map((st) => (
          <div
            key={st.code}
            onMouseEnter={() => setHoveredState(st.name)}
            onMouseLeave={() => setHoveredState(null)}
            onClick={() => {
              onSelectState(st.name);
              onNavigate('state-wise');
            }}
            className="p-3.5 rounded-2xl bg-[#eff4ff]/70 dark:bg-[#070e1e] hover:bg-[#dce9ff] dark:hover:bg-[#1e293b] border border-[#d3e4fe]/70 dark:border-[#1e324c] cursor-pointer transition-all hover:scale-103 hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-black uppercase text-[#00236f] dark:text-[#38bdf8] bg-white dark:bg-[#101b2c] px-1.5 py-0.5 rounded border border-[#d3e4fe]/60 dark:border-[#1e324c]">
                  {st.code}
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {st.activeJobsCount} Active
                </span>
              </div>
              <h4 className="font-bold text-xs text-[#0b1c30] dark:text-white group-hover:text-[#00236f] dark:group-hover:text-[#38bdf8] truncate">
                {st.name}
              </h4>
              <p className="text-[10px] text-[#757682] dark:text-[#94a3b8] truncate">
                {st.hindiName}
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-[#d3e4fe]/40 dark:border-[#1e324c]/40 flex items-center justify-between text-[10px] font-bold text-[#00236f] dark:text-[#93c5fd]">
              <span>Explore Board</span>
              <span className="material-symbols-outlined text-[13px] group-hover:translate-x-1 transition-transform">
                chevron_right
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
