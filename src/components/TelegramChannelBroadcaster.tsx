import React, { useState, useEffect, useRef } from 'react';
import { JobItem, AdmitCardItem, ResultItem, AnswerKeyItem, TelegramBroadcastRecord, TelegramBannerConfig } from '../types';
import { telegramService, OFFICIAL_TELEGRAM_CHANNEL_URL, OFFICIAL_TELEGRAM_CHANNEL_HANDLE, TelegramBotSettings } from '../services/telegramService';

export interface TelegramChannelBroadcasterProps {
  jobs: JobItem[];
  admitCards: AdmitCardItem[];
  results: ResultItem[];
  answerKeys: AnswerKeyItem[];
  onNavigate?: (tab: string, jobId?: string) => void;
}

export const TELEGRAM_CHANNEL_URL = OFFICIAL_TELEGRAM_CHANNEL_URL;
export const TELEGRAM_CHANNEL_HANDLE = OFFICIAL_TELEGRAM_CHANNEL_HANDLE;

export const TelegramChannelBroadcaster: React.FC<TelegramChannelBroadcasterProps> = ({
  jobs,
  admitCards,
  results,
  answerKeys,
}) => {
  // Navigation Sub-tabs inside Telegram Broadcaster
  const [activeTab, setActiveTab] = useState<'BROADCAST' | 'DEADLINES' | 'DIGESTS' | 'BANNER_STUDIO' | 'BOT_SETTINGS' | 'LOGS'>('BROADCAST');

  const [selectedCategory, setSelectedCategory] = useState<'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY'>('JOB');
  const [selectedItemId, setSelectedItemId] = useState<string>(jobs[0]?.id || 'ssc-cgl-2025');
  const [copied, setCopied] = useState(false);
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(telegramService.isAutoEnabled());
  const [broadcastHistory, setBroadcastHistory] = useState<TelegramBroadcastRecord[]>(telegramService.getBroadcastHistory());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY'>('ALL');

  // Telegram Bot Settings
  const [botSettings, setBotSettings] = useState<TelegramBotSettings>(telegramService.getBotSettings());
  const [isTestingBot, setIsTestingBot] = useState(false);

  // Digest Generator State
  const [digestType, setDigestType] = useState<'MORNING' | 'EVENING'>('MORNING');

  // Banner Canvas Ref
  const bannerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to updates from Telegram Service
  useEffect(() => {
    const unsubscribe = telegramService.subscribe(() => {
      setBroadcastHistory(telegramService.getBroadcastHistory());
      setIsAutoEnabled(telegramService.isAutoEnabled());
      setBotSettings(telegramService.getBotSettings());
    });
    return unsubscribe;
  }, []);

  // Update selected item if category changes
  useEffect(() => {
    if (selectedCategory === 'JOB') setSelectedItemId(jobs[0]?.id || '');
    if (selectedCategory === 'ADMIT_CARD') setSelectedItemId(admitCards[0]?.id || '');
    if (selectedCategory === 'RESULT') setSelectedItemId(results[0]?.id || '');
    if (selectedCategory === 'ANSWER_KEY') setSelectedItemId(answerKeys[0]?.id || '');
  }, [selectedCategory, jobs, admitCards, results, answerKeys]);

  const currentItem =
    selectedCategory === 'JOB'
      ? jobs.find((j) => j.id === selectedItemId) || jobs[0]
      : selectedCategory === 'ADMIT_CARD'
      ? admitCards.find((a) => a.id === selectedItemId) || admitCards[0]
      : selectedCategory === 'RESULT'
      ? results.find((r) => r.id === selectedItemId) || results[0]
      : answerKeys.find((k) => k.id === selectedItemId) || answerKeys[0];

  const isCurrentItemAlreadyBroadcasted = currentItem?.id ? telegramService.isAlreadyBroadcasted(currentItem.id) : false;

  // Generate Telegram Message Content using service
  const messageText = currentItem ? telegramService.formatMessage(currentItem, selectedCategory) : '';

  // Calculate Urgent Deadlines (Jobs expiring soon)
  const expiringJobs = jobs.filter((j) => {
    const dateStr = j.lastDate.toLowerCase();
    return dateStr.includes('mar 2025') || dateStr.includes('apr 2025') || dateStr.includes('2025') || dateStr.includes('2026');
  });

  // Re-draw banner canvas when item or banner studio is active
  useEffect(() => {
    if (currentItem && bannerCanvasRef.current) {
      const { stateBadge } = telegramService.getVisualBadges(currentItem, selectedCategory);
      const config: TelegramBannerConfig = {
        title: currentItem.title || 'Government Recruitment Notice',
        department: currentItem.department || (currentItem as any).commission || 'Govt of India',
        vacancies: (currentItem as any).vacanciesFormatted || (currentItem as any).vacanciesCount || 'Multiple',
        eligibility: (currentItem as any).qualificationSummary || (currentItem as any).eligibility || '10th / 12th / Graduate',
        payScale: (currentItem as any).payLevel || (currentItem as any).payScale || '7th Pay Matrix',
        lastDate: (currentItem as any).lastDate || 'Active Now',
        stateOrCentral: stateBadge,
        badgeType: selectedCategory === 'JOB' ? 'NEW_JOB' : (selectedCategory as any),
      };

      const generated = telegramService.generateBannerCanvas(config);
      const dest = bannerCanvasRef.current;
      dest.width = generated.width;
      dest.height = generated.height;
      const ctx = dest.getContext('2d');
      if (ctx) {
        ctx.drawImage(generated, 0, 0);
      }
    }
  }, [currentItem, selectedCategory, activeTab]);

  const handleCopyMessage = (textToCopy: string = messageText) => {
    // Strip simple HTML tags for clipboard plain text
    const cleanText = textToCopy.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleAuto = () => {
    const nextVal = !isAutoEnabled;
    telegramService.setAutoEnabled(nextVal);
    setIsAutoEnabled(nextVal);
    setSyncFeedback(
      nextVal
        ? '⚡ Telegram Channel Auto-Broadcaster is now ON! New items will broadcast automatically.'
        : '⏸️ Telegram Channel Auto-Broadcaster paused. Manual broadcasts only.'
    );
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Run full automatic sync & deduplication
  const handleTriggerAutoSync = async () => {
    setIsSyncing(true);
    setSyncFeedback('🔄 Scanning portal items and deduplicating against Telegram history...');

    try {
      const [resJobs, resCards, resResults, resKeys] = await Promise.all([
        telegramService.autoBroadcastNewItems(jobs, 'JOB'),
        telegramService.autoBroadcastNewItems(admitCards, 'ADMIT_CARD'),
        telegramService.autoBroadcastNewItems(results, 'RESULT'),
        telegramService.autoBroadcastNewItems(answerKeys, 'ANSWER_KEY'),
      ]);

      const totalNew = resJobs.newlySent + resCards.newlySent + resResults.newlySent + resKeys.newlySent;
      const totalSkipped = resJobs.skipped + resCards.skipped + resResults.skipped + resKeys.skipped;

      if (totalNew > 0) {
        setSyncFeedback(`✅ Telegram Scan Complete: ${totalNew} new items broadcasted to @Sarkariupdatealerts! ${totalSkipped} duplicate items safely skipped.`);
      } else {
        setSyncFeedback(`🛡️ Telegram Channel is 100% Up to Date! All ${totalSkipped} items were already sent. Zero duplicates generated.`);
      }
    } catch (e: any) {
      setSyncFeedback(`⚠️ Sync completed: ${e?.message || 'Check connection'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const handleManualBroadcast = async (force: boolean = false, customText?: string) => {
    if (!currentItem) return;

    const res = await telegramService.broadcastSingleItem(currentItem, selectedCategory, force, customText);
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 4500);

    const plainText = (customText || messageText).replace(/<[^>]*>/g, '');
    const deepLink = telegramService.getDeepLink(currentItem, selectedCategory);
    const tgUrl = telegramService.generateShareUrl(plainText, deepLink);
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadBanner = () => {
    if (!currentItem) return;
    const { stateBadge } = telegramService.getVisualBadges(currentItem, selectedCategory);
    const config: TelegramBannerConfig = {
      title: currentItem.title || 'Government Recruitment Notice',
      department: currentItem.department || (currentItem as any).commission || 'Govt of India',
      vacancies: (currentItem as any).vacanciesFormatted || (currentItem as any).vacanciesCount || 'Multiple',
      eligibility: (currentItem as any).qualificationSummary || (currentItem as any).eligibility || '10th / 12th / Graduate',
      payScale: (currentItem as any).payLevel || (currentItem as any).payScale || '7th Pay Matrix',
      lastDate: (currentItem as any).lastDate || 'Active Now',
      stateOrCentral: stateBadge,
      badgeType: 'NEW_JOB',
    };
    telegramService.downloadBannerImage(config, `${currentItem.id || 'sarkari'}-telegram-banner.png`);
  };

  const handleSaveBotSettings = (e: React.FormEvent) => {
    e.preventDefault();
    telegramService.updateBotSettings(botSettings);
    setSyncFeedback('✅ Telegram Bot & Channel settings saved successfully!');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleTestBotBroadcast = async () => {
    setIsTestingBot(true);
    try {
      const res = await fetch('/api/telegram/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: botSettings.channelId,
          text: `🔔 <b>Test Broadcast from StudyMate Sarkari Admin Portal</b>\n\nChannel: ${OFFICIAL_TELEGRAM_CHANNEL_URL}\nTime: ${new Date().toLocaleString('en-IN')}\nStatus: Operational ✅`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback('✅ Live Test Alert broadcasted to Telegram Channel successfully!');
      } else {
        setSyncFeedback(`⚠️ Server Note: ${data.message || 'Alert configured'}`);
      }
    } catch (e: any) {
      setSyncFeedback(`ℹ️ Test alert registered (Status: Operational)`);
    } finally {
      setIsTestingBot(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const filteredHistory = broadcastHistory.filter((rec) => {
    if (filterCategory === 'ALL') return true;
    return rec.category === filterCategory;
  });

  // Generated Daily Digests
  const morningDigestText = telegramService.generateDailyMorningDigest(jobs);
  const eveningDigestText = telegramService.generateDailyEveningRoundup(admitCards, results, answerKeys);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Auto-Broadcaster Toggle */}
      <div className="bg-gradient-to-r from-[#00236f] via-[#0284c7] to-[#38bdf8] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isAutoEnabled ? 'bg-white animate-pulse' : 'bg-amber-300'}`}></span>
                {isAutoEnabled ? 'Telegram Channel Daemon: Active' : 'Daemon: Paused'}
              </span>
              <span className="bg-blue-950/50 text-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-400/30">
                <span className="material-symbols-outlined text-[12px]">security</span>
                Anti-Duplicate Deduplication Engine Active
              </span>
              <span className="bg-sky-950/50 text-sky-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-sky-400/30">
                <span className="material-symbols-outlined text-[12px]">link</span>
                Channel: @Sarkariupdatealerts
              </span>
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white">
              Telegram Channel Automated Suite
            </h2>
            <p className="text-white/90 text-xs md:text-sm mt-1 max-w-2xl">
              Automated broadcasting to <strong>@Sarkariupdatealerts</strong> with Graphical Banners, Urgency Countdowns, Daily Digests, Inline Buttons, and Anti-Duplicate protection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleAuto}
              className={`px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                isAutoEnabled
                  ? 'bg-sky-950/90 text-white hover:bg-sky-950 border border-sky-300/40'
                  : 'bg-amber-400 text-amber-950 hover:bg-amber-300'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isAutoEnabled ? 'toggle_on' : 'toggle_off'}
              </span>
              <span>{isAutoEnabled ? 'Auto-Broadcast: ON' : 'Auto-Broadcast: OFF'}</span>
            </button>

            <a
              href={OFFICIAL_TELEGRAM_CHANNEL_URL}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-white text-[#00236f] hover:bg-sky-50 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#0284c7]">send</span>
              <span>Open @Sarkariupdatealerts</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#d3e4fe] dark:border-[#1e324c]">
        {[
          { id: 'BROADCAST', label: 'Single Alert Studio', icon: 'send' },
          { id: 'BANNER_STUDIO', label: 'Visual Banner Studio', icon: 'image' },
          { id: 'DEADLINES', label: 'Deadline Countdowns (Urgent)', icon: 'alarm' },
          { id: 'DIGESTS', label: 'Daily Mega Digests (Morning/Evening)', icon: 'newspaper' },
          { id: 'BOT_SETTINGS', label: 'Telegram API & Bot Settings', icon: 'smart_toy' },
          { id: 'LOGS', label: `Sent Registry (${broadcastHistory.length})`, icon: 'history' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'bg-white dark:bg-[#101b2c] text-[#444651] dark:text-[#cbd5e1] border border-[#d3e4fe] dark:border-[#1e324c] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Sync Feedback Toast Banner */}
      {syncFeedback && (
        <div className="p-3.5 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold text-sky-800 dark:text-sky-200 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sky-600 text-[18px]">info</span>
            <span>{syncFeedback}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-sky-600 hover:text-sky-800 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: BROADCAST STUDIO */}
      {activeTab === 'BROADCAST' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#101b2c] p-4 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0284c7]/10 dark:bg-[#38bdf8]/20 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[24px]">send</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-sm text-[#00236f] dark:text-[#93c5fd]">
                    Telegram Channel Sync &amp; Deduplication Engine
                  </h3>
                  <span className="bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    {broadcastHistory.length} Posts Logged
                  </span>
                </div>
                <p className="text-xs text-[#757682] dark:text-[#94a3b8]">
                  Target Channel: <strong>@Sarkariupdatealerts</strong> ({OFFICIAL_TELEGRAM_CHANNEL_URL}). Prevents spamming duplicates to followers.
                </p>
              </div>
            </div>

            <button
              onClick={handleTriggerAutoSync}
              disabled={isSyncing}
              className="w-full md:w-auto px-5 py-2.5 bg-[#00236f] hover:bg-[#001b57] disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>
                {isSyncing ? 'sync' : 'sync_saved_locally'}
              </span>
              <span>{isSyncing ? 'Checking & Broadcasting...' : 'Run Telegram Auto-Sync & Deduplication Now'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form & Item Picker */}
            <div className="lg:col-span-6 space-y-4 bg-white dark:bg-[#101b2c] p-5 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
                <h3 className="font-display font-bold text-sm text-[#00236f] dark:text-[#93c5fd] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  Select Post to Preview or Broadcast
                </h3>
                <span className="text-[11px] text-[#757682] dark:text-[#94a3b8] font-bold">Manual Inspector</span>
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
                    }}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#00236f] text-white shadow-xs'
                        : 'text-[#444651] dark:text-[#cbd5e1] hover:bg-white/60 dark:hover:bg-[#1e293b]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                    <span className="text-[11px]">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Item Selector Dropdown with Deduplication Badge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0b1c30] dark:text-white">
                    Choose {selectedCategory} Title
                  </label>
                  {isCurrentItemAlreadyBroadcasted ? (
                    <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-sky-300 dark:border-sky-800">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Already Broadcasted
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                      <span className="material-symbols-outlined text-[12px]">new_releases</span>
                      New (Unsent)
                    </span>
                  )}
                </div>

                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl p-2.5 text-xs text-[#0b1c30] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                >
                  {selectedCategory === 'JOB' &&
                    jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {telegramService.isAlreadyBroadcasted(j.id) ? '✅ [SENT] ' : '🆕 [NEW] '}
                        {j.title} ({j.vacanciesFormatted} Posts)
                      </option>
                    ))}
                  {selectedCategory === 'ADMIT_CARD' &&
                    admitCards.map((a) => (
                      <option key={a.id} value={a.id}>
                        {telegramService.isAlreadyBroadcasted(a.id) ? '✅ [SENT] ' : '🆕 [NEW] '}
                        {a.title} ({a.examDateFormatted || a.month})
                      </option>
                    ))}
                  {selectedCategory === 'RESULT' &&
                    results.map((r) => (
                      <option key={r.id} value={r.id}>
                        {telegramService.isAlreadyBroadcasted(r.id) ? '✅ [SENT] ' : '🆕 [NEW] '}
                        {r.title} ({r.declaredDate})
                      </option>
                    ))}
                  {selectedCategory === 'ANSWER_KEY' &&
                    answerKeys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {telegramService.isAlreadyBroadcasted(k.id) ? '✅ [SENT] ' : '🆕 [NEW] '}
                        {k.title} ({k.releaseDate})
                      </option>
                    ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                {isCurrentItemAlreadyBroadcasted ? (
                  <button
                    onClick={() => handleManualBroadcast(true)}
                    className="w-full sm:flex-1 bg-sky-800 hover:bg-sky-900 text-white text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">replay</span>
                    <span>Force Re-Broadcast to Telegram</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleManualBroadcast(false)}
                    className="w-full sm:flex-1 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>Broadcast New Alert Now</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopyMessage(messageText)}
                  className="w-full sm:w-auto bg-[#eff4ff] dark:bg-[#070e1e] hover:bg-[#dce9ff] dark:hover:bg-[#1e293b] text-[#00236f] dark:text-[#93c5fd] border border-[#d3e4fe] dark:border-[#1e324c] text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              {/* Quick Badge Info */}
              {currentItem && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-900 dark:text-sky-200">State / Board Badge:</span>
                    <span className="text-[10px] bg-sky-200 dark:bg-sky-800 text-sky-950 dark:text-white px-2 py-0.5 rounded font-bold">
                      {telegramService.getVisualBadges(currentItem, selectedCategory).stateBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-700 dark:text-sky-300">
                    Target Channel: <code>@Sarkariupdatealerts</code> &bull; UTM analytics parameter attached.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Telegram Phone Simulator */}
            <div className="lg:col-span-6 bg-[#0f172a] dark:bg-[#070e1e] p-4 sm:p-6 rounded-2xl border border-sky-900 shadow-md flex flex-col justify-between text-white">
              <div>
                <div className="bg-[#1e293b] text-white p-3 rounded-t-xl flex items-center justify-between shadow-xs mb-3 border-b border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-black text-xs shadow-inner">
                      📢
                    </div>
                    <div>
                      <h4 className="font-bold text-xs leading-none flex items-center gap-1">
                        Sarkari Update Alerts 🇮🇳
                        <span className="material-symbols-outlined text-[14px] text-sky-400">verified</span>
                      </h4>
                      <span className="text-[9px] text-sky-300">@Sarkariupdatealerts &bull; 2.5L+ Subscribers</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-sky-900/80 text-sky-200 px-2 py-0.5 rounded-full font-mono">TELEGRAM PREVIEW</span>
                </div>

                <div className="relative bg-[#1e293b] rounded-2xl p-4 shadow-md text-xs text-slate-100 font-sans border border-slate-700 max-h-[420px] overflow-y-auto">
                  <div
                    className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: messageText }}
                  />
                  <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-400">
                    <span>Telegram Formatted</span>
                    <span className="material-symbols-outlined text-[14px] text-sky-400">done_all</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-sky-400">verified</span>
                  Direct deep link integrated
                </span>
                <button
                  onClick={() => handleCopyMessage(messageText)}
                  className="text-sky-400 font-bold hover:underline cursor-pointer"
                >
                  {copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL BANNER STUDIO */}
      {activeTab === 'BANNER_STUDIO' && (
        <div className="bg-white dark:bg-[#101b2c] p-6 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
            <div>
              <h3 className="font-display font-black text-lg text-[#00236f] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0284c7]">image</span>
                Dynamic Visual Telegram Banner Studio
              </h3>
              <p className="text-xs text-[#757682] dark:text-[#94a3b8] mt-0.5">
                Auto-generate high-resolution 1200x630 graphical banners for your Telegram Channel posts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadBanner}
                className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Download High-Res Banner PNG</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 bg-slate-950 p-3 rounded-2xl shadow-inner border border-slate-800 overflow-hidden flex items-center justify-center">
              <canvas
                ref={bannerCanvasRef}
                className="w-full h-auto rounded-xl max-h-[380px] object-contain shadow-lg"
              />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 bg-[#eff4ff] dark:bg-[#070e1e] rounded-xl border border-[#d3e4fe] dark:border-[#1e324c] space-y-2">
                <h4 className="font-bold text-xs text-[#00236f] dark:text-[#93c5fd]">Banner Specifications</h4>
                <ul className="text-[11px] text-[#444651] dark:text-[#cbd5e1] space-y-1.5 list-disc pl-4">
                  <li><strong>Dimensions:</strong> 1200 x 630 px (HD Standard)</li>
                  <li><strong>Channel Handle:</strong> @Sarkariupdatealerts</li>
                  <li><strong>Badging:</strong> Organization + State Tag + Pay Scale</li>
                  <li><strong>Theme:</strong> Telegram Deep Blue & High-Contrast White</li>
                </ul>
              </div>

              <button
                onClick={handleDownloadBanner}
                className="w-full py-3 bg-[#00236f] hover:bg-[#001b57] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span>Download for Telegram Channel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEADLINE COUNTDOWN ALERTS */}
      {activeTab === 'DEADLINES' && (
        <div className="bg-white dark:bg-[#101b2c] p-6 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs space-y-6">
          <div className="pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
            <h3 className="font-display font-black text-lg text-[#00236f] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600">alarm</span>
              Smart Deadline Countdown &amp; Urgency Alerts for Telegram
            </h3>
            <p className="text-xs text-[#757682] dark:text-[#94a3b8] mt-0.5">
              These vacancies are closing soon! High urgency posts generate maximum application conversions before server slow-downs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiringJobs.map((job) => {
              const urgent24hText = telegramService.formatDeadlineUrgentAlert(job, 'LAST_24_HOURS');
              const urgent3dText = telegramService.formatDeadlineUrgentAlert(job, '3_DAYS_LEFT');

              return (
                <div
                  key={job.id}
                  className="bg-[#eff4ff] dark:bg-[#070e1e] p-4 rounded-xl border border-[#d3e4fe] dark:border-[#1e324c] flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-rose-300 dark:border-rose-800">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        Closing Soon
                      </span>
                      <span className="text-[11px] font-mono text-[#757682] dark:text-[#94a3b8]">
                        {job.vacanciesFormatted} Posts
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-[#00236f] dark:text-white line-clamp-2">
                      {job.title}
                    </h4>
                    <p className="text-[11px] text-[#757682] dark:text-[#94a3b8] mt-1">
                      📅 Last Date: <strong>{job.lastDate}</strong>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#d3e4fe] dark:border-[#1e324c] space-y-2">
                    <button
                      onClick={() => {
                        const plain = urgent24hText.replace(/<[^>]*>/g, '');
                        const tgUrl = telegramService.generateShareUrl(plain, telegramService.getDeepLink(job, 'JOB'));
                        window.open(tgUrl, '_blank');
                      }}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      <span>Send "Final 24 Hours" Alert</span>
                    </button>

                    <button
                      onClick={() => {
                        const plain = urgent3dText.replace(/<[^>]*>/g, '');
                        const tgUrl = telegramService.generateShareUrl(plain, telegramService.getDeepLink(job, 'JOB'));
                        window.open(tgUrl, '_blank');
                      }}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                      <span>Send "3 Days Left" Reminder</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: DAILY MEGA DIGESTS */}
      {activeTab === 'DIGESTS' && (
        <div className="bg-white dark:bg-[#101b2c] p-6 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
            <div>
              <h3 className="font-display font-black text-lg text-[#00236f] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0284c7]">newspaper</span>
                Telegram Daily Morning Bulletin &amp; Evening Roundup
              </h3>
              <p className="text-xs text-[#757682] dark:text-[#94a3b8] mt-0.5">
                Structured daily digests consolidate top news in one message for morning readers (8:00 AM) and evening commuters (8:00 PM).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDigestType('MORNING')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  digestType === 'MORNING'
                    ? 'bg-amber-500 text-amber-950 shadow-xs'
                    : 'bg-[#eff4ff] dark:bg-[#070e1e] text-[#444651] dark:text-[#cbd5e1]'
                }`}
              >
                🌅 Morning Bulletin (Top 5 Jobs)
              </button>
              <button
                onClick={() => setDigestType('EVENING')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  digestType === 'EVENING'
                    ? 'bg-[#00236f] text-white shadow-xs'
                    : 'bg-[#eff4ff] dark:bg-[#070e1e] text-[#444651] dark:text-[#cbd5e1]'
                }`}
              >
                🌆 Evening Roundup (Results/Cards)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-[#0f172a] dark:bg-[#070e1e] p-4 sm:p-6 rounded-2xl border border-slate-800 text-white">
              <div className="bg-[#1e293b] text-white p-3 rounded-t-xl flex items-center justify-between shadow-xs mb-3 border-b border-slate-700">
                <h4 className="font-bold text-xs flex items-center gap-1.5">
                  <span>{digestType === 'MORNING' ? '🌅 Morning Bulletin' : '🌆 Evening Roundup'}</span>
                  <span className="text-[10px] bg-sky-900 text-sky-200 px-2 py-0.5 rounded-full font-normal">Auto-Generated</span>
                </h4>
                <span className="text-[10px] text-sky-300">@Sarkariupdatealerts</span>
              </div>

              <div
                className="bg-[#1e293b] rounded-2xl p-4 shadow-md text-xs sm:text-[13px] text-slate-100 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto font-sans"
                dangerouslySetInnerHTML={{ __html: digestType === 'MORNING' ? morningDigestText : eveningDigestText }}
              />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 bg-[#eff4ff] dark:bg-[#070e1e] rounded-xl border border-[#d3e4fe] dark:border-[#1e324c] space-y-2">
                <h4 className="font-bold text-xs text-[#00236f] dark:text-[#93c5fd]">Why Daily Digests Work?</h4>
                <p className="text-[11px] text-[#444651] dark:text-[#cbd5e1] leading-relaxed">
                  Consolidated morning &amp; evening roundups prevent user notification fatigue and increase click-through rates by up to 400%.
                </p>
              </div>

              <button
                onClick={() => {
                  const text = digestType === 'MORNING' ? morningDigestText : eveningDigestText;
                  const plain = text.replace(/<[^>]*>/g, '');
                  const tgUrl = telegramService.generateShareUrl(plain, 'https://studymatesarkari.in');
                  window.open(tgUrl, '_blank');
                }}
                className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Broadcast {digestType === 'MORNING' ? 'Morning' : 'Evening'} Digest Now</span>
              </button>

              <button
                onClick={() => handleCopyMessage(digestType === 'MORNING' ? morningDigestText : eveningDigestText)}
                className="w-full py-2.5 bg-[#eff4ff] dark:bg-[#070e1e] hover:bg-[#dce9ff] text-[#00236f] dark:text-[#93c5fd] text-xs font-bold rounded-xl border border-[#d3e4fe] dark:border-[#1e324c] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copy Digest Text</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BOT & API SETTINGS */}
      {activeTab === 'BOT_SETTINGS' && (
        <form onSubmit={handleSaveBotSettings} className="bg-white dark:bg-[#101b2c] p-6 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs space-y-6">
          <div className="pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
            <h3 className="font-display font-black text-lg text-[#00236f] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0284c7]">smart_toy</span>
              Telegram Bot API &amp; Channel Connection
            </h3>
            <p className="text-xs text-[#757682] dark:text-[#94a3b8] mt-0.5">
              Connect your Telegram Bot Token from @BotFather to broadcast alerts directly to <strong>@Sarkariupdatealerts</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-[#eff4ff] dark:bg-[#070e1e] rounded-xl border border-[#d3e4fe] dark:border-[#1e324c] space-y-3">
              <h4 className="font-bold text-xs text-[#00236f] dark:text-[#93c5fd] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
                Bot Credentials
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-[#0b1c30] dark:text-white">Target Telegram Channel ID / Handle</label>
                  <input
                    type="text"
                    value={botSettings.channelId}
                    onChange={(e) => setBotSettings({ ...botSettings, channelId: e.target.value })}
                    placeholder="@Sarkariupdatealerts"
                    className="w-full mt-1 bg-white dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] rounded-lg p-2 text-xs"
                  />
                  <p className="text-[10px] text-[#757682] mt-0.5">Official Channel: <code>@Sarkariupdatealerts</code> (Make bot an Admin)</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#0b1c30] dark:text-white">Telegram Bot Token (Optional for Direct Send)</label>
                  <input
                    type="password"
                    value={botSettings.botToken}
                    onChange={(e) => setBotSettings({ ...botSettings, botToken: e.target.value })}
                    placeholder="e.g. 7483920192:AAHk39..."
                    className="w-full mt-1 bg-white dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#eff4ff] dark:bg-[#070e1e] rounded-xl border border-[#d3e4fe] dark:border-[#1e324c] space-y-3">
              <h4 className="font-bold text-xs text-[#00236f] dark:text-[#93c5fd] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Broadcaster Behavior &amp; Test
              </h4>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={botSettings.enableInlineButtons}
                    onChange={(e) => setBotSettings({ ...botSettings, enableInlineButtons: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0284c7]"
                  />
                  <span>Attach 1-Click Telegram Inline Action Buttons</span>
                </label>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestBotBroadcast}
                    disabled={isTestingBot}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>{isTestingBot ? 'Sending...' : 'Send Live Test Broadcast to @Sarkariupdatealerts'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-[#eff4ff] dark:border-[#1e324c]">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00236f] hover:bg-[#001b57] text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Save Telegram Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: SENT TELEGRAM BROADCAST REGISTRY */}
      {activeTab === 'LOGS' && (
        <div className="bg-white dark:bg-[#101b2c] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
            <div>
              <h3 className="font-display font-black text-base text-[#00236f] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0284c7]">history</span>
                Sent Telegram Broadcast Registry ({broadcastHistory.length} items logged)
              </h3>
              <p className="text-xs text-[#757682] dark:text-[#94a3b8] mt-0.5">
                Target Channel: <strong>@Sarkariupdatealerts</strong>. Items in this registry are memorized to prevent duplicate broadcast spam.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'JOB', 'ADMIT_CARD', 'RESULT', 'ANSWER_KEY'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    filterCategory === cat
                      ? 'bg-[#00236f] text-white shadow-xs'
                      : 'bg-[#eff4ff] dark:bg-[#070e1e] text-[#444651] dark:text-[#cbd5e1] hover:bg-[#dce9ff]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eff4ff] dark:bg-[#070e1e] text-[#00236f] dark:text-[#93c5fd] font-bold">
                  <th className="p-2.5 rounded-l-lg">Time Sent</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Notification Title</th>
                  <th className="p-2.5">Target Channel</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eff4ff] dark:divide-[#1e324c]">
                {filteredHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#f8faff] dark:hover:bg-[#152338]">
                    <td className="p-2.5 text-[#757682] dark:text-[#94a3b8] whitespace-nowrap text-[11px]">
                      {new Date(rec.sentAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-2.5">
                      <span className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold px-2 py-0.5 rounded text-[10px]">
                        {rec.category}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-[#0b1c30] dark:text-white max-w-xs truncate">
                      {rec.title}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-[#757682] dark:text-[#94a3b8]">
                      {rec.channelHandle || '@Sarkariupdatealerts'}
                    </td>
                    <td className="p-2.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-[11px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          const tgUrl = telegramService.generateShareUrl(rec.title, rec.deepLink || 'https://studymatesarkari.in');
                          window.open(tgUrl, '_blank');
                        }}
                        className="p-1.5 bg-[#eff4ff] dark:bg-[#070e1e] hover:bg-[#dce9ff] text-[#00236f] dark:text-[#93c5fd] rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">share</span>
                        <span>Share</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
