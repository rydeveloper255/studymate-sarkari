import React, { useState } from 'react';

interface ZoneData {
  id: string;
  name: string;
  headquarters: string;
  totalVacancies: number;
  expectedCutoffTrend: 'Very High' | 'High' | 'Moderate' | 'Balanced';
  competitionIndex: string;
}

const RRB_ZONES: ZoneData[] = [
  { id: 'rrb_ald', name: 'Northern Railway (RRB Prayagraj / New Delhi)', headquarters: 'Prayagraj / Delhi', totalVacancies: 4096, expectedCutoffTrend: 'Very High', competitionIndex: 'Top 1 (Highest)' },
  { id: 'rrb_pat', name: 'East Central Railway (RRB Patna)', headquarters: 'Patna', totalVacancies: 3250, expectedCutoffTrend: 'Very High', competitionIndex: 'Top 2' },
  { id: 'rrb_kol', name: 'Eastern Railway (RRB Kolkata)', headquarters: 'Kolkata', totalVacancies: 3022, expectedCutoffTrend: 'High', competitionIndex: 'High' },
  { id: 'rrb_mum', name: 'Central / Western Railway (RRB Mumbai)', headquarters: 'Mumbai', totalVacancies: 3665, expectedCutoffTrend: 'Moderate', competitionIndex: 'Balanced' },
  { id: 'rrb_sec', name: 'South Central Railway (RRB Secunderabad)', headquarters: 'Secunderabad', totalVacancies: 3234, expectedCutoffTrend: 'Moderate', competitionIndex: 'Moderate' },
  { id: 'rrb_che', name: 'Southern Railway (RRB Chennai)', headquarters: 'Chennai', totalVacancies: 2694, expectedCutoffTrend: 'Moderate', competitionIndex: 'Balanced' },
  { id: 'rrb_bhu', name: 'East Coast Railway (RRB Bhubaneswar)', headquarters: 'Bhubaneswar', totalVacancies: 1550, expectedCutoffTrend: 'High', competitionIndex: 'High' },
  { id: 'rrb_gua', name: 'Northeast Frontier Railway (RRB Guwahati)', headquarters: 'Guwahati', totalVacancies: 1380, expectedCutoffTrend: 'Balanced', competitionIndex: 'Low to Moderate' },
  { id: 'rrb_sri', name: 'Northern Railway (RRB Jammu & Srinagar)', headquarters: 'Jammu', totalVacancies: 898, expectedCutoffTrend: 'Balanced', competitionIndex: 'Favorable' },
];

export const ZonePreferenceComparator: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState<'rrb' | 'ssc_mts'>('rrb');
  const [zoneList, setZoneList] = useState<ZoneData[]>(RRB_ZONES);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...zoneList];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setZoneList(updated);
  };

  const moveDown = (index: number) => {
    if (index === zoneList.length - 1) return;
    const updated = [...zoneList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setZoneList(updated);
  };

  const handleCopyPreferences = () => {
    const text = zoneList
      .map((z, idx) => `Preference ${idx + 1}: ${z.name} (HQ: ${z.headquarters}) - ${z.totalVacancies} Vacancies`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
            <span className="material-symbols-outlined text-[24px]">reorder</span>
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
              State / Zone Preference Selector &amp; Vacancy Comparator
            </h2>
          </div>
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
            Compare Railway RRB &amp; SSC State quotas, vacancy density, and rearrange your priority sequence for application forms.
          </p>
        </div>

        <button
          onClick={handleCopyPreferences}
          className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">content_copy</span>
          <span>{copiedNotification ? '✓ Copied to Clipboard!' : 'Copy Order List'}</span>
        </button>
      </div>

      {/* Instructions callout */}
      <div className="p-3.5 bg-[#eff4ff] dark:bg-[#0c182c] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl text-xs text-[#334155] dark:text-[#cbd5e1] leading-relaxed">
        <strong>💡 Pro-Tip for Aspirants:</strong> Zones with higher vacancies (like Prayagraj &amp; Patna) also receive 10x more applicant volume, leading to higher normalized cutoffs. Moderate zones like Mumbai, Secunderabad &amp; Guwahati often offer higher probability of final selection.
      </div>

      {/* Reorderable Zone List */}
      <div className="space-y-2">
        {zoneList.map((zone, idx) => (
          <div
            key={zone.id}
            className="p-3 bg-white dark:bg-[#070e1e] border border-[#e2e8f0] dark:border-[#1e324c] rounded-xl flex items-center justify-between gap-3 hover:border-[#00236f] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#00236f] text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div>
                <span className="text-xs font-bold text-[#0b1c30] dark:text-white block">
                  {zone.name}
                </span>
                <div className="flex flex-wrap gap-2 text-[11px] text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                  <span>HQ: {zone.headquarters}</span>
                  <span>• Vacancies: <strong className="text-emerald-600 dark:text-emerald-400">{zone.totalVacancies}</strong></span>
                  <span>• Competition: <strong>{zone.competitionIndex}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#0f1d33] hover:bg-slate-200 dark:hover:bg-[#1e324c] text-[#0b1c30] dark:text-white flex items-center justify-center disabled:opacity-30 cursor-pointer"
                title="Move Up"
              >
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === zoneList.length - 1}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#0f1d33] hover:bg-slate-200 dark:hover:bg-[#1e324c] text-[#0b1c30] dark:text-white flex items-center justify-center disabled:opacity-30 cursor-pointer"
                title="Move Down"
              >
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
