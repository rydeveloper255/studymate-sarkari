import React, { useState, useMemo } from 'react';
import { AdmitCardItem } from '../types';

export interface AdmitCardViewProps {
  admitCards: AdmitCardItem[];
  onNavigate: (tab: string, jobId?: string) => void;
}

export const AdmitCardView: React.FC<AdmitCardViewProps> = ({ admitCards, onNavigate }) => {
  const [selectedCommission, setSelectedCommission] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = useMemo(() => {
    return admitCards.filter((card) => {
      const matchesSearch =
        !searchQuery.trim() ||
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.commission.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.examName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesComm =
        selectedCommission === 'all' || card.commissionCode === selectedCommission;
      const matchesMonth = selectedMonth === 'all' || card.month.includes(selectedMonth);

      return matchesSearch && matchesComm && matchesMonth;
    });
  }, [admitCards, searchQuery, selectedCommission, selectedMonth]);

  const commissionFilters = [
    { code: 'all', label: 'All Commissions' },
    { code: 'upsc', label: 'UPSC (Civil)' },
    { code: 'ssc', label: 'SSC (All Regions)' },
    { code: 'railways', label: 'Railways (RRB)' },
    { code: 'banking', label: 'Banking (IBPS/SBI)' },
    { code: 'state-psc', label: 'State PSC & Police' },
    { code: 'nta', label: 'NTA & Teaching' },
  ];

  const regionalSSCLinks = [
    { region: 'Northern Region (NR)', states: 'Delhi, Rajasthan, Uttarakhand', url: 'https://sscnr.nic.in', server: 'Server 1 (Active)' },
    { region: 'Central Region (CR)', states: 'Uttar Pradesh & Bihar', url: 'https://ssc-cr.org', server: 'Server 2 (High Traffic)' },
    { region: 'Western Region (WR)', states: 'Maharashtra, Gujarat, Goa', url: 'https://sscwr.net', server: 'Server 1 (Active)' },
    { region: 'Eastern Region (ER)', states: 'West Bengal, Odisha, Jharkhand', url: 'https://sscer.org', server: 'Server 1 (Active)' },
    { region: 'Southern Region (SR)', states: 'Andhra Pradesh, Telangana, Tamil Nadu', url: 'https://sscsr.gov.in', server: 'Server 1 (Active)' },
    { region: 'Karnataka Kerala (KKR)', states: 'Karnataka, Kerala, Lakshadweep', url: 'https://ssckkr.kar.nic.in', server: 'Server 1 (Active)' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#00236f] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] font-bold">Admit Card & City Slip Portal 2025</span>
      </nav>

      {/* 2. Asymmetric Bento Header */}
      <div className="bg-gradient-to-r from-[#904d00] via-[#fe932c] to-[#6e3900] rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block bg-white/20 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
            Centralized Call Letter Gateway
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
            Government Examination Admit Cards & Hall Tickets
          </h1>
          <p className="text-white/90 text-xs md:text-sm mt-2">
            Direct high-speed official server download links for UPSC, SSC, Railways, State PSC, Defence & Banking exams.
          </p>
        </div>
      </div>

      {/* 3. Three Candidate Journey Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-4 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#dce1ff] text-[#00236f] flex items-center justify-center shrink-0 font-black">
            1
          </div>
          <div>
            <h3 className="font-display font-bold text-xs md:text-sm text-[#00236f]">Application Status</h3>
            <p className="text-[11px] text-[#444651] mt-0.5">
              Check if your application is accepted or rejected by commission with exact reason.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-4 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center shrink-0 font-black">
            2
          </div>
          <div>
            <h3 className="font-display font-bold text-xs md:text-sm text-[#904d00]">City Intimation Slip</h3>
            <p className="text-[11px] text-[#444651] mt-0.5">
              Know your allotted exam city & shift timing 10 days before the exam for travel bookings.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-4 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#85f8c4] text-[#002114] flex items-center justify-center shrink-0 font-black">
            3
          </div>
          <div>
            <h3 className="font-display font-bold text-xs md:text-sm text-[#003120]">Final Hall Ticket</h3>
            <p className="text-[11px] text-[#444651] mt-0.5">
              Download printable e-Admit Card with venue code, roll number & instructions 4 days before exam.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#d3e4fe] p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2 w-full sm:max-w-md">
            <span className="material-symbols-outlined text-[#757682] text-[20px] mr-2">search</span>
            <input
              type="text"
              placeholder="Search exam name, UPSC, SSC, RRB, Police..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#0b1c30] placeholder:text-[#757682] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#eff4ff] text-xs text-[#0b1c30] font-bold p-2 rounded-xl focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Exam Months</option>
              <option value="may-2025">May 2025</option>
              <option value="july-2025">July 2025</option>
              <option value="august-2025">August 2025</option>
              <option value="september-2025">September 2025</option>
            </select>
          </div>
        </div>

        {/* Commission chips */}
        <div className="pt-2 border-t border-[#eff4ff] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {commissionFilters.map((comm) => {
            const isSelected = selectedCommission === comm.code;
            return (
              <button
                key={comm.code}
                onClick={() => setSelectedCommission(comm.code)}
                className={`text-xs px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#904d00] text-white shadow-xs'
                    : 'bg-[#eff4ff] text-[#444651] hover:bg-[#dce9ff]'
                }`}
              >
                {comm.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Active Admit Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="bg-[#ffdcc3] text-[#2f1500] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {card.statusBadge}
                </span>
                <span className="text-[11px] font-bold text-[#757682]">{card.commission}</span>
              </div>
              <h2 className="font-display font-extrabold text-base text-[#0b1c30] leading-snug">
                {card.title}
              </h2>
              <p className="text-xs font-semibold text-[#00236f] mt-1">{card.examName}</p>

              <div className="mt-3 p-3 bg-[#eff4ff] rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#757682]">Exam Date:</span>
                  <strong className="text-[#904d00]">{card.examDateFormatted}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#757682]">Requirements:</span>
                  <span className="font-medium text-[#0b1c30] truncate max-w-[200px]">{card.requirements}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#eff4ff] flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#757682]">{card.updatedTime}</span>
              <div className="flex items-center gap-2">
                <a
                  href={card.citySlipUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#904d00] text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  City Slip
                </a>
                <a
                  href={card.hallTicketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#904d00] hover:bg-[#6e3900] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                >
                  Download Admit Card
                  <span className="material-symbols-outlined text-[14px]">download</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 6. Regional SSC Download Gateway Matrix Table */}
      <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs">
        <h2 className="font-display font-extrabold text-base md:text-lg text-[#00236f] flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[20px]">public</span>
          SSC Regional Directorate Direct Hall Ticket Portals
        </h2>
        <p className="text-xs text-[#444651] mb-4">
          Candidates must download their admit card from their specific regional directorate where they opted for exam center.
        </p>

        <div className="overflow-x-auto rounded-xl border border-[#eff4ff]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#eff4ff] text-[#00236f] font-bold">
              <tr>
                <th className="p-3">SSC Regional Directorate</th>
                <th className="p-3">Covered States / UTs</th>
                <th className="p-3">Mirror Server</th>
                <th className="p-3 text-right">Direct Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eff4ff] text-[#0b1c30]">
              {regionalSSCLinks.map((reg, idx) => (
                <tr key={idx} className="hover:bg-[#eff4ff]/40">
                  <td className="p-3 font-bold text-[#00236f]">{reg.region}</td>
                  <td className="p-3">{reg.states}</td>
                  <td className="p-3">
                    <span className="bg-[#85f8c4] text-[#002114] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {reg.server}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <a
                      href={reg.url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#00236f] text-white font-bold px-3 py-1 rounded-md text-[11px] inline-flex items-center gap-1 hover:bg-[#1e3a8a]"
                    >
                      Open Portal <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
