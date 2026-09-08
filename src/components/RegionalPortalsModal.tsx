import React, { useState } from 'react';
import { RegionalPortalLink } from '../types';

export const SSC_REGIONS_DATA: RegionalPortalLink[] = [
  {
    region: 'SSC Central Region (CR)',
    states: 'Uttar Pradesh (UP) & Bihar',
    server: 'Direct Digialm Server',
    url: 'https://www.ssc-cr.org',
    directLoginUrl: 'https://www.ssc-cr.org/admit_card.php',
  },
  {
    region: 'SSC Northern Region (NR)',
    states: 'Delhi, Rajasthan, Uttarakhand',
    server: 'Direct Digialm Server',
    url: 'https://sscnr.nic.in',
    directLoginUrl: 'https://sscnr.nic.in/newportal/admit_card',
  },
  {
    region: 'SSC Eastern Region (ER)',
    states: 'West Bengal, Odisha, Jharkhand, A&N Islands, Sikkim',
    server: 'Active Mirror Server',
    url: 'https://www.sscer.org',
    directLoginUrl: 'https://www.sscer.org/admit-card',
  },
  {
    region: 'SSC Western Region (WR)',
    states: 'Maharashtra, Gujarat, Goa, Daman & Diu',
    server: 'High Speed Server',
    url: 'https://www.sscwr.net',
    directLoginUrl: 'https://www.sscwr.net/admitcard.php',
  },
  {
    region: 'SSC Southern Region (SR)',
    states: 'Andhra Pradesh, Telangana, Tamil Nadu, Puducherry',
    server: 'Direct Server',
    url: 'https://www.sscsr.gov.in',
    directLoginUrl: 'https://www.sscsr.gov.in/hall-ticket',
  },
  {
    region: 'SSC Karnataka Kerala (KKR)',
    states: 'Karnataka, Kerala, Lakshadweep',
    server: 'Active Mirror',
    url: 'https://ssckkr.kar.nic.in',
    directLoginUrl: 'https://ssckkr.kar.nic.in/admitcard',
  },
  {
    region: 'SSC Madhya Pradesh (MPR)',
    states: 'Madhya Pradesh, Chhattisgarh',
    server: 'Direct Server',
    url: 'https://www.sscmpr.org',
    directLoginUrl: 'https://www.sscmpr.org/admitcard',
  },
  {
    region: 'SSC North Eastern Region (NER)',
    states: 'Assam, Arunachal, Manipur, Meghalaya, Mizoram, Nagaland, Tripura',
    server: 'Active Server',
    url: 'https://www.sscner.org.in',
    directLoginUrl: 'https://www.sscner.org.in/admit-card',
  },
  {
    region: 'SSC North Western Region (NWR)',
    states: 'Punjab, Haryana, Himachal Pradesh, Chandigarh, J&K, Ladakh',
    server: 'High Speed Server',
    url: 'https://www.sscnwr.org',
    directLoginUrl: 'https://www.sscnwr.org/admit_card.php',
  },
];

export const RRB_ZONES_DATA: RegionalPortalLink[] = [
  { region: 'RRB Prayagraj / Allahabad', states: 'Uttar Pradesh (NCR / NR / NCR)', server: 'High Speed Server', url: 'https://www.rrbald.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Chandigarh', states: 'Punjab, Haryana, HP, Delhi, J&K', server: 'Direct Server', url: 'https://www.rrbcdg.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Patna', states: 'Bihar (ECR)', server: 'Direct Digialm Server', url: 'https://www.rrbpatna.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Mumbai', states: 'Maharashtra, Goa, parts of Karnataka', server: 'High Speed Server', url: 'https://www.rrbmumbai.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Kolkata', states: 'West Bengal (ER, SER, Metro)', server: 'Direct Server', url: 'https://www.rrbkolkata.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Secunderabad', states: 'Telangana & Andhra Pradesh (SCR)', server: 'Active Server', url: 'https://rrbsecunderabad.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Bhopal', states: 'Madhya Pradesh (WCR)', server: 'Direct Server', url: 'https://www.rrbbhopal.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Ajmer', states: 'Rajasthan (NWR)', server: 'Active Server', url: 'https://www.rrbajmer.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Ranchi', states: 'Jharkhand (SER/ECR)', server: 'Direct Server', url: 'https://www.rrbranchi.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Chennai', states: 'Tamil Nadu (SR)', server: 'Active Server', url: 'https://www.rrbchennai.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Ahmedabad', states: 'Gujarat (WR)', server: 'Direct Server', url: 'https://www.rrbahmedabad.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Gorakhpur', states: 'Eastern UP (NER)', server: 'Active Server', url: 'https://www.rrbgkp.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Guwahati', states: 'Assam & North East (NFR)', server: 'Direct Server', url: 'https://www.rrbguwahati.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Bengaluru', states: 'Karnataka (SWR)', server: 'High Speed Server', url: 'https://www.rrbbnc.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Bilaspur', states: 'Chhattisgarh (SECR)', server: 'Active Server', url: 'https://www.rrbbilaspur.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Bhubaneswar', states: 'Odisha (ECoR)', server: 'Direct Server', url: 'https://www.rrbbbs.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Jammu-Srinagar', states: 'Jammu & Kashmir (NR)', server: 'Active Server', url: 'https://www.rrbjammu.nic.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Malda', states: 'West Bengal (ER/NFR)', server: 'Direct Server', url: 'https://www.rrbmalda.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Muzaffarpur', states: 'North Bihar (ECR)', server: 'Active Server', url: 'https://www.rrbmuzaffarpur.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Siliguri', states: 'North Bengal & Sikkim', server: 'Direct Server', url: 'https://www.rrbsiliguri.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
  { region: 'RRB Thiruvananthapuram', states: 'Kerala (SR)', server: 'Active Server', url: 'https://www.rrbthiruvananthapuram.gov.in', directLoginUrl: 'https://www.rrbapply.gov.in' },
];

interface RegionalPortalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examName?: string;
  type?: 'ssc' | 'railways';
}

