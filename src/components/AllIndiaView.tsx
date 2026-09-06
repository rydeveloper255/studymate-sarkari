import React from 'react';
import { JobItem } from '../types';

export interface AllIndiaViewProps {
  jobs: JobItem[];
  onSelectJob: (jobId: string) => void;
  onNavigate: (tab: string) => void;
}

export const AllIndiaView: React.FC<AllIndiaViewProps> = ({ jobs, onSelectJob, onNavigate }) => {
  const centralCommissions = [
    {
      name: 'Staff Selection Commission (SSC)',
      short: 'SSC',
      portal: 'https://ssc.gov.in',
      desc: 'CGL, CHSL, MTS, CPO SI, GD Constable, Stenographer & Selection Posts.',
      badge: '17,727+ Vacancies Active',
      category: 'SSC',
    },
    {
      name: 'Railway Recruitment Boards (RRB)',
      short: 'Railways',
      portal: 'https://rrbapply.gov.in',
      desc: 'ALP Assistant Loco Pilot, Technician, NTPC, Group D & Junior Engineer.',
      badge: '11,558+ Vacancies Active',
      category: 'Railway',
    },
    {
      name: 'Union Public Service Commission (UPSC)',
      short: 'UPSC',
      portal: 'https://upsc.gov.in',
      desc: 'Civil Services IAS/IPS, NDA, CDS, CMS, IES & Central Armed Police (CAPF).',
      badge: 'Civil Services 2025 Live',
      category: 'UPSC',
    },
    {
      name: 'Institute of Banking Personnel (IBPS & SBI)',
      short: 'Banking',
      portal: 'https://ibps.in',
      desc: 'PO Probationary Officer, Clerk, SO Specialist, SBI PO & RBI Grade B.',
      badge: '6,128+ Bank Posts',
      category: 'Banking',
    },
    {
      name: 'Defence Recruitment (Army, Navy, Airforce)',
      short: 'Defence',
      portal: 'https://joinindianarmy.nic.in',
      desc: 'Agniveer Recruitment, AFCAT, Navy SSR & Coast Guard Navik.',
      badge: 'Agniveer 2025 Active',
      category: 'Defence',
    },
    {
      name: 'National Testing Agency (NTA)',
      short: 'NTA',
      portal: 'https://nta.ac.in',
      desc: 'UGC NET Assistant Professor/JRF, CSIR NET, JEE, NEET & CUET.',
      badge: 'UGC NET 2025 Live',
      category: 'Teaching',
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
        <span className="text-[#0b1c30] font-bold">Central Government & All India Jobs 2025</span>
      </nav>

      {/* 2. Banner */}
      <div className="bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#003120] rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <span className="inline-block bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          Central Government Ministries
        </span>
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
          All India Central Recruitment Boards
        </h1>
        <p className="text-white/80 text-xs md:text-sm mt-2 max-w-2xl">
          Direct recruitment links for SSC, UPSC, Railway RRB, IBPS Banking, Defence Agniveer and NTA Central vacancies.
        </p>
      </div>

      {/* 3. Central Commissions Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {centralCommissions.map((comm, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="bg-[#dce1ff] text-[#00164e] text-[10px] font-black px-2 py-0.5 rounded">
                  {comm.short}
                </span>
                <span className="text-[10px] font-bold text-[#004a32] bg-[#85f8c4]/30 px-2 py-0.5 rounded">
                  {comm.badge}
                </span>
              </div>
              <h3 className="font-display font-black text-base text-[#00236f] leading-snug">
                {comm.name}
              </h3>
              <p className="text-xs text-[#444651] mt-2 leading-relaxed">{comm.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#eff4ff] flex items-center justify-between gap-2">
              <button
                onClick={() => onNavigate('latest-jobs')}
                className="text-xs font-bold text-[#00236f] hover:underline flex items-center gap-1"
              >
                View Jobs <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
              <a
                href={comm.portal}
                target="_blank"
                rel="noreferrer"
                className="bg-[#00236f] text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 hover:bg-[#1e3a8a]"
              >
                Official Portal <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
