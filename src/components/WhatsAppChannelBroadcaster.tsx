import React, { useState } from 'react';
import { JobItem, AdmitCardItem, ResultItem, AnswerKeyItem } from '../types';

export interface WhatsAppChannelBroadcasterProps {
  jobs: JobItem[];
  admitCards: AdmitCardItem[];
  results: ResultItem[];
  answerKeys: AnswerKeyItem[];
  onNavigate?: (tab: string, jobId?: string) => void;
}

export const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z';

export const WhatsAppChannelBroadcaster: React.FC<WhatsAppChannelBroadcasterProps> = ({
  jobs,
  admitCards,
  results,
  answerKeys,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY'>('JOB');
  const [selectedItemId, setSelectedItemId] = useState<string>(jobs[0]?.id || 'ssc-cgl-2025');
  const [customExtraNote, setCustomExtraNote] = useState<string>('🚨 Apply before the server slows down! Share with friends.');
  const [copied, setCopied] = useState(false);
  const [broadcastLog, setBroadcastLog] = useState<Array<{ id: string; time: string; title: string; category: string }>>([
    {
      id: 'log-1',
      time: 'Just now',
      title: 'SSC CGL 2025 (17,727 Posts) Apply Online Active',
      category: 'JOB',
    },
    {
      id: 'log-2',
      time: '1 hour ago',
      title: 'Railway RRB NTPC (11,558 Posts) Notification Out',
      category: 'JOB',
    },
    {
      id: 'log-3',
      time: '3 hours ago',
      title: 'UPSC CSE 2025 Prelims Hall Ticket Released',
      category: 'ADMIT_CARD',
    },
  ]);

  // Base Website URL for deep links
  const getWebsiteBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return 'https://studymatesarkari.in/';
  };

  // Generate WhatsApp Message Content
  const generateMessage = () => {
    const baseUrl = getWebsiteBaseUrl();

    if (selectedCategory === 'JOB') {
      const item = jobs.find((j) => j.id === selectedItemId) || jobs[0];
      if (!item) return '';

      const lastDate = item.lastDate ? item.lastDate.split('(')[0].trim() : 'Refer Notification';
      const webLink = `${baseUrl}#job-detail?id=${item.id}`;

      return `📢 *NEW GOVT JOB RECRUITMENT 2025-26* 🇮🇳
━━━━━━━━━━━━━━━━━━━━━
📌 *${item.title.toUpperCase()}*

🏛️ *Department:* ${item.department}
🎯 *Total Vacancies:* ${item.vacanciesFormatted} Posts
🎓 *Qualification:* ${item.eligibility}
💰 *Pay Scale:* ${item.payLevel}
📅 *Application Last Date:* ${lastDate}
⚡ *Category:* ${item.category} • ${item.stateOrCenter}

${customExtraNote ? `💡 *Alert:* ${customExtraNote}\n` : ''}
🔗 *Detailed Notification & Direct Apply Link:*
👇👇👇
${webLink}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel for Instant Sarkari Alerts:*
👉 ${WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — 100% Free & Verified Updates`;
    }

    if (selectedCategory === 'ADMIT_CARD') {
      const item = admitCards.find((a) => a.id === selectedItemId) || admitCards[0];
      if (!item) return '';

      const webLink = `${baseUrl}#admit-card`;

      return `🎫 *ADMIT CARD / HALL TICKET OUT* 🚨
━━━━━━━━━━━━━━━━━━━━━
📌 *${item.title.toUpperCase()}*

🏛️ *Exam Conducting Body:* ${item.examBody}
🗓️ *Exam Date:* ${item.examDate}
📥 *Status:* ${item.status || 'Active Server 1 & 2'}
⚡ *Total Posts:* ${item.totalPosts || 'Refer Notice'}

${customExtraNote ? `💡 *Note:* ${customExtraNote}\n` : ''}
🔗 *Download Hall Ticket from Direct Server:*
👇👇👇
${webLink}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel:*
👉 ${WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — Verified Exam Intelligence`;
    }

    if (selectedCategory === 'RESULT') {
      const item = results.find((r) => r.id === selectedItemId) || results[0];
      if (!item) return '';

      const webLink = `${baseUrl}#results`;

      return `🏆 *EXAM RESULT & MERIT LIST DECLARED* 📢
━━━━━━━━━━━━━━━━━━━━━
📌 *${item.title.toUpperCase()}*

🏛️ *Commission:* ${item.examBody}
📅 *Result Date:* ${item.resultDate}
📊 *Cutoff Status:* ${item.cutoffAvailable ? 'Cutoff Marks & PDF Released' : 'Merit List Active'}

${customExtraNote ? `💡 *Update:* ${customExtraNote}\n` : ''}
🔗 *Check Result, Scorecard & Cutoff PDF:*
👇👇👇
${webLink}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel:*
👉 ${WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — Fastest Sarkari Results`;
    }

    if (selectedCategory === 'ANSWER_KEY') {
      const item = answerKeys.find((k) => k.id === selectedItemId) || answerKeys[0];
      if (!item) return '';

      const webLink = `${baseUrl}#answer-key`;

      return `📝 *OFFICIAL ANSWER KEY & OBJECTION LINK* 🔑
━━━━━━━━━━━━━━━━━━━━━
📌 *${item.title.toUpperCase()}*

🏛️ *Exam Authority:* ${item.examBody}
📅 *Release Date:* ${item.releaseDate}
⏳ *Objection Deadline:* ${item.objectionLastDate || 'Active Now'}

${customExtraNote ? `💡 *Alert:* ${customExtraNote}\n` : ''}
🔗 *Download Response Sheet & Answer Key:*
👇👇👇
${webLink}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel:*
👉 ${WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — Accurate Solutions & Keys`;
    }

    return '';
  };

  const messageText = generateMessage();

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsAppSend = () => {
    // Adds to log
    let title = 'Recruitment Update';
    if (selectedCategory === 'JOB') {
      title = jobs.find((j) => j.id === selectedItemId)?.title || 'Job Alert';
    } else if (selectedCategory === 'ADMIT_CARD') {
      title = admitCards.find((a) => a.id === selectedItemId)?.title || 'Admit Card Alert';
    } else if (selectedCategory === 'RESULT') {
      title = results.find((r) => r.id === selectedItemId)?.title || 'Result Alert';
    } else if (selectedCategory === 'ANSWER_KEY') {
      title = answerKeys.find((k) => k.id === selectedItemId)?.title || 'Answer Key Alert';
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBroadcastLog((prev) => [
      { id: `log-${Date.now()}`, time: timeStr, title, category: selectedCategory },
      ...prev.slice(0, 10),
    ]);

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const pythonBroadcasterCode = `# ==============================================================================
# 🤖 StudyMate Sarkari - Automated WhatsApp Channel Broadcaster Bot
# WhatsApp Channel: https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z
# ==============================================================================

import os
import time
import requests
import json

WHATSAPP_CHANNEL_LINK = "${WHATSAPP_CHANNEL_URL}"
WEBSITE_DOMAIN = "${getWebsiteBaseUrl()}"

# Option 1: WhatsApp Cloud API / Green-API / UltraMsg Instance
GREEN_API_INSTANCE_ID = os.getenv("GREEN_API_INSTANCE_ID", "")
GREEN_API_API_TOKEN = os.getenv("GREEN_API_API_TOKEN", "")
WHATSAPP_CHANNEL_ID = os.getenv("WHATSAPP_CHANNEL_ID", "0029Vb8ycrRKbYMIlkbOGy1z@newsletter")

def format_job_broadcast(job):
    """Formats an attractive, emoji-rich broadcast with the exact website deep link."""
    job_id = job.get("id", "ssc-cgl-2025")
    title = job.get("title", "").upper()
    dept = job.get("department", "Govt of India")
    vacancies = job.get("vacanciesFormatted", "Multiple")
    qualification = job.get("eligibility", "Graduate / 10th / 12th")
    pay = job.get("payLevel", "Level 4 to 8")
    last_date = job.get("lastDate", "Refer Website").split("(")[0].strip()
    
    deep_link = f"{WEBSITE_DOMAIN}#job-detail?id={job_id}"

    message = f"""📢 *NEW GOVT JOB RECRUITMENT 2025-26* 🇮🇳
━━━━━━━━━━━━━━━━━━━━━
📌 *{title}*

🏛️ *Department:* {dept}
🎯 *Total Vacancies:* {vacancies} Posts
🎓 *Qualification:* {qualification}
💰 *Pay Scale:* {pay}
📅 *Application Last Date:* {last_date}

🔗 *Detailed Notification & Direct Apply Online Link:*
👇👇👇
{deep_link}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel for Instant Sarkari Alerts:*
👉 {WHATSAPP_CHANNEL_LINK}
🔔 *StudyMate Sarkari* — 100% Free & Verified Updates"""
    return message


def post_to_whatsapp_channel(message_text):
    """Dispatches formatted message directly to your WhatsApp Channel."""
    if not GREEN_API_INSTANCE_ID or not GREEN_API_API_TOKEN:
        print("[!] Green-API credentials not found. Printing message to stdout for manual post:")
        print(message_text)
        return False

    url = f"https://api.green-api.com/waInstance{GREEN_API_INSTANCE_ID}/sendMessage/{GREEN_API_API_TOKEN}"
    payload = {
        "chatId": WHATSAPP_CHANNEL_ID,
        "message": message_text
    }
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            print("✅ Successfully broadcasted to WhatsApp Channel!")
            return True
        else:
            print(f"❌ WhatsApp broadcast failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error sending WhatsApp broadcast: {e}")
        return False

if __name__ == "__main__":
    sample_job = {
        "id": "ssc-cgl-2025",
        "title": "SSC CGL 2025 Recruitment (17,727 Posts)",
        "department": "Staff Selection Commission (Govt of India)",
        "vacanciesFormatted": "17,727",
        "eligibility": "Bachelor's Degree in any discipline",
        "payLevel": "Pay Level 4 to Level 8 (₹25,500 - ₹1,51,100)",
        "lastDate": "24 July 2025"
    }
    msg = format_job_broadcast(sample_job)
    print("Formatted WhatsApp Channel Message:\\n")
    print(msg)
    post_to_whatsapp_channel(msg)
`;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                Official Channel Auto-Broadcaster
              </span>
              <span className="text-white/90 text-xs font-semibold">Real-Time Instant Alerts</span>
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white">
              WhatsApp Channel Automation &amp; Live Broadcaster
            </h2>
            <p className="text-white/90 text-xs md:text-sm mt-1 max-w-2xl">
              Automatic generation of styled WhatsApp updates for every new Job Vacancy, Result, Admit Card, and Answer Key with direct website deep links.
            </p>
          </div>

          <a
            href={WHATSAPP_CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-white text-[#075E54] hover:bg-emerald-50 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#25D366]">chat</span>
            <span>Open WhatsApp Channel</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
      </div>

      {/* 2. Main Grid: Controls + Live WhatsApp Phone Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Item Picker */}
        <div className="lg:col-span-6 space-y-4 bg-white dark:bg-[#101b2c] p-5 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
            <h3 className="font-display font-bold text-sm text-[#00236f] dark:text-[#93c5fd] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Select Post to Broadcast
            </h3>
            <span className="text-[11px] text-[#757682] dark:text-[#94a3b8] font-bold">Step 1 of 2</span>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#eff4ff] dark:bg-[#070e1e] rounded-xl">
            {[
              { id: 'JOB', label: 'Jobs', icon: 'work' },
              { id: 'ADMIT_CARD', label: 'Admit Card', icon: 'badge' },
              { id: 'RESULT', label: 'Results', icon: 'emoji_events' },
              { id: 'ANSWER_KEY', label: 'Answer Key', icon: 'assignment_turned_in' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as any);
                  if (cat.id === 'JOB') setSelectedItemId(jobs[0]?.id || '');
                  if (cat.id === 'ADMIT_CARD') setSelectedItemId(admitCards[0]?.id || '');
                  if (cat.id === 'RESULT') setSelectedItemId(results[0]?.id || '');
                  if (cat.id === 'ANSWER_KEY') setSelectedItemId(answerKeys[0]?.id || '');
                }}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#075E54] text-white shadow-xs'
                    : 'text-[#444651] dark:text-[#cbd5e1] hover:bg-white/60 dark:hover:bg-[#1e293b]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                <span className="text-[11px]">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Item Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0b1c30] dark:text-white flex items-center justify-between">
              <span>Choose {selectedCategory} Title</span>
              <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">Auto-formats with website deep link</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl p-2.5 text-xs text-[#0b1c30] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            >
              {selectedCategory === 'JOB' &&
                jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.vacanciesFormatted} Posts)
                  </option>
                ))}
              {selectedCategory === 'ADMIT_CARD' &&
                admitCards.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.examDate})
                  </option>
                ))}
              {selectedCategory === 'RESULT' &&
                results.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.resultDate})
                  </option>
                ))}
              {selectedCategory === 'ANSWER_KEY' &&
                answerKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.title} ({k.releaseDate})
                  </option>
                ))}
            </select>
          </div>

          {/* Custom Note / Urgency Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0b1c30] dark:text-white">
              Custom Alert Message / Deadline Warning
            </label>
            <input
              type="text"
              value={customExtraNote}
              onChange={(e) => setCustomExtraNote(e.target.value)}
              placeholder="e.g. 🚨 Last date closing tomorrow! Apply fast."
              className="w-full bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl p-2.5 text-xs text-[#0b1c30] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleOpenWhatsAppSend}
              className="w-full sm:flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-[#002114] text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              <span>1-Click Broadcast to Channel</span>
            </button>
            <button
              onClick={handleCopyMessage}
              className="w-full sm:w-auto bg-[#eff4ff] dark:bg-[#070e1e] hover:bg-[#dce9ff] dark:hover:bg-[#1e293b] text-[#00236f] dark:text-[#93c5fd] border border-[#d3e4fe] dark:border-[#1e324c] text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Broadcast History Log */}
          <div className="pt-4 border-t border-[#eff4ff] dark:border-[#1e324c]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase">
                Recent WhatsApp Dispatches
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {broadcastLog.map((log) => (
                <div
                  key={log.id}
                  className="p-2 bg-[#eff4ff] dark:bg-[#070e1e] rounded-lg text-[11px] flex items-center justify-between border border-[#d3e4fe]/50 dark:border-[#1e324c]"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="material-symbols-outlined text-emerald-600 text-[14px]">check_circle</span>
                    <span className="font-bold text-[#00236f] dark:text-[#93c5fd] truncate">{log.title}</span>
                  </div>
                  <span className="text-[10px] text-[#757682] dark:text-[#94a3b8] shrink-0 ml-2">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Authentic WhatsApp Message Preview UI */}
        <div className="lg:col-span-6 bg-[#E5DDD5] dark:bg-[#0b141a] p-4 sm:p-6 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-md flex flex-col justify-between">
          <div>
            {/* WhatsApp Chat Header Bar */}
            <div className="bg-[#075E54] text-white p-3 rounded-t-xl flex items-center justify-between shadow-xs mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white text-[#075E54] flex items-center justify-center font-black text-xs shadow-inner">
                  📢
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-none flex items-center gap-1">
                    StudyMate Sarkari Official 🇮🇳
                    <span className="material-symbols-outlined text-[14px] text-emerald-300">verified</span>
                  </h4>
                  <span className="text-[9px] text-emerald-100">WhatsApp Channel &bull; 2.5L+ Followers</span>
                </div>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">LIVE PREVIEW</span>
            </div>

            {/* WhatsApp Speech Bubble */}
            <div className="relative bg-[#ffffff] dark:bg-[#1f2c34] rounded-2xl p-4 shadow-md text-xs text-[#111b21] dark:text-[#e9edef] font-sans border border-slate-200 dark:border-slate-800">
              <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                {messageText}
              </div>

              {/* Timestamp & double tick */}
              <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-400">
                <span>12:45 PM</span>
                <span className="material-symbols-outlined text-[14px] text-emerald-500">done_all</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-300 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#25D366]">verified</span>
              Direct website link included automatically
            </span>
            <button
              onClick={handleCopyMessage}
              className="text-[#075E54] dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Automation Bot Python Script & Instructions for Render.com */}
      <div className="bg-white dark:bg-[#101b2c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#00236f] text-white text-[10px] font-black px-2 py-0.5 rounded">
                BOT ENGINE CODE
              </span>
              <span className="font-display font-black text-base text-[#00236f] dark:text-white">
                Python Scraper &amp; WhatsApp Channel Broadcaster Script
              </span>
            </div>
            <p className="text-xs text-[#444651] dark:text-[#94a3b8] mt-0.5">
              Include this script in your Render.com / GitHub Actions auto-crawler. It automatically posts to your WhatsApp Channel whenever a new recruitment is scraped.
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(pythonBroadcasterCode);
              alert('WhatsApp Broadcaster Python Code Copied to Clipboard!');
            }}
            className="px-3 py-1.5 bg-[#00236f] text-white text-xs font-bold rounded-lg hover:bg-[#1e3a8a] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>Copy Python Script</span>
          </button>
        </div>

        <pre className="bg-[#0b1424] text-[#85f8c4] p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80 scrollbar-thin border border-[#1e324c]">
          <code>{pythonBroadcasterCode}</code>
        </pre>
      </div>
    </div>
  );
};
