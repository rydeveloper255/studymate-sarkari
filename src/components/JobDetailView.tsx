import React, { useState, useEffect } from 'react';
import { JobItem } from '../types';

export interface JobDetailViewProps {
  job: JobItem;
  isSaved: boolean;
  onToggleBookmark: (jobId: string) => void;
  onBack: () => void;
  onNavigate: (tab: string, jobId?: string) => void;
}

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  isSaved,
  onToggleBookmark,
  onBack,
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState('dates');
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Interactive Countdown Timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 3,
    hours: 14,
    minutes: 22,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Share and Social Helpers
  const getShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}#job-detail?id=${job.id}`;
  };

  const getShareText = () => {
    const lastDateClean = job.lastDate ? job.lastDate.split('(')[0].trim() : 'Check Details';
    return `📢 *${job.title}*\n🏛️ Dept: ${job.department}\n🎯 Total Posts: ${job.vacanciesFormatted} Vacancies\n📅 Last Date: ${lastDateClean}\n💰 Pay Scale: ${job.payLevel}\n\n🔗 View Full Details & Apply Online:\n`;
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    const text = getShareText();
    const title = `${job.shortTitle || job.title} - StudyMate Sarkari`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: text + url,
          url,
        });
        setShareSuccess('Shared successfully! ✅');
        setTimeout(() => setShareSuccess(null), 3500);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setShareSuccess('Job Link copied to clipboard! 📋');
      setTimeout(() => setShareSuccess(null), 3500);
    } catch {
      setShareSuccess('Failed to copy link');
    }
  };

  const handleWhatsAppShare = () => {
    const url = getShareUrl();
    const text = getShareText();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + url)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const url = getShareUrl();
    const text = getShareText();
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  // Mini Age Calculator state
  const [dob, setDob] = useState('2000-01-15');
  const [userCategory, setUserCategory] = useState<'UR' | 'OBC' | 'SC' | 'ST' | 'PwD'>('UR');
  const [calculatedAge, setCalculatedAge] = useState<string | null>('25 Years, 6 Months (Eligible for all posts)');

  const handleCalculateAge = () => {
    if (!dob) return;
    const birthDate = new Date(dob);
    const crucialDate = new Date('2025-08-01');
    let years = crucialDate.getFullYear() - birthDate.getFullYear();
    let months = crucialDate.getMonth() - birthDate.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    const maxAge = userCategory === 'SC' || userCategory === 'ST' ? 37 : userCategory === 'OBC' ? 35 : 32;
    const isEligible = years >= 18 && years <= maxAge;
    setCalculatedAge(
      `${years} Years, ${months} Months as on 01-08-2025 (${isEligible ? '✅ ELIGIBLE' : '❌ AGE EXCEEDED'})`
    );
  };

  const navSections = [
    { id: 'dates', label: 'Important Dates', icon: 'calendar_month' },
    { id: 'fee', label: 'Application Fee', icon: 'payments' },
    { id: 'age', label: 'Age Limit', icon: 'cake' },
    { id: 'vacancies', label: 'Post-Wise Vacancies', icon: 'view_list' },
    { id: 'pattern', label: 'Exam Pattern', icon: 'analytics' },
    { id: 'how-to-apply', label: 'How to Apply', icon: 'checklist' },
    { id: 'direct-links', label: 'Official Links', icon: 'link' },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. Breadcrumb Bar */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={onBack} className="hover:text-[#00236f] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <button onClick={() => onNavigate('latest-jobs')} className="hover:text-[#00236f]">
          {job.category}
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] font-bold truncate">{job.shortTitle || job.title}</span>
      </nav>

      {/* 2. Top Header Summary Card */}
      <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs relative">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#85f8c4] text-[#002114] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Official Gazette Verified
            </span>
            <span className="bg-[#dce1ff] text-[#00164e] text-xs font-bold px-2.5 py-1 rounded-md">
              {job.advtNo}
            </span>
            <span className="text-xs font-semibold text-[#757682] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span> Updated: {job.updatedTime}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Native Share Button */}
            <button
              onClick={handleNativeShare}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#00236f] hover:bg-[#1e3a8a] text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              title="Share job via WhatsApp, Telegram, or Web Share"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>Share Job</span>
            </button>

            {/* Quick WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#075E54] border border-[#25D366]/30 transition-all flex items-center gap-1 cursor-pointer"
              title="Share on WhatsApp"
            >
              <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Quick Telegram Share */}
            <button
              onClick={handleTelegramShare}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#0088cc] border border-[#229ED9]/30 transition-all flex items-center gap-1 cursor-pointer"
              title="Share on Telegram"
            >
              <span className="material-symbols-outlined text-[16px] text-[#229ED9]">send</span>
              <span className="hidden sm:inline">Telegram</span>
            </button>

            {/* Bookmark Job Button */}
            <button
              onClick={() => onToggleBookmark(job.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSaved
                  ? 'bg-[#ffdcc3] text-[#904d00]'
                  : 'bg-[#eff4ff] text-[#00236f] hover:bg-[#dce9ff]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSaved ? 'bookmark_added' : 'bookmark_add'}
              </span>
              <span className="hidden md:inline">{isSaved ? 'Saved in Aspirant Zone' : 'Bookmark Job'}</span>
            </button>
          </div>
        </div>

        {/* Share Success / Copied Toast Feedback */}
        {shareSuccess && (
          <div className="mb-3 px-4 py-2 bg-[#85f8c4] text-[#002114] text-xs font-black rounded-xl flex items-center justify-between shadow-xs animate-fade-in">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {shareSuccess}
            </span>
            <button onClick={() => setShareSuccess(null)} className="text-[#002114]/80 hover:text-[#002114]">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#00236f] tracking-tight leading-snug">
          {job.title}
        </h1>
        <p className="text-sm font-semibold text-[#444651] mt-2">
          {job.department} {job.ministry ? `• ${job.ministry}` : ''}
        </p>

        {/* Top 6 Key Specifications Matrix */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-[#eff4ff] p-4 rounded-xl text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#757682] block">Total Openings</span>
            <span className="font-extrabold text-[#00236f] text-base">{job.vacanciesFormatted} Posts</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#757682] block">Pay Scale</span>
            <span className="font-bold text-[#0b1c30]">{job.payLevel}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#757682] block">Job Location</span>
            <span className="font-bold text-[#0b1c30]">{job.jobLocation}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#757682] block">Apply Mode</span>
            <span className="font-bold text-[#003120]">{job.applyMode}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#757682] block">Last Date</span>
            <span className="font-extrabold text-[#ba1a1a]">{job.lastDate.split('(')[0]}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#757682] block">Selection Process</span>
            <span className="font-bold text-[#0b1c30]">{job.selectionProcess}</span>
          </div>
        </div>
      </div>

      {/* 3. Sticky Quick Navigation Bar */}
      <div className="sticky top-28 z-40 bg-[#eff4ff]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#d3e4fe] shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {navSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === sec.id
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-[#444651] hover:bg-white hover:text-[#00236f]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{sec.icon}</span>
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Content: 7 Detailed Sections + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Main In-Depth Guide Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Important Dates Schedule */}
          <div id="dates" className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs scroll-mt-36">
            <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              1. Important Dates Schedule
            </h2>
            <div className="overflow-hidden rounded-xl border border-[#eff4ff]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#eff4ff] text-[#00236f] font-bold">
                  <tr>
                    <th className="p-3">Recruitment Milestone</th>
                    <th className="p-3 text-right">Official Schedule Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff4ff]">
                  {job.importantDates.map((item, idx) => (
                    <tr key={idx} className={item.isCrucial ? 'bg-[#ffdad6]/20 font-bold' : ''}>
                      <td className="p-3 text-[#0b1c30] flex items-center gap-2">
                        {item.isCrucial && (
                          <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-ping"></span>
                        )}
                        {item.milestone}
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#00236f]">
                        {item.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Application Fee & Payment Gateway */}
          <div id="fee" className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs scroll-mt-36">
            <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[22px]">payments</span>
              2. Application Fee & Payment Mode
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#eff4ff] rounded-xl border border-[#d3e4fe]">
                <span className="text-[11px] font-bold text-[#757682] uppercase block">General / OBC / EWS</span>
                <span className="font-display font-black text-2xl text-[#00236f] block mt-1">{job.feeGeneral}</span>
                <span className="text-[11px] text-[#444651]">Non-refundable processing fee</span>
              </div>
              <div className="p-4 bg-[#85f8c4]/20 rounded-xl border border-[#85f8c4]">
                <span className="text-[11px] font-bold text-[#003120] uppercase block">SC / ST / PwD / Female</span>
                <span className="font-display font-black text-2xl text-[#004a32] block mt-1">{job.feeReserved}</span>
                <span className="text-[11px] text-[#003120]">Exempted from fee payment</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-[#eff4ff]/60 rounded-xl text-xs text-[#444651] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00236f] text-[18px]">account_balance_wallet</span>
              <span><strong>Accepted Modes:</strong> {job.acceptedPaymentModes}</span>
            </div>
          </div>

          {/* Section 3: Age Limit & Category Relaxation */}
          <div id="age" className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs scroll-mt-36">
            <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[22px]">cake</span>
              3. Age Limit & Crucial Date (as on {job.crucialAgeDate})
            </h2>
            <div className="p-4 bg-[#ffdcc3]/40 rounded-xl border border-[#ffb77d] mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2f1500]">Standard Age Bracket:</span>
                <span className="font-extrabold text-[#904d00] text-sm">{job.ageLimit}</span>
              </div>
              <p className="text-[11px] text-[#6e3900] mt-1">
                Candidate must have been born not earlier than 02-08-1995 and not later than 01-08-2007 for 18-30 years posts.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#eff4ff]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#eff4ff] text-[#00236f] font-bold">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Age Relaxation Permissible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff4ff] text-[#0b1c30]">
                  <tr><td className="p-2.5">SC / ST Candidates</td><td className="p-2.5 text-right font-bold text-[#004a32]">+ 5 Years</td></tr>
                  <tr><td className="p-2.5">OBC (Non-Creamy Layer)</td><td className="p-2.5 text-right font-bold text-[#004a32]">+ 3 Years</td></tr>
                  <tr><td className="p-2.5">PwBD (Unreserved)</td><td className="p-2.5 text-right font-bold text-[#004a32]">+ 10 Years</td></tr>
                  <tr><td className="p-2.5">Ex-Servicemen (ESM)</td><td className="p-2.5 text-right font-bold text-[#004a32]">3 Years after deduction of service</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Post-Wise Vacancies & Eligibility */}
          <div id="vacancies" className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs scroll-mt-36">
            <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[22px]">view_list</span>
              4. Post-Wise Vacancies & Cadre Eligibility
            </h2>
            <div className="overflow-x-auto rounded-xl border border-[#eff4ff]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#eff4ff] text-[#00236f] font-bold">
                  <tr>
                    <th className="p-3">Post Name</th>
                    <th className="p-3">Code / Dept</th>
                    <th className="p-3">Pay Level</th>
                    <th className="p-3">Age</th>
                    <th className="p-3">Minimum Educational Qualification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff4ff] text-[#0b1c30]">
                  {job.postWiseVacancies.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#eff4ff]/40">
                      <td className="p-3 font-bold text-[#00236f]">{p.postName}</td>
                      <td className="p-3"><span className="bg-[#eff4ff] px-1.5 py-0.5 rounded font-mono font-bold">{p.postCode}</span> {p.department}</td>
                      <td className="p-3 font-semibold">{p.payLevel}</td>
                      <td className="p-3 font-semibold">{p.ageLimit}</td>
                      <td className="p-3">{p.qualification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Selection Process & Tier-I CBT Exam Pattern */}
          <div id="pattern" className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs scroll-mt-36">
            <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[22px]">analytics</span>
              5. Selection Stages & Tier-I Exam Pattern (100 MCQs, 200 Marks)
            </h2>
            <div className="overflow-hidden rounded-xl border border-[#eff4ff] mb-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#00236f] text-white font-bold">
                  <tr>
                    <th className="p-3">Section / Subject</th>
                    <th className="p-3 text-center">Questions</th>
                    <th className="p-3 text-center">Max Marks</th>
                    <th className="p-3 text-right">Negative Marking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff4ff] text-[#0b1c30]">
                  {job.examPatternTier1.map((sec, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold">{sec.section}</td>
                      <td className="p-3 text-center font-bold text-[#00236f]">{sec.questions}</td>
                      <td className="p-3 text-center font-bold text-[#00236f]">{sec.marks}</td>
                      <td className="p-3 text-right font-medium text-[#ba1a1a]">{sec.negativeMarking}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-[#eff4ff] rounded-xl text-xs text-[#444651]">
              <strong>Total Duration:</strong> 60 Minutes (80 Minutes for candidates eligible for scribes). Exam is objective type multi-choice.
            </div>
          </div>

          {/* Section 6: Step-by-Step Application Guide */}
          <div id="how-to-apply" className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs scroll-mt-36">
            <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[22px]">checklist</span>
              6. How to Apply Step-by-Step on Official Portal
            </h2>
            <div className="space-y-3 text-xs text-[#0b1c30]">
              <div className="flex items-start gap-3 p-3 bg-[#eff4ff] rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#00236f] text-white font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-[#00236f] block">One Time Registration (OTR):</strong>
                  Visit the official portal <span className="underline font-mono">ssc.gov.in</span> and generate your new OTR with Aadhaar, email, and mobile number.
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#eff4ff] rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#00236f] text-white font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-[#00236f] block">Live Photo & Signature Upload:</strong>
                  Capture real-time live webcam photograph without cap, mask, or spectacles. Upload signature JPEG (10 to 20 KB).
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#eff4ff] rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#00236f] text-white font-black flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-[#00236f] block">Fill Academic Details & Exam Centers:</strong>
                  Enter 10th, 12th & Graduation marks. Select 3 preferred examination cities in your regional zone.
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#eff4ff] rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#00236f] text-white font-black flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <strong className="text-[#00236f] block">Fee Payment & Final Printout:</strong>
                  Pay ₹100 via UPI/Net Banking and download the generated PDF acknowledgment for future reference.
                </div>
              </div>
            </div>
          </div>

          {/* Section 7: Direct Official Links & Downloads */}
          <div id="direct-links" className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs scroll-mt-36">
            <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[22px]">link</span>
              7. Direct Official Links & Downloads
            </h2>
            <div className="space-y-3">
              {job.directLinks.map((link, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#eff4ff] hover:bg-[#dce9ff] rounded-xl border border-[#d3e4fe] transition-all"
                >
                  <div>
                    <h4 className="font-bold text-xs md:text-sm text-[#00236f]">{link.title}</h4>
                    <p className="text-[11px] text-[#444651] mt-0.5">{link.subtitle}</p>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>{link.buttonText}</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Interactive Countdown, Calculator & Alert Box */}
        <div className="space-y-6">
          {/* Real-time Ticking Countdown Widget */}
          <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#85f8c4] text-[20px]">timer</span>
              <h3 className="font-display font-bold text-sm text-white">Application Deadline</h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center my-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-xs">
                <span className="font-black text-xl text-white block">{timeLeft.days}</span>
                <span className="text-[10px] text-white/70 uppercase">Days</span>
              </div>
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-xs">
                <span className="font-black text-xl text-white block">{timeLeft.hours}</span>
                <span className="text-[10px] text-white/70 uppercase">Hours</span>
              </div>
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-xs">
                <span className="font-black text-xl text-white block">{timeLeft.minutes}</span>
                <span className="text-[10px] text-white/70 uppercase">Mins</span>
              </div>
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-xs">
                <span className="font-black text-xl text-[#85f8c4] block">{timeLeft.seconds}</span>
                <span className="text-[10px] text-white/70 uppercase">Secs</span>
              </div>
            </div>
            <a
              href="https://ssc.gov.in"
              target="_blank"
              rel="noreferrer"
              className="mt-3 w-full bg-[#fe932c] hover:bg-[#fe932c]/90 text-[#2f1500] text-xs font-black py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              Apply Online Now (OTR) <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
          </div>

          {/* Instant Age Eligibility Calculator Widget */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#00236f] text-[20px]">calculate</span>
              <h3 className="font-display font-bold text-sm text-[#00236f]">Instant Age Calculator</h3>
            </div>
            <p className="text-[11px] text-[#444651] mb-3">Calculate age as on crucial cutoff: <strong>01-08-2025</strong></p>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-[#757682] uppercase block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-[#eff4ff] text-xs text-[#0b1c30] p-2 rounded-lg font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#757682] uppercase block mb-1">Your Category</label>
                <select
                  value={userCategory}
                  onChange={(e) => setUserCategory(e.target.value as any)}
                  className="w-full bg-[#eff4ff] text-xs text-[#0b1c30] p-2 rounded-lg font-bold focus:outline-none cursor-pointer"
                >
                  <option value="UR">Unreserved / General</option>
                  <option value="OBC">OBC (3 Yrs Relaxation)</option>
                  <option value="SC">SC / ST (5 Yrs Relaxation)</option>
                  <option value="PwD">PwBD (10 Yrs Relaxation)</option>
                </select>
              </div>

              <button
                onClick={handleCalculateAge}
                className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold py-2 rounded-lg transition-colors"
              >
                Check Eligibility Status
              </button>

              {calculatedAge && (
                <div className="p-2.5 bg-[#eff4ff] rounded-lg border border-[#d3e4fe] text-xs font-bold text-[#00236f] text-center">
                  {calculatedAge}
                </div>
              )}
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs">
            <h3 className="font-display font-bold text-sm text-[#00236f] flex items-center gap-1.5 mb-3">
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              Frequently Asked Questions
            </h3>
            <div className="space-y-2.5 text-xs">
              {job.faqs.map((faq, idx) => (
                <details key={idx} className="bg-[#eff4ff] p-2.5 rounded-xl group cursor-pointer">
                  <summary className="font-bold text-[#00236f] list-none flex items-center justify-between">
                    <span>{faq.question}</span>
                    <span className="material-symbols-outlined text-[16px] group-open:rotate-180 transition-transform">
                      expand_more
                    </span>
                  </summary>
                  <p className="text-[11px] text-[#444651] mt-2 pt-2 border-t border-[#d3e4fe]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Share with Aspirants & Study Groups Card */}
          <div className="bg-gradient-to-br from-[#eff4ff] to-[#dce9ff] rounded-2xl border border-[#b9d5ff] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#00236f] text-[20px]">share</span>
              <h3 className="font-display font-bold text-sm text-[#00236f]">Share with Study Groups</h3>
            </div>
            <p className="text-[11px] text-[#444651] mb-3">
              Help your fellow candidates by sharing verified notification details directly to WhatsApp or Telegram groups.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleNativeShare}
                className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Share via Web Share / All Apps</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleTelegramShare}
                  className="bg-[#229ED9] hover:bg-[#1e8ec3] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Telegram</span>
                </button>
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full bg-white hover:bg-[#f1f5f9] text-[#00236f] border border-[#d3e4fe] text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copy Recruitment Link</span>
              </button>

              <a
                href="https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#075E54] hover:bg-[#054c44] text-white text-xs font-black py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
                <span>Join Official WhatsApp Channel</span>
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Mobile Floating Action Bar with Instant Share */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-[#d3e4fe] px-4 py-2.5 shadow-lg flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="p-2 text-[#444651] hover:text-[#00236f] hover:bg-[#eff4ff] rounded-xl flex flex-col items-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="text-[9px] font-bold">Back</span>
        </button>

        <button
          onClick={handleNativeShare}
          className="flex-1 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00236f] text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-[#d3e4fe] cursor-pointer active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          <span>Share Job</span>
        </button>

        <button
          onClick={handleWhatsAppShare}
          className="bg-[#25D366] text-white p-2.5 rounded-xl flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
          title="Share to WhatsApp"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
        </button>

        <a
          href="https://ssc.gov.in"
          target="_blank"
          rel="noreferrer"
          className="flex-1 bg-[#fe932c] hover:bg-[#fe932c]/90 text-[#2f1500] text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-sm text-center"
        >
          <span>Apply Now</span>
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </a>
      </div>

      {/* 6. Share Modal Dialog (Fallback & Options) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#d3e4fe] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#00236f]">
                <span className="material-symbols-outlined text-[24px]">share</span>
                <h3 className="font-display font-black text-lg text-[#00236f]">Share Recruitment</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-[#757682] hover:bg-[#eff4ff] hover:text-[#0b1c30] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#d3e4fe]">
              <h4 className="font-bold text-xs text-[#00236f] line-clamp-2">{job.title}</h4>
              <p className="text-[11px] text-[#444651] mt-1">
                {job.department} • {job.vacanciesFormatted} Posts • Last Date: {job.lastDate.split('(')[0]}
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-[#757682] uppercase block">Share Directly Via</label>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    handleWhatsAppShare();
                    setShowShareModal(false);
                  }}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    handleTelegramShare();
                    setShowShareModal(false);
                  }}
                  className="bg-[#229ED9] hover:bg-[#1e8ec3] text-white text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Telegram</span>
                </button>
              </div>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    handleNativeShare();
                  }}
                  className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">phonelink_ring</span>
                  <span>Use System Share Menu</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-[#eff4ff]">
              <label className="text-[10px] font-bold text-[#757682] uppercase block mb-1">Direct Job URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="flex-1 bg-[#eff4ff] text-[11px] text-[#0b1c30] font-mono p-2.5 rounded-xl border border-[#d3e4fe] select-all focus:outline-none"
                />
                <button
                  onClick={() => {
                    handleCopyLink();
                    setShowShareModal(false);
                  }}
                  className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
