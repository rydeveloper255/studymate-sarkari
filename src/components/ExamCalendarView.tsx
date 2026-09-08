import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PreVacancyNoticeItem } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

export interface ExamCalendarViewProps {
  onNavigate: (tab: string, jobId?: string) => void;
  notifications?: PreVacancyNoticeItem[];
}

interface ExamScheduleItem {
  id: string;
  name: string;
  board: 'UPSC' | 'SSC' | 'RRB' | 'IBPS' | 'State' | 'NTA';
  dateStr: string;
  targetDate: string; // ISO date string for countdown
  mode: string;
  vacancies?: string;
  status: string;
  admitCardStatus: string;
}

const UPCOMING_EXAMS: ExamScheduleItem[] = [
  {
    id: 'ssc-cgl-2025',
    name: 'SSC CGL 2025 Tier-I (Combined Graduate Level)',
    board: 'SSC',
    dateStr: '09 - 26 September 2025',
    targetDate: '2025-09-09T09:00:00',
    mode: 'Computer Based Test (CBT)',
    vacancies: '17,727 Posts',
    status: 'Confirmed by SSC Calendar',
    admitCardStatus: 'City Slip 10 Days Before Exam',
  },
  {
    id: 'upsc-cds-2025',
    name: 'UPSC Combined Defence Services (CDS-II) 2025',
    board: 'UPSC',
    dateStr: '14 September 2025',
    targetDate: '2025-09-14T09:00:00',
    mode: 'Offline Pen-Paper OMR',
    vacancies: '459 Posts',
    status: 'Official UPSC Notice Active',
    admitCardStatus: 'Hall Ticket 2 Weeks Prior',
  },
  {
    id: 'rrb-alp-2025',
    name: 'Railway RRB ALP (Assistant Loco Pilot) CBT-1',
    board: 'RRB',
    dateStr: '28 August - 06 Sept 2025',
    targetDate: '2025-08-28T10:00:00',
    mode: 'CBT (Multi-Shift)',
    vacancies: '18,799 Posts',
    status: 'Exam Date Confirmed',
    admitCardStatus: 'City Intimation Active',
  },
  {
    id: 'ibps-po-2025',
    name: 'IBPS PO / MT XV Preliminary Online Exam',
    board: 'IBPS',
    dateStr: '19 & 20 October 2025',
    targetDate: '2025-10-19T08:30:00',
    mode: 'Online Objective CBT',
    vacancies: '3,955+ Posts',
    status: 'Registration Window Open',
    admitCardStatus: 'Call Letter in October',
  },
  {
    id: 'up-police-si-2025',
    name: 'UP Police Sub-Inspector (SI) Written Examination',
    board: 'State',
    dateStr: '15 - 20 November 2025',
    targetDate: '2025-11-15T10:00:00',
    mode: 'CBT / OMR Based',
    vacancies: '4,200 Posts',
    status: 'Board Schedule Announced',
    admitCardStatus: 'Expected 1st Week of Nov',
  },
  {
    id: 'rrb-ntpc-2025',
    name: 'Railway RRB NTPC CEN 05/2025 CBT-1',
    board: 'RRB',
    dateStr: 'December 2025 - January 2026',
    targetDate: '2025-12-15T09:00:00',
    mode: 'Computer Based Test',
    vacancies: '11,558 Posts',
    status: 'Tentative Commission Schedule',
    admitCardStatus: 'City Slip 10 Days Before Exam',
  },
];

