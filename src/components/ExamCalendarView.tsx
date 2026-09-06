import React from 'react';

export interface ExamCalendarViewProps {
  onNavigate: (tab: string, jobId?: string) => void;
}

export const ExamCalendarView: React.FC<ExamCalendarViewProps> = ({ onNavigate }) => {
  const calendarMonths = [
    {
      month: 'May 2025',
      exams: [
        { date: '25 May', name: 'UPSC Civil Services (Prelims) 2025', board: 'UPSC', type: 'Offline Pen-Paper', status: 'Admit Card Out' },
        { date: '28 May', name: 'NTA CUET UG 2025 Phase-II', board: 'NTA', type: 'CBT Mode', status: 'Schedule Released' },
      ],
    },
    {
      month: 'July 2025',
      exams: [
        { date: '07 July', name: 'CTET Central Teacher Eligibility Test', board: 'CBSE', type: 'Offline', status: 'Pre-Admit Card Out' },
        { date: '14-27 July', name: 'SSC CHSL Tier-I Computer Examination', board: 'SSC', type: 'CBT (Multi-Shift)', status: 'Active' },
      ],
    },
    {
      month: 'August 2025',
      exams: [
        { date: '03, 04, 10 Aug', name: 'IBPS RRB Clerk & Officer Scale-I Prelims', board: 'IBPS', type: 'Online CBT', status: 'Call Letter Live' },
        { date: '23-31 Aug', name: 'UP Police Constable Direct Recruitment Re-Exam', board: 'UPPRPB', type: 'OMR Based', status: 'Urgent City Slip' },
        { date: '28 Aug Onwards', name: 'Railway RRB ALP CEN 01/2024 Stage-1 CBT', board: 'RRB', type: 'CBT', status: 'City Slip Out' },
      ],
    },
    {
      month: 'September 2025',
      exams: [
        { date: '09-26 Sept', name: 'SSC CGL Tier-I Combined Graduate Level 2025', board: 'SSC', type: 'CBT (17,727 Posts)', status: 'Date Confirmed' },
        { date: '14 Sept', name: 'UPSC CDS-II 2025 Examination', board: 'UPSC', type: 'Offline Pen-Paper', status: 'Notification Active' },
        { date: 'Late Sept', name: 'IBPS PO XV Online Preliminary Exam', board: 'IBPS', type: 'CBT', status: 'Apply Window Open' },
      ],
    },
    {
      month: 'October - November 2025',
      exams: [
        { date: 'Oct - Nov', name: 'Railway RRB NTPC CEN 05/2025 CBT-1', board: 'RRB', type: 'CBT (11,558 Posts)', status: 'Registration Live' },
        { date: 'November', name: 'UP Police Sub Inspector (SI) Written Exam', board: 'UPPRPB', type: 'Online Test', status: 'Form Active' },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#00236f] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] font-bold">Official Sarkari Exam Calendar 2025-26</span>
      </nav>

      {/* 2. Banner */}
      <div className="bg-gradient-to-r from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <span className="inline-block bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          Commission Annual Schedules
        </span>
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
          2025-2026 Sarkari Examination Calendar
        </h1>
        <p className="text-white/80 text-xs md:text-sm mt-2 max-w-2xl">
          Confirmed examination dates, CBT shift timings, admit card release windows & commission annual planners.
        </p>
      </div>

      {/* 3. Monthly Timeline */}
      <div className="space-y-6">
        {calendarMonths.map((cal, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#eff4ff]">
              <span className="material-symbols-outlined text-[#00236f] text-[20px]">event</span>
              <h2 className="font-display font-extrabold text-base text-[#00236f]">{cal.month}</h2>
            </div>

            <div className="divide-y divide-[#eff4ff]">
              {cal.exams.map((ex, exIdx) => (
                <div key={exIdx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="bg-[#ffdcc3] text-[#2f1500] font-black px-2.5 py-1 rounded-lg text-xs shrink-0">
                      {ex.date}
                    </span>
                    <div>
                      <h4 className="font-bold text-[#0b1c30] text-xs md:text-sm">{ex.name}</h4>
                      <p className="text-[11px] text-[#757682]">{ex.board} • {ex.type}</p>
                    </div>
                  </div>

                  <span className="bg-[#eff4ff] text-[#00236f] font-bold px-3 py-1 rounded-full text-[11px] self-start sm:self-auto">
                    {ex.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
