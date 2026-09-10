import React, { useState, useEffect } from 'react';

interface MasterProfileData {
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  category: string;
  aadhaarNumber: string;
  tenthRoll: string;
  tenthBoard: string;
  tenthYear: string;
  tenthPercentage: string;
  twelfthRoll: string;
  twelfthBoard: string;
  twelfthPercentage: string;
  gradDegree: string;
  gradPercentage: string;
  mobile: string;
  email: string;
  permanentAddress: string;
  pincode: string;
}

const DEFAULT_PROFILE: MasterProfileData = {
  fullName: '',
  fatherName: '',
  motherName: '',
  dob: '',
  category: 'OBC',
  aadhaarNumber: '',
  tenthRoll: '',
  tenthBoard: 'CBSE / State Board',
  tenthYear: '2019',
  tenthPercentage: '',
  twelfthRoll: '',
  twelfthBoard: 'CBSE / State Board',
  twelfthPercentage: '',
  gradDegree: 'B.A / B.Sc / B.Tech',
  gradPercentage: '',
  mobile: '',
  email: '',
  permanentAddress: '',
  pincode: '',
};

export const MasterProfileFiller: React.FC = () => {
  const [profile, setProfile] = useState<MasterProfileData>(() => {
    try {
      const saved = localStorage.getItem('studymate_candidate_master_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('studymate_candidate_master_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [profile]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllSummary = () => {
    const summary = `
STUDYMATE SARKARI - CANDIDATE MASTER DETAILS
------------------------------------------
Name: ${profile.fullName}
Father: ${profile.fatherName}
Mother: ${profile.motherName}
DOB: ${profile.dob} | Category: ${profile.category}
Aadhaar No: ${profile.aadhaarNumber}
Phone: ${profile.mobile} | Email: ${profile.email}

10th Board: ${profile.tenthBoard} | Roll: ${profile.tenthRoll} | Year: ${profile.tenthYear} | Marks: ${profile.tenthPercentage}%
12th Board: ${profile.twelfthBoard} | Roll: ${profile.twelfthRoll} | Marks: ${profile.twelfthPercentage}%
Graduation: ${profile.gradDegree} | Marks: ${profile.gradPercentage}%

Address: ${profile.permanentAddress} - PIN: ${profile.pincode}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopiedKey('ALL');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div id="master-profile" className="bg-white dark:bg-[#0c182c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs scroll-mt-36">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-extrabold text-lg text-[#00236f] dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-amber-500">content_paste</span>
          1-Click Master Profile Form Filler (Instant Cyber-Cafe Data Copy)
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={copyAllSummary}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00236f] hover:bg-[#1e3a8a] text-white flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">copy_all</span>
            {copiedKey === 'ALL' ? 'All Copied! ✅' : 'Copy All Details'}
          </button>
        </div>
      </div>

      <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mb-5">
        Fill your roll numbers, certificate percentages, and details once. Data stays securely in your phone/browser (100% private). Tap any field to copy instantly while filling SSC, Railway, or UPSC forms!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
        {/* Full Name */}
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">Candidate Full Name (As per 10th)</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="e.g. RAHUL KUMAR SHARMA"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-lg px-2.5 py-1.5 font-bold text-[#0b1c30] dark:text-white"
            />
            <button
              onClick={() => copyToClipboard(profile.fullName, 'name')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00236f]"
              title="Copy"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === 'name' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Father Name */}
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">Father's Name</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="e.g. RAMESH SHARMA"
              value={profile.fatherName}
              onChange={(e) => setProfile({ ...profile, fatherName: e.target.value })}
              className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-lg px-2.5 py-1.5 font-bold text-[#0b1c30] dark:text-white"
            />
            <button
              onClick={() => copyToClipboard(profile.fatherName, 'father')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00236f]"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === 'father' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Aadhaar Number */}
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">Aadhaar Card No.</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX"
              value={profile.aadhaarNumber}
              onChange={(e) => setProfile({ ...profile, aadhaarNumber: e.target.value })}
              className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-lg px-2.5 py-1.5 font-mono font-bold text-[#0b1c30] dark:text-white"
            />
            <button
              onClick={() => copyToClipboard(profile.aadhaarNumber, 'aadhaar')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00236f]"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === 'aadhaar' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* 10th Roll Number */}
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">10th Class (Matric) Roll No.</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="e.g. 1284920"
              value={profile.tenthRoll}
              onChange={(e) => setProfile({ ...profile, tenthRoll: e.target.value })}
              className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-lg px-2.5 py-1.5 font-bold text-[#0b1c30] dark:text-white"
            />
            <button
              onClick={() => copyToClipboard(profile.tenthRoll, 'tenthRoll')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00236f]"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === 'tenthRoll' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* 10th Percentage */}
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">10th Marks / CGPA Percentage</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="e.g. 84.6%"
              value={profile.tenthPercentage}
              onChange={(e) => setProfile({ ...profile, tenthPercentage: e.target.value })}
              className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-lg px-2.5 py-1.5 font-bold text-[#0b1c30] dark:text-white"
            />
            <button
              onClick={() => copyToClipboard(profile.tenthPercentage, 'tenthPer')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00236f]"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === 'tenthPer' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* 12th Roll Number */}
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">12th (Inter) Roll No.</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="e.g. 2481029"
              value={profile.twelfthRoll}
              onChange={(e) => setProfile({ ...profile, twelfthRoll: e.target.value })}
              className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-lg px-2.5 py-1.5 font-bold text-[#0b1c30] dark:text-white"
            />
            <button
              onClick={() => copyToClipboard(profile.twelfthRoll, 'twelfthRoll')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00236f]"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === 'twelfthRoll' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Graduation Details */}
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">Graduation Percentage / CGPA</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="e.g. 72.4%"
              value={profile.gradPercentage}
              onChange={(e) => setProfile({ ...profile, gradPercentage: e.target.value })}
              className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-lg px-2.5 py-1.5 font-bold text-[#0b1c30] dark:text-white"
            />
            <button
              onClick={() => copyToClipboard(profile.gradPercentage, 'gradPer')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00236f]"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === 'gradPer' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">Registered Mobile Number</label>
          <div className="flex items-center gap-1">
            <input
              type="tel"
              placeholder="10-digit Mobile"
              value={profile.mobile}
              onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
              className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-lg px-2.5 py-1.5 font-bold text-[#0b1c30] dark:text-white"
            />
            <button
              onClick={() => copyToClipboard(profile.mobile, 'mobile')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00236f]"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === 'mobile' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">Email ID</label>
          <div className="flex items-center gap-1">
            <input
              type="email"
              placeholder="candidate@gmail.com"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full bg-[#f8fafc] dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] rounded-lg px-2.5 py-1.5 font-bold text-[#0b1c30] dark:text-white"
            />
            <button
              onClick={() => copyToClipboard(profile.email, 'email')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00236f]"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedKey === 'email' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Data is saved on your device only (Client-side localStorage). Never sent to any external server.
        </span>
        <button
          onClick={() => {
            setProfile(DEFAULT_PROFILE);
            localStorage.removeItem('studymate_candidate_master_profile');
          }}
          className="text-rose-600 hover:underline cursor-pointer"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