export const ExamCalendarView: React.FC<ExamCalendarViewProps> = ({ onNavigate, notifications = INITIAL_NOTIFICATIONS }) => {
  const { language } = useLanguage();
  const [activeCalendarTab, setActiveCalendarTab] = useState<'schedules' | 'pre_vacancy'>('schedules');
  const [selectedBoard, setSelectedBoard] = useState<string>('All');
  const [notifSearch, setNotifSearch] = useState<string>('');
  const [notifCategory, setNotifCategory] = useState<string>('All');
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdown = (targetDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const diff = target - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isLive: false };
  };

  const filteredExams = UPCOMING_EXAMS.filter((ex) => {
    if (selectedBoard === 'All') return true;
    return ex.board === selectedBoard;
  });

  const filteredNotifs = notifications.filter((item) => {
    const matchSearch =
      !notifSearch.trim() ||
      item.title.toLowerCase().includes(notifSearch.toLowerCase()) ||
      item.department.toLowerCase().includes(notifSearch.toLowerCase());
    const matchCat = notifCategory === 'All' || item.category === notifCategory || item.noticeType === notifCategory;
    return matchSearch && matchCat;
  });

  const handleAddToCalendar = (exam: ExamScheduleItem) => {
    const title = encodeURIComponent(`${exam.name} - Examination Date`);
    const details = encodeURIComponent(
      `Official Sarkari Exam: ${exam.name}. Mode: ${exam.mode}. Track updates on StudyMate Sarkari.`
    );
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(gCalUrl, '_blank');
  };

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
          {language === 'hi'
            ? 'सरकारी परीक्षा कैलेंडर एवं लाइव काउंटडाउन 2025-26'
            : 'Official Sarkari Exam Calendar & Live Countdown Planner'}
        </span>
      </nav>

      {/* 2. Banner Header */}
      <div className="bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#7c2d12] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Commission Annual Schedules 2025-2026</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight">
            {language === 'hi'
              ? 'आगामी सरकारी परीक्षाओं की तिथियां एवं लाइव उल्टी गिनती (Countdown)'
              : 'Upcoming Sarkari Exam Schedules & Live Days Countdown'}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            {language === 'hi'
              ? 'एसएससी, यूपीएससी, रेलवे व बैंकिंग आयोगों द्वारा घोषित वास्तविक परीक्षा तारीखें एवं गूगल कैलेंडर सिंक।'
              : 'Real-time countdown clocks, CBT shift timings, city slip release windows, and 1-click Google Calendar reminders.'}
          </p>
        </div>
      </div>

      {/* 2.5 Primary Tab Selector: Schedules vs Pre-Vacancy Notifications */}
      <div className="flex items-center gap-3 bg-white dark:bg-[#101b2c] p-1.5 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs">
        <button
          onClick={() => setActiveCalendarTab('schedules')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCalendarTab === 'schedules'
              ? 'bg-[#00236f] dark:bg-[#2563eb] text-white shadow-sm'
              : 'text-[#444651] dark:text-[#94a3b8] hover:bg-[#eff4ff] dark:hover:bg-[#1e293b]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span>{language === 'hi' ? 'परीक्षा तिथियां व उल्टी गिनती (Schedules)' : 'Exam Schedules & Live Countdown'}</span>
        </button>

        <button
          onClick={() => setActiveCalendarTab('pre_vacancy')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
            activeCalendarTab === 'pre_vacancy'
              ? 'bg-gradient-to-r from-[#904d00] to-[#b45309] text-white shadow-sm'
              : 'text-[#444651] dark:text-[#94a3b8] hover:bg-[#fff7ed] dark:hover:bg-[#1e293b]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">campaign</span>
          <span>{language === 'hi' ? 'आगामी भर्ती विज्ञापन व शॉर्ट नोटिस (Circulars)' : 'Pre-Vacancy & Short Notices'}</span>
          <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full ml-1 animate-pulse">
            {notifications.length}
          </span>
        </button>
      </div>

      {activeCalendarTab === 'schedules' && (
        <>
          {/* 3. Board Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {['All', 'SSC', 'UPSC', 'RRB', 'IBPS', 'State'].map((board) => (
              <button
                key={board}
                onClick={() => setSelectedBoard(board)}
                className={`px-4 py-2 rounded-2xl font-bold transition-all shrink-0 cursor-pointer ${
                  selectedBoard === board
                    ? 'bg-[#00236f] dark:bg-[#2563eb] text-white shadow-xs'
                    : 'bg-white dark:bg-[#101b2c] text-[#444651] dark:text-[#cbd5e1] border border-[#d3e4fe] dark:border-[#1e324c] hover:bg-[#eff4ff]'
                }`}
              >
                {board === 'All' ? (language === 'hi' ? 'सभी आयोग' : 'All Boards') : board}
              </button>
            ))}
          </div>

          {/* 4. Exam Cards Grid with Live Clocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredExams.map((exam) => {
              const cd = getCountdown(exam.targetDate);
              return (
                <div
                  key={exam.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#00236f] text-white">
                        {exam.board}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                        {exam.status}
                      </span>
                    </div>

                    {/* Exam Title */}
                    <h3 className="font-display font-extrabold text-base text-[#0b1c30] dark:text-white group-hover:text-[#00236f] dark:group-hover:text-[#38bdf8] transition-colors leading-snug">
                      {exam.name}
                    </h3>
                    <p className="text-xs text-[#757682] dark:text-[#94a3b8] mt-1">
                      {exam.mode} &bull; <strong className="text-[#00236f] dark:text-[#93c5fd]">{exam.vacancies}</strong>
                    </p>

                    {/* Date Highlight */}
                    <div className="mt-3 p-3 rounded-2xl bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe]/60 dark:border-[#1e324c] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0b1c30] dark:text-white">
                        <span className="material-symbols-outlined text-[18px] text-[#00236f] dark:text-[#38bdf8]">
                          calendar_today
                        </span>
                        <span>{exam.dateStr}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                        {exam.admitCardStatus}
                      </span>
                    </div>

                    {/* Live Countdown Clock */}
                    <div className="mt-4 pt-3 border-t border-[#eff4ff] dark:border-[#1e324c]">
                      <span className="text-[10px] font-black uppercase text-[#757682] dark:text-[#94a3b8] block mb-2 tracking-wider">
                        ⏱️ Live Time Remaining (उल्टी गिनती)
                      </span>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                          <span className="font-mono font-black text-lg sm:text-xl text-[#00236f] dark:text-[#38bdf8] block">
                            {cd.days}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-500">Days</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                          <span className="font-mono font-black text-lg sm:text-xl text-[#00236f] dark:text-[#38bdf8] block">
                            {cd.hours}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-500">Hours</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                          <span className="font-mono font-black text-lg sm:text-xl text-[#00236f] dark:text-[#38bdf8] block">
                            {cd.minutes}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-500">Mins</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                          <span className="font-mono font-black text-lg sm:text-xl text-rose-600 dark:text-rose-400 block animate-pulse">
                            {cd.seconds}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-500">Secs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => handleAddToCalendar(exam)}
                      className="px-3.5 py-2 rounded-xl bg-[#eff4ff] dark:bg-[#1e293b] hover:bg-[#dce9ff] text-[#00236f] dark:text-[#93c5fd] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">notification_add</span>
                      <span>{language === 'hi' ? 'कैलेंडर में जोड़ें' : 'Add to Google Cal'}</span>
                    </button>

                    <button
                      onClick={() => onNavigate('job-detail', exam.id)}
                      className="px-3.5 py-2 rounded-xl bg-[#00236f] hover:bg-[#00174c] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === 'hi' ? 'सिलेबस व एडमिट कार्ड' : 'Admit Card & Info'}</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 5. Pre-Vacancy Circulars & Short Notices View */}
      {activeCalendarTab === 'pre_vacancy' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#101b2c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex items-center bg-[#eff4ff] dark:bg-[#0b1626] rounded-xl px-3 py-2 w-full sm:max-w-md">
              <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">search</span>
              <input
                type="text"
                placeholder="Search upcoming circulars (SSC, Railway, Police, BPSC)..."
                value={notifSearch}
                onChange={(e) => setNotifSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-[#0b1c30] dark:text-white placeholder:text-[#757682] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none text-xs">
              {['All', 'Upcoming Vacancy', 'Short Notice', 'Exam Calendar', 'Rozgar Samachar', 'Railway', 'SSC', 'Police', 'Banking'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNotifCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                    notifCategory === cat
                      ? 'bg-[#904d00] text-white shadow-xs'
                      : 'bg-[#eff4ff] dark:bg-[#1e293b] text-[#444651] dark:text-[#cbd5e1] hover:bg-[#dce9ff]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotifs.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 uppercase tracking-wider">
                      {item.noticeType}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {item.releaseDate}
                    </span>
                  </div>

                  <h3 className="font-display font-extrabold text-sm sm:text-base text-[#0b1c30] dark:text-white group-hover:text-[#904d00] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#757682] dark:text-[#94a3b8] mt-1">
                    Department: <strong className="text-[#0b1c30] dark:text-white">{item.department}</strong>
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe]/50 dark:border-[#1e324c] flex items-center justify-between text-xs">
                    <span className="text-[#444651] dark:text-[#94a3b8]">Expected Vacancy / Scale:</span>
                    <span className="font-black text-[#00236f] dark:text-[#38bdf8]">{item.expectedVacancies}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#eff4ff] dark:border-[#1e324c] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Verified Gazette Circular
                  </span>

                  <a
                    href={item.officialPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#904d00] to-[#b45309] hover:from-[#783c00] hover:to-[#92400e] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Download Official PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
