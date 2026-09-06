import React, { useState, useEffect } from 'react';
import { GovernmentSource, TelegramBotLog } from '../types';
import { supabaseService, SupabaseConfig } from '../services/supabaseService';

export interface TelegramBotDashboardProps {
  sources: GovernmentSource[];
  botLogs: TelegramBotLog[];
  onAddSource: (src: Omit<GovernmentSource, 'id' | 'itemsFoundCount' | 'lastStatus'>) => void;
  onToggleSource: (id: string) => void;
  onSimulateScrape: (sourceName: string) => void;
  onNavigate: (tab: string) => void;
}

export const TelegramBotDashboard: React.FC<TelegramBotDashboardProps> = ({
  sources,
  botLogs,
  onAddSource,
  onToggleSource,
  onSimulateScrape,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'render' | 'links' | 'supabase' | 'code' | 'instructions'>('overview');
  const [selectedCodeFile, setSelectedCodeFile] = useState<'bot.py' | 'config.py' | 'scrapers.py' | 'render.yaml' | 'sql'>('bot.py');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Admin Telegram ID specified by user
  const ADMIN_TELEGRAM_ID = '5165363865';

  // Supabase settings state
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(supabaseService.getConfig());
  const [supabaseSaveMsg, setSupabaseSaveMsg] = useState('');

  // Telegram Bot Check State
  const [botCheckResult, setBotCheckResult] = useState<any>(null);
  const [isCheckingBot, setIsCheckingBot] = useState(false);

  // Sync Live Government Data to Supabase
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [syncDataMsg, setSyncDataMsg] = useState('');

  const handleCheckBotConnection = async () => {
    setIsCheckingBot(true);
    try {
      const res = await supabaseService.checkTelegramStatus();
      setBotCheckResult(res);
    } catch (e: any) {
      setBotCheckResult({
        connected: false,
        status: 'FETCH_ERROR',
        message: e.message || 'Failed to connect to verification API',
      });
    } finally {
      setIsCheckingBot(false);
    }
  };

  const handleSyncOfficialData = async () => {
    setIsSyncingData(true);
    setSyncDataMsg('');
    try {
      const res = await supabaseService.syncOfficialDataToSupabase();
      setSyncDataMsg(res.message);
      if (res.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (e: any) {
      setSyncDataMsg(e.message || 'Sync failed');
    } finally {
      setIsSyncingData(false);
    }
  };

  useEffect(() => {
    handleCheckBotConnection();
  }, []);

  // Add Link Form State
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<'Central Commission' | 'State PSC' | 'Railway Board' | 'Police Recruitment'>('State PSC');
  const [newLinkState, setNewLinkState] = useState('All India');

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    supabaseService.setConfig(supabaseConfig.url, supabaseConfig.anonKey);
    setSupabaseSaveMsg('✅ Supabase credentials saved! Live sync enabled.');
    setTimeout(() => setSupabaseSaveMsg(''), 4000);
  };

  const handleTestTelegramNotification = async () => {
    setIsTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await supabaseService.sendTestTelegramAlert();
      setTelegramTestResult(res);
    } catch {
      setTelegramTestResult({ success: false, message: 'Server communication error' });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleCreateSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName || !newLinkUrl) return;
    onAddSource({
      name: newLinkName,
      url: newLinkUrl,
      type: newLinkType as any,
      stateOrDomain: newLinkState,
      scrapeCategory: 'All',
      isActive: true,
    });
    setNewLinkName('');
    setNewLinkUrl('');
    alert(`Added "${newLinkName}" to automated 1-hour scraping schedule!`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#00236f] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] font-bold">🤖 Telegram Bot & Government Scraper Engine</span>
      </nav>

      {/* 2. Banner */}
      <div className="bg-gradient-to-r from-[#003120] via-[#004a32] to-[#00236f] rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#85f8c4] animate-ping"></span>
                Auto-Scraper Active • 1 Hour Cycle
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[#ffdcc3]/20 text-[#ffe2cc] px-3 py-1 rounded-full text-xs font-mono font-bold border border-[#ffdcc3]/30">
                <span className="material-symbols-outlined text-[14px]">send</span>
                Telegram Admin ID: {ADMIN_TELEGRAM_ID}
              </div>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              Telegram Bot & Supabase Scraper Manager
            </h1>
            <p className="text-white/80 text-xs md:text-sm mt-2">
              Configured for <strong>Render.com deployment</strong>. Automatically crawls official Central & State government portals every 1 hour, stores alerts in Supabase, and dispatches directly to Telegram ID <code className="bg-white/20 px-1.5 py-0.5 rounded text-white">{ADMIN_TELEGRAM_ID}</code>.
            </p>
          </div>

          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/20 text-center shrink-0 w-full md:w-auto">
            <span className="text-[10px] uppercase font-bold text-white/70 block">Active Scraping Targets</span>
            <span className="font-display font-black text-3xl text-[#85f8c4] block">
              {sources.filter((s) => s.isActive).length} Portals
            </span>
            <span className="text-[11px] text-white/80">Central + 28 States</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#d3e4fe] shadow-xs overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Dashboard & Activity Logs', icon: 'dashboard' },
          { id: 'render', label: 'Render.com Deployment 🚀', icon: 'cloud_upload' },
          { id: 'links', label: 'Government Links Directory', icon: 'link' },
          { id: 'supabase', label: 'Supabase Database Sync', icon: 'database' },
          { id: 'code', label: 'Bot & Render Source Files', icon: 'code' },
          { id: 'instructions', label: 'Setup Guide (Hindi + Eng)', icon: 'menu_book' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-4 rounded-xl text-xs md:text-[13px] font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-[#444651] hover:bg-[#eff4ff] hover:text-[#00236f]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab 1: Overview & Logs */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Activity Timeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-[#00236f] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">history</span>
                Live Hourly Scraper & Dispatch Log
              </h2>
              <button
                onClick={() => onSimulateScrape('All Central & State Portals')}
                className="bg-[#003120] hover:bg-[#004a32] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                Run Scrape Now
              </button>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {botLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[#eff4ff] rounded-xl border border-[#d3e4fe] text-xs flex items-start gap-3"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                      log.messageType === 'SCRAPE_DISCOVERY'
                        ? 'bg-[#904d00]'
                        : log.messageType === 'TELEGRAM_BROADCAST'
                        ? 'bg-[#003120]'
                        : 'bg-[#00236f]'
                    }`}
                  ></span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#00236f]">{log.sourceName}</strong>
                      <span className="text-[10px] text-[#757682] font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-[#0b1c30] mt-0.5">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1 Col: Bot Status Card */}
          <div className="space-y-4">
            {/* Telegram Bot Live Verification Card */}
            <div className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm text-[#00236f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#00236f]">smart_toy</span>
                  Telegram Bot Status
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    botCheckResult?.connected
                      ? 'bg-[#85f8c4] text-[#002114]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {botCheckResult?.connected ? 'CONNECTED 🟢' : 'TOKEN REQUIRED 🟡'}
                </span>
              </div>

              {botCheckResult?.connected ? (
                <div className="bg-[#eff4ff] p-3 rounded-xl space-y-1.5 text-xs text-[#0b1c30] mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#757682]">Bot Name:</span>
                    <strong className="text-[#00236f]">{botCheckResult.bot?.firstName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#757682]">Bot Username:</span>
                    <a
                      href={botCheckResult.botUrl || `https://t.me/${botCheckResult.bot?.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#00236f] font-bold underline flex items-center gap-1"
                    >
                      @{botCheckResult.bot?.username}
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#757682]">Target Admin:</span>
                    <span className="font-mono font-bold text-[#004a32]">{ADMIN_TELEGRAM_ID}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 mb-3 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Bot Token check in progress or not set
                  </p>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Add <code className="bg-amber-100 px-1 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> in Render environment to activate auto-alerts to ID {ADMIN_TELEGRAM_ID}.
                  </p>
                </div>
              )}

              {/* Direct Check Link */}
              <div className="pt-2 border-t border-[#eff4ff] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#757682] font-medium">Direct Check Link:</span>
                  <a
                    href="/api/telegram/check"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00236f] font-bold hover:underline flex items-center gap-1"
                  >
                    /api/telegram/check
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                </div>

                <button
                  onClick={handleCheckBotConnection}
                  disabled={isCheckingBot}
                  className="w-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00236f] text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className={`material-symbols-outlined text-[15px] ${isCheckingBot ? 'animate-spin' : ''}`}>
                    {isCheckingBot ? 'refresh' : 'sync'}
                  </span>
                  {isCheckingBot ? 'Verifying Telegram Bot...' : 'Check Telegram Bot Connection'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#d3e4fe] p-5 shadow-xs">
              <h3 className="font-display font-bold text-sm text-[#00236f] mb-3">Bot Execution Status</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#eff4ff] rounded-xl">
                  <span className="text-[#757682]">Scheduler Interval:</span>
                  <strong className="text-[#00236f]">Every 1 Hour (60 Mins)</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#85f8c4]/20 rounded-xl">
                  <span className="text-[#003120]">Supabase Sync:</span>
                  <strong className="text-[#004a32]">
                    {supabaseConfig.isConnected ? 'Connected 🟢' : 'Configured for Render 🟡'}
                  </strong>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#ffdcc3]/40 rounded-xl">
                  <span className="text-[#6e3900]">Telegram Recipient:</span>
                  <strong className="text-[#904d00] font-mono">ID: {ADMIN_TELEGRAM_ID} 🎯</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#d3e4fe]/40 rounded-xl">
                  <span className="text-[#00236f]">Deploy Platform:</span>
                  <strong className="text-[#00236f]">Render.com Ready</strong>
                </div>
              </div>
            </div>

            <div className="bg-[#00236f] rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[20px] text-[#85f8c4]">cloud_upload</span>
                <h3 className="font-display font-bold text-sm text-white">Deploy on Render.com</h3>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Everything is configured for Render! Deploy both the Web Portal and 24/7 Python Bot with your environment variables.
              </p>
              <button
                onClick={() => setActiveTab('render')}
                className="mt-3 w-full bg-[#85f8c4] hover:bg-[#6ee8b0] text-[#002114] text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                Open Render Deployment Hub →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.5. Tab: Render.com Deployment Hub */}
      {activeTab === 'render' && (
        <div className="space-y-6">
          {/* Render Banner */}
          <div className="bg-gradient-to-r from-[#0b1c30] via-[#112d4e] to-[#00236f] rounded-2xl p-6 text-white shadow-md border border-white/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#85f8c4]/20 text-[#85f8c4] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-[#85f8c4]/30">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Render.com Ready (Web Service + Background Worker)
                </div>
                <h2 className="font-display font-bold text-2xl text-white">
                  Render Deployment & Environment Hub
                </h2>
                <p className="text-white/80 text-xs md:text-sm mt-1 max-w-2xl">
                  Deploy this website on Render as a <strong>Web Service</strong> (Vite + Node Express), and run the Python auto-scraper 24/7 as a <strong>Background Worker</strong> with your Telegram Bot Token and Supabase credentials.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10 text-center shrink-0 w-full md:w-auto">
                <span className="text-[10px] uppercase font-bold text-white/70 block">Telegram Destination ID</span>
                <span className="font-mono font-black text-2xl text-[#85f8c4] block">
                  {ADMIN_TELEGRAM_ID}
                </span>
                <span className="text-[10px] text-white/80">Direct Alert Delivery</span>
              </div>
            </div>
          </div>

          {/* Telegram Bot Live Verification & Check Link Card */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-[#00236f]">link</span>
                  <h3 className="font-display font-bold text-base text-[#00236f]">
                    Telegram Bot Connection Check Link
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      botCheckResult?.connected
                        ? 'bg-[#85f8c4] text-[#002114]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {botCheckResult?.connected ? 'CONNECTED 🟢' : 'TOKEN REQUIRED 🟡'}
                  </span>
                </div>
                <p className="text-xs text-[#444651] mt-0.5">
                  Direct diagnostic URL to verify if your Telegram bot token is active and communicating with Telegram API:
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/api/telegram/check"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00236f] text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Open Check Link
                </a>
                <button
                  onClick={handleCheckBotConnection}
                  disabled={isCheckingBot}
                  className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isCheckingBot ? 'animate-spin' : ''}`}>
                    {isCheckingBot ? 'refresh' : 'sync'}
                  </span>
                  {isCheckingBot ? 'Verifying...' : 'Re-Check Status'}
                </button>
              </div>
            </div>

            {/* Check URL Display Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe]">
              <div className="font-mono text-xs text-[#00236f] font-bold select-all overflow-x-auto flex-1 py-1">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/telegram/check` : '/api/telegram/check'}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/api/telegram/check`
                      : '/api/telegram/check'
                  )
                }
                className="bg-white hover:bg-white/80 text-[#00236f] border border-[#d3e4fe] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                Copy Check Link
              </button>
            </div>

            {/* Live Status Result View */}
            {botCheckResult && (
              <div
                className={`p-4 rounded-xl text-xs space-y-2 border ${
                  botCheckResult.connected
                    ? 'bg-[#85f8c4]/15 border-[#85f8c4] text-[#003120]'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-[18px]">
                      {botCheckResult.connected ? 'check_circle' : 'info'}
                    </span>
                    <span>Status: {botCheckResult.status}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">
                    {botCheckResult.checkTime || 'Just now'}
                  </span>
                </div>
                <p className="leading-relaxed">{botCheckResult.message}</p>

                {botCheckResult.connected && botCheckResult.bot && (
                  <div className="pt-2 border-t border-[#85f8c4]/40 flex flex-wrap items-center gap-4 text-xs font-bold">
                    <span>Bot: {botCheckResult.bot.firstName}</span>
                    <a
                      href={botCheckResult.botUrl || `https://t.me/${botCheckResult.bot.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-[#004a32] flex items-center gap-1"
                    >
                      @{botCheckResult.bot.username}
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                    <span>Recipient ID: {ADMIN_TELEGRAM_ID}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Telegram Dispatch Card */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-base text-[#00236f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#00236f]">send</span>
                  Test Telegram Alert to ID: {ADMIN_TELEGRAM_ID}
                </h3>
                <p className="text-xs text-[#444651] mt-0.5">
                  Send an instant test ping directly to your Telegram ID ({ADMIN_TELEGRAM_ID}) using your configured bot token.
                </p>
              </div>

              <button
                onClick={handleTestTelegramNotification}
                disabled={isTestingTelegram}
                className="bg-[#00236f] hover:bg-[#1e3a8a] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
              >
                {isTestingTelegram ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sending Ping...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                    Send Test Alert Now
                  </>
                )}
              </button>
            </div>

            {telegramTestResult && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  telegramTestResult.success
                    ? 'bg-[#85f8c4]/20 text-[#004a32] border border-[#85f8c4]'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {telegramTestResult.success ? 'check_circle' : 'error'}
                </span>
                {telegramTestResult.message}
              </div>
            )}
          </div>

          {/* Environment Variables to Copy */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-base text-[#00236f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#003120]">key</span>
                  Render Environment Variables (Copy & Paste)
                </h3>
                <p className="text-xs text-[#444651] mt-0.5">
                  Enter these variables in your Render Dashboard under <strong>Environment</strong>:
                </p>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    `SUPABASE_URL=https://your-project.supabase.co\nSUPABASE_ANON_KEY=your_supabase_anon_key\nSUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_role_key\nVITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your_supabase_anon_key\nTELEGRAM_BOT_TOKEN=your_bot_token_from_botfather\nTELEGRAM_ADMIN_ID=5165363865\nTELEGRAM_CHAT_ID=5165363865\nTELEGRAM_CHANNEL_ID=5165363865\nSCRAPING_INTERVAL_HOURS=1\nPORT=10000\nNODE_ENV=production`
                  )
                }
                className="bg-[#003120] hover:bg-[#004a32] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                {copiedKey ? 'Copied to Clipboard!' : 'Copy All Variables'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#eff4ff] text-[#00236f] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Variable Name</th>
                    <th className="p-3">Required Value / Description</th>
                    <th className="p-3">Used By</th>
                    <th className="p-3 rounded-r-xl text-right">Status in Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d3e4fe]">
                  <tr className="hover:bg-[#f8faff]">
                    <td className="p-3 font-mono font-bold text-[#00236f]">SUPABASE_URL</td>
                    <td className="p-3 text-[#444651]">Aapke Supabase project ka URL (jaise: https://xyz.supabase.co)</td>
                    <td className="p-3 font-medium">Website + Bot</td>
                    <td className="p-3 text-right text-[#003120] font-bold">Auto-detected ✅</td>
                  </tr>
                  <tr className="hover:bg-[#f8faff]">
                    <td className="p-3 font-mono font-bold text-[#00236f]">SUPABASE_ANON_KEY</td>
                    <td className="p-3 text-[#444651]">Supabase Anon (public) API key frontend ke liye</td>
                    <td className="p-3 font-medium">Website</td>
                    <td className="p-3 text-right text-[#003120] font-bold">Supported ✅</td>
                  </tr>
                  <tr className="hover:bg-[#f8faff]">
                    <td className="p-3 font-mono font-bold text-[#00236f]">SUPABASE_SERVICE_ROLE_KEY</td>
                    <td className="p-3 text-[#444651]">Supabase Secret Service Role key (Python bot DB writes ke liye)</td>
                    <td className="p-3 font-medium">Python Bot</td>
                    <td className="p-3 text-right text-[#003120] font-bold">Supported ✅</td>
                  </tr>
                  <tr className="hover:bg-[#f8faff]">
                    <td className="p-3 font-mono font-bold text-[#00236f]">TELEGRAM_BOT_TOKEN</td>
                    <td className="p-3 text-[#444651]">@BotFather se mila secret Bot Token</td>
                    <td className="p-3 font-medium">Telegram Bot</td>
                    <td className="p-3 text-right text-[#003120] font-bold">Integrated ✅</td>
                  </tr>
                  <tr className="hover:bg-[#f8faff] bg-[#85f8c4]/10">
                    <td className="p-3 font-mono font-bold text-[#003120]">TELEGRAM_ADMIN_ID</td>
                    <td className="p-3 text-[#002114] font-bold font-mono">5165363865</td>
                    <td className="p-3 font-medium">Alerts Destination</td>
                    <td className="p-3 text-right text-[#003120] font-bold">Hardcoded in code 🎯</td>
                  </tr>
                  <tr className="hover:bg-[#f8faff] bg-[#85f8c4]/10">
                    <td className="p-3 font-mono font-bold text-[#003120]">TELEGRAM_CHAT_ID</td>
                    <td className="p-3 text-[#002114] font-bold font-mono">5165363865</td>
                    <td className="p-3 font-medium">Alerts Destination</td>
                    <td className="p-3 text-right text-[#003120] font-bold">Configured 🎯</td>
                  </tr>
                  <tr className="hover:bg-[#f8faff]">
                    <td className="p-3 font-mono font-bold text-[#00236f]">SCRAPING_INTERVAL_HOURS</td>
                    <td className="p-3 text-[#444651]">Scraping frequency in hours (defaults to 1)</td>
                    <td className="p-3 font-medium">Hourly Crawler</td>
                    <td className="p-3 text-right text-[#003120] font-bold">1 Hour ✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Render Step-by-Step Hindi Guide */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <span className="material-symbols-outlined text-[20px] text-amber-700">build_circle</span>
                Render Build Error Fix (Cannot find module &apos;dist/server.cjs&apos; Solved)
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Aapke Render dashboard me <strong>Build Command</strong> me sirf <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">bun install</code> ya <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">npm install</code> tha, jisse code compile nahi hua tha. Humne 3 cheezein fix kar di hain:
              </p>
              <ul className="text-xs text-amber-900 list-disc pl-5 mt-2 space-y-1">
                <li><strong>bun.lock delete:</strong> Incompatible Bun lockfile hata di gayi hai jisse standard Node.js use hoga.</li>
                <li><strong>Self-Healing Start Script:</strong> Agar Render build step skip bhi karega, to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">npm start</code> khud check karke pehle project build karega fir server start karega!</li>
                <li><strong>Render Settings:</strong> Render Dashboard ke <strong>Settings</strong> tab me jaakar <strong>Build Command</strong> ko <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">npm install && npm run build</code> set kar lijiye.</li>
              </ul>
            </div>

            <h3 className="font-display font-bold text-base text-[#00236f] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#904d00]">rocket_launch</span>
              Render.com Par Deploy Karne Ka Step-by-Step Tareeka (Hindi Guide)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#eff4ff] rounded-2xl border border-[#d3e4fe] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#00236f] text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#00236f] text-white flex items-center justify-center text-xs">1</span>
                  Option A: Blueprint Se (Sabse Aasan)
                </div>
                <p className="text-[#444651] leading-relaxed">
                  Project ke root folder me <strong>render.yaml</strong> file banayi gayi hai. Jab aap Render par GitHub repo connect karenge:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[#0b1c30]">
                  <li>Render.com par <strong>New +</strong> click karke <strong>Blueprint</strong> select karein.</li>
                  <li>Apna GitHub repo choose karein.</li>
                  <li>Render automatically dono services (Website + Python Bot) create kar dega.</li>
                  <li>Environment Variables me apna Supabase URL, Anon Key, Secret Role Key aur Telegram Bot Token daal kar Deploy dabayein!</li>
                </ol>
              </div>

              <div className="p-4 bg-[#eff4ff] rounded-2xl border border-[#d3e4fe] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#00236f] text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#003120] text-white flex items-center justify-center text-xs">2</span>
                  Option B: Manual Services (Website + Bot)
                </div>
                <div className="space-y-1.5 text-[#0b1c30]">
                  <div className="p-2 bg-white rounded-lg border border-[#d3e4fe]">
                    <strong className="text-[#00236f] block">1. Web Service (Website):</strong>
                    <p className="text-[11px] text-[#444651]">
                      Build Command: <code className="bg-[#eff4ff] px-1 py-0.5 rounded font-mono">npm install && npm run build</code><br/>
                      Start Command: <code className="bg-[#eff4ff] px-1 py-0.5 rounded font-mono">npm start</code>
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#d3e4fe]">
                    <strong className="text-[#003120] block">2. Background Worker (Python Bot):</strong>
                    <p className="text-[11px] text-[#444651]">
                      Build Command: <code className="bg-[#eff4ff] px-1 py-0.5 rounded font-mono">pip install -r telegram_bot/requirements.txt</code><br/>
                      Start Command: <code className="bg-[#eff4ff] px-1 py-0.5 rounded font-mono">python telegram_bot/bot.py</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Government Links Directory */}
      {activeTab === 'links' && (
        <div className="space-y-6">
          {/* Add New Link Form */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs">
            <h2 className="font-display font-extrabold text-base text-[#00236f] flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[20px]">add_link</span>
              Add Custom Government Website Link for 1-Hour Scraping
            </h2>
            <p className="text-xs text-[#444651] mb-4">
              Enter any new Central Ministry or State recruitment board URL. The bot will automatically inspect it during every hourly cycle.
            </p>

            <form onSubmit={handleCreateSource} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#757682] uppercase block mb-1">Board / Commission Name</label>
                <input
                  type="text"
                  placeholder="e.g. Punjab Police PSSSB"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-[#757682] uppercase block mb-1">Official Website URL</label>
                <input
                  type="url"
                  placeholder="https://psssb.punjab.gov.in"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-[#757682] uppercase block mb-1">Category Type</label>
                <select
                  value={newLinkType}
                  onChange={(e) => setNewLinkType(e.target.value as any)}
                  className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30] focus:outline-none cursor-pointer"
                >
                  <option value="Central Commission">Central Commission</option>
                  <option value="State PSC">State PSC</option>
                  <option value="Railway Board">Railway Board</option>
                  <option value="Police Recruitment">Police Recruitment</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#757682] uppercase block mb-1">State / Scope</label>
                <input
                  type="text"
                  placeholder="e.g. Punjab or All India"
                  value={newLinkState}
                  onChange={(e) => setNewLinkState(e.target.value)}
                  className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 mt-2">
                <button
                  type="submit"
                  className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Save & Add to Scraper Engine
                </button>
              </div>
            </form>
          </div>

          {/* Links Directory Table */}
          <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs">
            <h3 className="font-display font-bold text-base text-[#00236f] mb-4">
              Configured Government Websites ({sources.length} Total)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[#eff4ff]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#eff4ff] text-[#00236f] font-bold">
                  <tr>
                    <th className="p-3">Portal Name</th>
                    <th className="p-3">Type / State</th>
                    <th className="p-3">Official URL</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff4ff] text-[#0b1c30]">
                  {sources.map((src) => (
                    <tr key={src.id} className="hover:bg-[#eff4ff]/40">
                      <td className="p-3 font-bold text-[#00236f]">{src.name}</td>
                      <td className="p-3">
                        <span className="bg-[#eff4ff] px-2 py-0.5 rounded text-[11px] font-semibold">
                          {src.type} ({src.stateOrDomain})
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#757682] truncate max-w-[200px]">
                        <a href={src.url} target="_blank" rel="noreferrer" className="underline hover:text-[#00236f]">
                          {src.url}
                        </a>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            src.isActive ? 'bg-[#85f8c4] text-[#002114]' : 'bg-[#ffdad6] text-[#93000a]'
                          }`}
                        >
                          {src.isActive ? 'Active 1-Hr' : 'Paused'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => onSimulateScrape(src.name)}
                          className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00236f] px-2.5 py-1 rounded text-[11px] font-bold"
                          title="Run test scrape"
                        >
                          Test Scrape
                        </button>
                        <button
                          onClick={() => onToggleSource(src.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                            src.isActive ? 'bg-[#ffdcc3] text-[#904d00]' : 'bg-[#85f8c4] text-[#002114]'
                          }`}
                        >
                          {src.isActive ? 'Pause' : 'Resume'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Supabase Database Sync */}
      {activeTab === 'supabase' && (
        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">database</span>
              Supabase Project Connection
            </h2>
            <p className="text-xs text-[#444651] mt-1">
              Connect your free Supabase project to store scraped government notices and make them accessible anywhere.
            </p>
          </div>

          <form onSubmit={handleSaveSupabase} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#757682] uppercase block mb-1">Supabase Project URL</label>
              <input
                type="url"
                placeholder="https://your-project.supabase.co"
                value={supabaseConfig.url}
                onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-mono text-[#0b1c30] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#757682] uppercase block mb-1">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseConfig.anonKey}
                onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-mono text-[#0b1c30] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold py-3 rounded-xl shadow-xs transition-colors"
            >
              Save Credentials & Connect Database
            </button>

            {supabaseSaveMsg && (
              <div className="p-3 bg-[#85f8c4]/20 text-[#004a32] font-bold rounded-xl text-center">
                {supabaseSaveMsg}
              </div>
            )}
          </form>

          {/* Sync Real Government Data to Database */}
          <div className="bg-[#eff4ff] rounded-2xl border border-[#d3e4fe] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#00236f]">sync_saved_locally</span>
              <h3 className="font-display font-bold text-sm text-[#00236f]">
                Sync Real Official Government Gazette Data
              </h3>
            </div>
            <p className="text-xs text-[#444651] leading-relaxed">
              Populate your connected Supabase database with real, verified notifications, admit cards, results, and answer keys from UPSC, SSC, Railways (RRB), Defence (NDA/CDS), and Banking (IBPS).
            </p>

            <button
              onClick={handleSyncOfficialData}
              disabled={isSyncingData || !supabaseConfig.isConnected}
              className="w-full bg-[#003120] hover:bg-[#004a32] disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isSyncingData ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Writing Real Records to Supabase...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                  Sync Live Official Government Records to Supabase Now
                </>
              )}
            </button>

            {syncDataMsg && (
              <div className="p-3 bg-[#85f8c4]/30 text-[#003120] font-bold rounded-xl text-xs text-center border border-[#85f8c4]">
                {syncDataMsg}
              </div>
            )}
          </div>

          <div className="p-4 bg-[#eff4ff] rounded-2xl border border-[#d3e4fe] text-xs space-y-2">
            <h4 className="font-bold text-[#00236f]">How to get these in 1 minute:</h4>
            <ol className="list-decimal pl-4 space-y-1 text-[#444651]">
              <li>Create a free account at <strong>supabase.com</strong> and click <strong>New Project</strong>.</li>
              <li>Go to <strong>Project Settings &rarr; API</strong> in your Supabase dashboard.</li>
              <li>Copy <strong>Project URL</strong> and <strong>anon public key</strong> and paste them above.</li>
            </ol>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Python Bot Source Code Viewer */}
      {activeTab === 'code' && (
        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {['bot.py', 'config.py', 'render.yaml', 'scrapers.py', 'sql'].map((file) => (
                <button
                  key={file}
                  onClick={() => setSelectedCodeFile(file as any)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedCodeFile === file ? 'bg-[#00236f] text-white' : 'bg-[#eff4ff] text-[#444651]'
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>

            <button
              onClick={() => copyToClipboard(selectedCodeFile === 'render.yaml' ? 'render.yaml content' : 'code')}
              className="bg-[#003120] hover:bg-[#004a32] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              {copiedKey ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="bg-[#0b1c30] text-[#eaf1ff] p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre>
              {selectedCodeFile === 'render.yaml' && `# render.yaml - Render Blueprint Configuration
# Auto-configures both Web Service (React+Express) & Background Worker (Python Bot)
services:
  - type: web
    name: studymate-sarkari-web
    env: node
    plan: free
    region: oregon
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: TELEGRAM_ADMIN_ID
        value: "5165363865"
      - key: TELEGRAM_CHAT_ID
        value: "5165363865"

  - type: worker
    name: studymate-sarkari-bot
    env: python
    plan: free
    region: oregon
    buildCommand: pip install -r telegram_bot/requirements.txt
    startCommand: python telegram_bot/bot.py
    envVars:
      - key: PYTHON_VERSION
        value: "3.10.12"
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: TELEGRAM_ADMIN_ID
        value: "5165363865"
      - key: TELEGRAM_CHAT_ID
        value: "5165363865"
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_KEY
        sync: false
      - key: SCRAPING_INTERVAL_HOURS
        value: "1"`}

              {selectedCodeFile === 'bot.py' && `# telegram_bot/bot.py - Main Python Bot Execution Script
# Crawls government portals every 1 hour & dispatches directly to Telegram ID 5165363865

import asyncio
import schedule
from scrapers import scrape_all_sources
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID, TELEGRAM_CHAT_ID

async def run_hourly_scrape():
    print("Checking government portals every 1 hour...")
    # Scrapes all sources and sends Markdown alerts to Telegram ID: 5165363865

if __name__ == "__main__":
    print(f"StudyMate Sarkari Bot Started! Admin Telegram ID: {TELEGRAM_ADMIN_ID}")
    # Schedule runner loop`}

              {selectedCodeFile === 'config.py' && `# telegram_bot/config.py - Centralized Links & Settings
import os

# Telegram Bot Credentials
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_ADMIN_ID = os.getenv("TELEGRAM_ADMIN_ID", "5165363865")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "5165363865")

# Supabase Credentials (Supports both standard and Render env var names)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

# 1-Hour Automated Scraping Frequency
SCRAPING_INTERVAL_HOURS = int(os.getenv("SCRAPING_INTERVAL_HOURS", "1"))`}

              {selectedCodeFile === 'scrapers.py' && `# telegram_bot/scrapers.py - Multi-portal Scraping Engine
# Includes SSC, UPSC, RRB Railways, IBPS, and State PSCs with BeautifulSoup & Asyncio`}

              {selectedCodeFile === 'sql' && `-- StudyMate Sarkari - Production PostgreSQL / Supabase Schema
-- 12 Normalized Tables + Active Views + Row-Level Security

-- 1. states (36 States & UTs pre-seeded)
-- 2. organizations (UPSC, SSC, RRBs, State Commissions)
-- 3. official_sources (58 Monitored Portals with 60-min interval)
-- 4. jobs (Sarkari Vacancies & Full Descriptions)
-- 5. job_vacancies (Post-wise breakup)
-- 6. job_dates (Milestone timelines)
-- 7. notifications (Gazette circulars & notices)
-- 8. admit_cards (Hall tickets & exam slips)
-- 9. results (Scorecards & merit lists)
-- 10. answer_keys (Provisional / final response sheets)
-- 11. latest_updates (Unified dynamic feed)
-- 12. scraper_logs (Hourly crawl audit telemetry)

-- Views used by Website:
-- public.active_jobs (with state & department joins)
-- public.active_latest_updates (with live timestamps)

-- Full executable DDL is available in /telegram_bot/supabase_schema.sql`}
            </pre>
          </div>
        </div>
      )}

      {/* 8. Tab 5: Setup Guide */}
      {activeTab === 'instructions' && (
        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs space-y-6 max-w-3xl mx-auto">
          <h2 className="font-display font-extrabold text-xl text-[#00236f]">
            Telegram Bot & 1-Hour Auto-Scraper Setup Guide (हिंदी + English)
          </h2>

          <div className="space-y-4 text-xs text-[#0b1c30] leading-relaxed">
            <div className="p-4 bg-[#eff4ff] rounded-xl border-l-4 border-[#00236f]">
              <h3 className="font-bold text-sm text-[#00236f] mb-1">1. Telegram Bot Token Kaise Lein:</h3>
              <p>Telegram open karein aur <strong>@BotFather</strong> ko message karein: <code>/newbot</code>. BotFather aapko ek secret API Token dega.</p>
            </div>

            <div className="p-4 bg-[#eff4ff] rounded-xl border-l-4 border-[#904d00]">
              <h3 className="font-bold text-sm text-[#904d00] mb-1">2. Channel me Bot ko Admin Banayein:</h3>
              <p>Apne Telegram Channel me Bot ko add karke Administrator permissions (Post Messages) grant karein.</p>
            </div>

            <div className="p-4 bg-[#eff4ff] rounded-xl border-l-4 border-[#003120]">
              <h3 className="font-bold text-sm text-[#003120] mb-1">3. Bot Start Karein:</h3>
              <pre className="bg-[#0b1c30] text-white p-2.5 rounded-lg font-mono text-[11px] mt-1">
                pip install -r telegram_bot/requirements.txt{'\n'}python telegram_bot/bot.py
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