export const RegionalPortalsModal: React.FC<RegionalPortalsModalProps> = ({
  isOpen,
  onClose,
  examName = 'Staff Selection Commission / Railway Exam',
  type = 'ssc',
}) => {
  const [search, setSearch] = useState('');
  const [activeBoard, setActiveBoard] = useState<'ssc' | 'rrb'>(type === 'railways' ? 'rrb' : 'ssc');

  if (!isOpen) return null;

  const dataset = activeBoard === 'ssc' ? SSC_REGIONS_DATA : RRB_ZONES_DATA;
  const filtered = dataset.filter(
    (item) =>
      item.region.toLowerCase().includes(search.toLowerCase()) ||
      item.states.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#101b2c] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#d3e4fe] dark:border-[#1e324c] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#00236f] to-[#0038a8] text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full text-white">
              Direct Candidate Login Hub
            </span>
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-white mt-1">
              Select Your State / Region Directorate
            </h2>
            <p className="text-xs text-white/80 mt-0.5">{examName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Board Toggle & Search */}
        <div className="p-4 bg-[#eff4ff] dark:bg-[#070e1e] border-b border-[#d3e4fe] dark:border-[#1e324c] flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-[#101b2c] p-1 rounded-xl border border-[#d3e4fe] dark:border-[#1e324c] w-full sm:w-auto shrink-0">
            <button
              onClick={() => setActiveBoard('ssc')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBoard === 'ssc'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-[#444651] dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              SSC (All 9 Regions)
            </button>
            <button
              onClick={() => setActiveBoard('rrb')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBoard === 'rrb'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-[#444651] dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              RRB (All 21 Boards)
            </button>
          </div>

          <div className="relative flex items-center bg-white dark:bg-[#101b2c] rounded-xl px-3 py-2 w-full border border-[#d3e4fe] dark:border-[#1e324c]">
            <span className="material-symbols-outlined text-[#757682] text-[18px] mr-2">search</span>
            <input
              type="text"
              placeholder="Search by state (e.g. UP, Bihar, Delhi, Maharashtra, Rajasthan)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-[#0b1c30] dark:text-white placeholder:text-[#757682] focus:outline-none"
            />
          </div>
        </div>

        {/* Region List */}
        <div className="p-4 overflow-y-auto space-y-2.5 max-h-[50vh]">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#757682]">
              No regions matching "{search}". Try searching your state name.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] hover:border-[#00236f] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-extrabold text-xs sm:text-sm text-[#00236f] dark:text-[#93c5fd]">
                      {item.region}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                      {item.server}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#444651] dark:text-[#cbd5e1] mt-0.5">
                    States: <strong className="text-[#0b1c30] dark:text-white">{item.states}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.directLoginUrl || item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#00174c] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Direct Login Form</span>
                    <span className="material-symbols-outlined text-[13px]">login</span>
                  </a>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-[#eff4ff] dark:bg-[#1e293b] text-[#00236f] dark:text-[#93c5fd] hover:bg-[#dce9ff] font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Open Regional Website"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Instruction */}
        <div className="p-3.5 bg-[#eff4ff] dark:bg-[#070e1e] border-t border-[#d3e4fe] dark:border-[#1e324c] text-[11px] text-[#444651] dark:text-[#94a3b8] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
            Direct candidate login URLs bypass homepage traffic queues.
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#00236f] dark:text-[#38bdf8] hover:underline cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
