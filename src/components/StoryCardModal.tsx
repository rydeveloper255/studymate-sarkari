import React, { useState } from 'react';
import { JobItem } from '../types';
import { sarkariPipelineService } from '../services/sarkariPipelineService';

interface StoryCardModalProps {
  job: JobItem;
  isOpen: boolean;
  onClose: () => void;
}

export const StoryCardModal: React.FC<StoryCardModalProps> = ({ job, isOpen, onClose }) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const svgDataUrl = sarkariPipelineService.generateStoryCardSvg({
    title: job.shortTitle || job.title,
    department: job.department,
    vacancies: job.vacanciesFormatted,
    qualification: job.qualificationSummary || job.qualificationLevel,
    lastDate: job.lastDate.split('(')[0].trim(),
    payScale: job.payLevel,
    category: job.category,
  });

  const storyCaption = `🚨 *NEW GOVT JOB NOTIFICATION 2026* 🇮🇳
📌 *${job.title}*

🏛️ *Dept:* ${job.department}
🎯 *Total Vacancies:* ${job.vacanciesFormatted} Posts
🎓 *Qualification:* ${job.qualificationSummary || job.qualificationLevel}
💰 *Pay Scale:* ${job.payLevel}
⏳ *Last Date to Apply:* ${job.lastDate.split('(')[0].trim()}

🔗 *Direct Apply Online & PDF Link:*
👉 ${window.location.origin}#job-detail?id=${job.id}&utm_source=whatsapp_story

📲 *Join 48,000+ Aspirants on Official Telegram:*
👉 https://t.me/Sarkariupdatealerts

💬 *Follow WhatsApp Channel for 24x7 Sarkari Alerts:*
👉 https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(storyCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadImage = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = svgDataUrl;
    link.download = `${job.id}-whatsapp-story-9-16.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative bg-[#0b1c30] border border-white/20 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#85f8c4] animate-pulse"></span>
            <span className="font-display font-black text-sm uppercase tracking-wider text-white">
              WhatsApp Status &amp; Insta Story Card (9:16)
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 flex flex-col items-center">
          <p className="text-xs text-white/70 text-center max-w-sm">
            High-contrast 9:16 vertical poster optimized for full-screen WhatsApp Status and Instagram Reels/Stories.
          </p>

          {/* 9:16 Preview Frame */}
          <div className="w-[240px] sm:w-[270px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#85f8c4]/40 relative group bg-black">
            <img
              src={svgDataUrl}
              alt="WhatsApp Story Card Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="bg-black/75 text-[#85f8c4] font-black text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-[#85f8c4]/30">
                1080 × 1920 HD Ready
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2 pt-2">
            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="w-full bg-[#85f8c4] hover:bg-[#85f8c4]/90 text-[#002114] font-black text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{downloading ? 'Preparing Image...' : 'Download 9:16 Status Image (HD)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyCaption}
                className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedCaption ? 'check_circle' : 'content_copy'}
                </span>
                <span>{copiedCaption ? 'Caption Copied! ✅' : 'Copy Story Caption'}</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(storyCaption)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span>Share to WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-black/40 border-t border-white/10 text-[11px] text-center text-white/60">
          Tip: Post on WhatsApp Status to alert friends and study group aspirants in 1 tap.
        </div>
      </div>
    </div>
  );
};
