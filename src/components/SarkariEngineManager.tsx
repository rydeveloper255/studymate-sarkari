import React, { useState, useEffect } from 'react';
import {
  sarkariPipelineService,
  ScrapedNotice,
  OfficialPortalSource,
  DomHashWatcher,
  SentinelLinkReport,
  LiveTrafficStats,
} from '../services/sarkariPipelineService';

export const SarkariEngineManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'sources' | 'dom_watchers' | 'pdf_parser' | 'sentinel' | 'bot_commands' | 'banner' | 'traffic'>('queue');
  const [queue, setQueue] = useState<ScrapedNotice[]>([]);
  const [sources, setSources] = useState<OfficialPortalSource[]>([]);
  const [domWatchers, setDomWatchers] = useState<DomHashWatcher[]>([]);
  const [sentinelReports, setSentinelReports] = useState<SentinelLinkReport[]>([]);
  const [trafficStats, setTrafficStats] = useState<LiveTrafficStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // PDF Parser State
  const [rawNoticeInput, setRawNoticeInput] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);

  // Banner State
  const [selectedNoticeForBanner, setSelectedNoticeForBanner] = useState<ScrapedNotice | null>(null);
  const [copiedBannerText, setCopiedBannerText] = useState(false);

  // Ticker State
  const [tickerText, setTickerText] = useState('🚨 Railway RRB NTPC 2026 Notification Out for 11,558 Posts | SSC CGL Tier-1 Results Declared');
  const [tickerActive, setTickerActive] = useState(true);
  const [tickerSpeed, setTickerSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [qData, sData, dData, senData, tData] = await Promise.all([
        sarkariPipelineService.getScrapedQueue(),
        sarkariPipelineService.getOfficialSources(),
        sarkariPipelineService.getDomWatchers(),
        sarkariPipelineService.getSentinelHealth(),
        sarkariPipelineService.getTrafficStats(),
      ]);
      setQueue(qData);
      setSources(sData);
      setDomWatchers(dData);
      setSentinelReports(senData);
      setTrafficStats(tData);
      if (qData.length > 0 && !selectedNoticeForBanner) {
        setSelectedNoticeForBanner(qData[0]);
      }
    } catch {
      setActionMsg({ text: 'Error fetching pipeline data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleApprove = async (id: string, broadcast = false) => {
    try {
      const res = await sarkariPipelineService.approveNotice(id, broadcast);
      if (res.success) {
        setActionMsg({
          text: broadcast
            ? '✅ Notice approved, published to website & broadcasted to Telegram!'
            : '✅ Notice approved and published live to studymatesarkari.in!',
          type: 'success',
        });
        fetchAllData();
      }
    } catch (err: any) {
      setActionMsg({ text: `Failed to approve: ${err.message}`, type: 'error' });
    }
  };

  const handleDiscard = async (id: string) => {
    try {
      const res = await sarkariPipelineService.discardNotice(id);
      if (res.success) {
        setActionMsg({ text: '🗑️ Notice discarded from pending queue', type: 'info' });
        fetchAllData();
      }
    } catch (err: any) {
      setActionMsg({ text: `Failed to discard: ${err.message}`, type: 'error' });
    }
  };

  const handleTriggerScraper = async () => {
    setLoading(true);
    try {
      const res = await sarkariPipelineService.triggerManualScrape();
      if (res.success) {
        setActionMsg({ text: `⚡ Live crawl completed! Found ${res.newItemsFound} new official notices.`, type: 'success' });
        fetchAllData();
      }
    } catch (err: any) {
      setActionMsg({ text: `Scrape failed: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleParseNotice = async () => {
    if (!rawNoticeInput.trim()) return;
    try {
      const res = await sarkariPipelineService.parseRawNotice(rawNoticeInput);
      setParsedResult(res.parsed);
      setActionMsg({ text: '✅ PDF text successfully analyzed and parsed!', type: 'success' });
    } catch (err: any) {
      setActionMsg({ text: `Parse error: ${err.message}`, type: 'error' });
    }
  };

  const handleUpdateTicker = async () => {
    try {
      const res = await sarkariPipelineService.updateBreakingTicker(tickerText, tickerActive, tickerSpeed);
      if (res.success) {
        setActionMsg({ text: '🚨 Website breaking ticker updated live!', type: 'success' });
      }
    } catch (err: any) {
      setActionMsg({ text: `Ticker update failed: ${err.message}`, type: 'error' });
    }
  };

  const handleCleanExpired = async () => {
    try {
      const res = await sarkariPipelineService.cleanExpiredJobs();
      if (res.success) {
        setActionMsg({ text: `🧹 Cleaned up ${res.archivedCount} expired posts. Database refreshed.`, type: 'success' });
        fetchAllData();
      }
    } catch (err: any) {
      setActionMsg({ text: `Cleanup error: ${err.message}`, type: 'error' });
    }
  };

  const pendingQueueCount = queue.filter((q) => q.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: SarkariResult Scale Engine */}
      <div className="bg-gradient-to-br from-[#0a192f] via-[#0f2d59] to-[#00236f] rounded-3xl p-6 md:p-8 text-white shadow-xl border border-blue-400/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              SarkariResult-Level Architecture Active
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
              Central & State Automated Scraping + Mobile Bot Hub ⚡
            </h2>
            <p className="text-blue-100/90 text-sm md:text-base leading-relaxed">
              Real-time ingestion engine that continuously monitors UPSC, SSC, RRB, IBPS, and State PSCs with sha256 DOM change detection, instant PDF parsing, and 1-tap Telegram Bot approval.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-3 shrink-0 w-full lg:w-auto">
            <div className="bg-black/30 border border-blue-300/30 p-4 rounded-2xl backdrop-blur-md text-center min-w-[130px]">
              <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">Pending Review</span>
              <span className="font-display font-black text-3xl text-amber-400 block my-0.5">
                {pendingQueueCount}
              </span>
              <span className="text-[11px] text-white/70">Notices in Queue</span>
            </div>

            <div className="bg-black/30 border border-blue-300/30 p-4 rounded-2xl backdrop-blur-md text-center min-w-[130px]">
              <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">Live Visitors</span>
              <span className="font-display font-black text-3xl text-emerald-400 block my-0.5">
                {trafficStats?.activeRealTimeVisitors || 154}
              </span>
              <span className="text-[11px] text-white/70">Active Right Now</span>
            </div>

            <button
              onClick={handleTriggerScraper}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 shrink-0 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
                sync
              </span>
              Run Live Scrape
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold transition-all ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : actionMsg.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : 'bg-blue-50 text-blue-900 border border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              {actionMsg.type === 'success' ? 'check_circle' : actionMsg.type === 'error' ? 'error' : 'info'}
            </span>
            <span>{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto scrollbar-none">
        {[
          { id: 'queue', label: `Approval Queue (${pendingQueueCount})`, icon: 'inbox', badge: pendingQueueCount },
          { id: 'sources', label: 'Official Source Roster', icon: 'account_balance' },
          { id: 'dom_watchers', label: 'DOM Change Detection', icon: 'track_changes' },
          { id: 'pdf_parser', label: 'PDF Notice Auto-Summarizer', icon: 'description' },
          { id: 'bot_commands', label: 'Telegram Bot Commands Menu', icon: 'smart_toy' },
          { id: 'banner', label: 'Social Media Banner Generator', icon: 'palette' },
          { id: 'sentinel', label: 'Broken Link Sentinel', icon: 'shield' },
          { id: 'traffic', label: 'Traffic & Ticker Controls', icon: 'speed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: APPROVAL QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-display font-bold text-lg text-[#00236f] flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">rate_review</span>
                Scraped Official Notices Ingestion Queue
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                New vacancies, results, and admit cards scraped from government portals. Review and publish with 1-tap.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAllData}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Refresh
              </button>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <span className="material-symbols-outlined text-5xl text-emerald-500">task_alt</span>
              <h4 className="font-bold text-lg text-slate-800">All Notices Reviewed & Published!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no pending scraped items. Click the &ldquo;Run Live Scrape&rdquo; button above to check UPSC, SSC, and State PSC portals for new updates right now.
              </p>
              <button
                onClick={handleTriggerScraper}
                className="mt-2 bg-[#00236f] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-900 cursor-pointer"
              >
                Crawl Official Portals Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-5 md:p-6 border transition-all ${
                    item.status === 'APPROVED'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : item.status === 'DISCARDED'
                      ? 'border-slate-200 opacity-60'
                      : 'border-slate-300 shadow-sm hover:border-blue-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                          📍 {item.state}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {item.sourcePortal}
                        </span>
                        <span className="text-[11px] text-slate-400">Detected: {item.detectedAt}</span>
                      </div>

                      <h4 className="font-display font-bold text-base md:text-lg text-slate-900 leading-snug">
                        {item.title}
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Vacancies</span>
                          <span className="font-bold text-slate-800 text-sm">{item.vacancies}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Date</span>
                          <span className="font-bold text-rose-600 text-sm">{item.importantDates.lastDate}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Qualification</span>
                          <span className="font-bold text-slate-800 truncate block">{item.qualification}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Application Fee</span>
                          <span className="font-bold text-slate-800">Gen: {item.applicationFee.general_obc}</span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 underline underline-offset-2"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          View Official Link ({item.sourceUrl})
                        </a>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                      {item.status === 'PENDING_REVIEW' ? (
                        <>
                          <button
                            onClick={() => handleApprove(item.id, false)}
                            className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            Approve & Live
                          </button>
                          <button
                            onClick={() => handleApprove(item.id, true)}
                            className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">send</span>
                            Publish & Broadcast
                          </button>
                          <button
                            onClick={() => handleDiscard(item.id)}
                            className="flex-1 lg:flex-none bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Discard
                          </button>
                        </>
                      ) : item.status === 'APPROVED' ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-100 px-3 py-2 rounded-xl">
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          Live on Website
                        </div>
                      ) : (
                        <div className="text-slate-400 font-bold text-xs bg-slate-100 px-3 py-2 rounded-xl">
                          Discarded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: OFFICIAL SOURCES ROSTER */}
      {activeSubTab === 'sources' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="font-display font-bold text-lg text-[#00236f] flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">account_balance</span>
              Government Portals Scraping Roster (Pan-India)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Automated crawlers configured for major Central examination commissions and State Public Service Commissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((src) => (
              <div key={src.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                    {src.tier}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {src.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-display font-bold text-base text-slate-900">{src.name}</h4>
                  <a
                    href={`https://${src.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline font-mono"
                  >
                    {src.domain}
                  </a>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Endpoint:</span>
                    <span className="font-mono text-[11px] truncate max-w-[170px]">{src.whatsNewEndpoint}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Check Interval:</span>
                    <span className="font-bold text-slate-700">{src.checkInterval}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Indexed:</span>
                    <span className="font-bold text-emerald-600">{src.totalNoticesIndexed} Notices</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Last Scraped: {src.lastScraped}</span>
                  <span className="text-emerald-600 font-bold">100% Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DOM HASH WATCHERS */}
      {activeSubTab === 'dom_watchers' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="font-display font-bold text-lg text-[#00236f] flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">track_changes</span>
              Real-time DOM Hash Change Sentinel
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Computes cryptographic SHA-256 hashes of the &ldquo;What&rsquo;s New&rdquo; HTML containers. If the commission alters even one character or posts a new link, an alert fires instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domWatchers.map((watcher) => (
              <div key={watcher.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-base text-slate-900">{watcher.portalName}</h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      watcher.changeStatus === 'NEW_NOTICE_DETECTED'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {watcher.changeStatus === 'NEW_NOTICE_DETECTED' ? '🚨 Delta Detected' : '🟢 Up to Date'}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 font-mono text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="truncate">
                    <span className="text-slate-400">URL: </span>
                    {watcher.targetUrl}
                  </div>
                  <div>
                    <span className="text-slate-400">Selector: </span>
                    {watcher.targetSelector}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    <span>SHA-256: </span>
                    {watcher.lastHash}
                  </div>
                </div>

                {watcher.detectedDelta && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">notifications_active</span>
                      Extracted Change:
                    </span>
                    <p className="font-medium">{watcher.detectedDelta}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Last Checked: {watcher.lastChecked}</span>
                  <span className="text-blue-600 font-semibold">Watching 24/7</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PDF NOTICE PARSER */}
      {activeSubTab === 'pdf_parser' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="font-display font-bold text-lg text-[#00236f] flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">description</span>
                Multi-Format Official PDF & Text Auto-Summarizer
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Paste official notification text or press sample to test automated extraction of Vacancies, Qualification, Fee, Age Limit, and Key Dates.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Official Notice Content</label>
                <button
                  onClick={() =>
                    setRawNoticeInput(
                      `Union Public Service Commission Examination Notice No. 04/2026-CSP. Civil Services Examination 2026. The number of vacancies to be filled through the examination is expected to be approximately 1,105. Candidates must apply online by 18-Nov-2026 up to 18:00 Hours. Minimum Educational Qualification: A candidate must hold a Graduate degree from any recognized University. Age Limits: A candidate must have attained the age of 21 years and must not have attained the age of 32 years. Application Fee: Candidates are required to pay a fee of Rs. 100/- for General/OBC; Female/SC/ST/PwBD candidates are exempted from payment of fee.`
                    )
                  }
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Fill UPSC Sample Notice
                </button>
              </div>

              <textarea
                value={rawNoticeInput}
                onChange={(e) => setRawNoticeInput(e.target.value)}
                rows={5}
                placeholder="Paste notification text from official PDF, gazette or advertisement here..."
                className="w-full p-4 rounded-xl border border-slate-300 text-xs md:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleParseNotice}
                className="bg-[#00236f] hover:bg-blue-900 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                Extract & Structure Data
              </button>
            </div>
          </div>

          {parsedResult && (
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-display font-bold text-base">
                <span className="material-symbols-outlined">check_circle</span>
                Successfully Parsed Government Parameters
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Detected Vacancies</span>
                  <span className="font-bold text-slate-800 text-sm">{parsedResult.vacancies}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Extracted Last Date</span>
                  <span className="font-bold text-rose-600 text-sm">{parsedResult.lastDate}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Minimum Qualification</span>
                  <span className="font-bold text-slate-800 text-sm">{parsedResult.qualification}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Age Bracket</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {parsedResult.ageLimit.min} to {parsedResult.ageLimit.max}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">General / OBC Fee</span>
                  <span className="font-bold text-slate-800 text-sm">{parsedResult.applicationFee.general_obc}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">SC / ST / PH Fee</span>
                  <span className="font-bold text-slate-800 text-sm">{parsedResult.applicationFee.sc_st_ph}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: BOT COMMANDS ROSTER */}
      {activeSubTab === 'bot_commands' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-lg text-[#00236f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">smart_toy</span>
                  Telegram Native [/] Menu Registered Commands
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  All these commands are registered with Telegram API using <code>setMyCommands</code>. They show up natively in the mobile app chat bar without needing to remember syntax.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live on Telegram Mobile
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { cmd: '/start', title: 'Admin Master Panel', desc: 'Opens the full interactive mobile dashboard with action buttons', category: 'Core' },
              { cmd: '/queue', title: '1-Tap Approval Queue', desc: 'Review scraped official notices and publish live or broadcast with 1 tap', category: 'Scraper' },
              { cmd: '/postjob', title: 'Interactive Job Wizard', desc: '5-step conversational guide to add jobs without typing syntax', category: 'Content' },
              { cmd: '/managejobs', title: 'Manage & Delete Jobs', desc: 'View all active vacancies, delete posts, or broadcast to channel', category: 'Content' },
              { cmd: '/banner', title: 'Social Media Graphic Banner', desc: 'Generates ready-to-share posters and channel copy text', category: 'Social' },
              { cmd: '/analyzepdf', title: 'PDF Notice Auto-Summarizer', desc: 'Extracts vacancies, age, qualification, fee and dates automatically', category: 'Scraper' },
              { cmd: '/ticker', title: 'Breaking Marquee Controller', desc: 'Update or toggle the live alert bar running on website top', category: 'Ops' },
              { cmd: '/broadcast', title: 'Multi-Channel Alert', desc: 'Push urgent updates to Telegram Channel, WhatsApp & Web Push', category: 'Broadcast' },
              { cmd: '/traffic', title: 'Real-Time Visitors', desc: 'Check current live online visitors, daily pageviews & top jobs', category: 'Analytics' },
              { cmd: '/expired', title: 'Scan & Clean Expired Jobs', desc: 'Finds past-deadline vacancies and archives them cleanly', category: 'Ops' },
              { cmd: '/sentinel', title: 'Broken Link Sentinel', desc: 'Diagnoses all portal application links to ensure 0 dead links', category: 'Health' },
              { cmd: '/export', title: 'Instant JSON Data Backup', desc: 'Export complete website database for backup and disaster recovery', category: 'Ops' },
              { cmd: '/newadmit', title: 'Add Admit Card Link', desc: 'Syntax: /newadmit Title | Official Link', category: 'Quick' },
              { cmd: '/newresult', title: 'Add Exam Result Link', desc: 'Syntax: /newresult Title | Official Link', category: 'Quick' },
              { cmd: '/newkey', title: 'Add Answer Key Link', desc: 'Syntax: /newkey Title | Official Link', category: 'Quick' },
              { cmd: '/newsyllabus', title: 'Add Syllabus Link', desc: 'Syntax: /newsyllabus Title | Official Link', category: 'Quick' },
              { cmd: '/maintenance', title: 'Emergency Maintenance', desc: 'Toggle website maintenance mode on/off instantly', category: 'Ops' },
              { cmd: '/help', title: 'Full Cheatsheet Guide', desc: 'Displays all commands and syntax directly in Telegram chat', category: 'Core' },
            ].map((item) => (
              <div key={item.cmd} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <code className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-mono font-black">
                    {item.cmd}
                  </code>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.category}
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: SOCIAL MEDIA BANNER GENERATOR */}
      {activeSubTab === 'banner' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="font-display font-bold text-lg text-[#00236f] flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">palette</span>
              Instant Social Media Banner Poster Generator
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select any live vacancy to generate a graphic poster optimized for Telegram channels, WhatsApp groups, and Instagram stories.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Banner Preview */}
            <div className="bg-gradient-to-br from-[#00236f] via-[#093582] to-[#1e40af] p-6 md:p-8 rounded-3xl text-white shadow-xl space-y-5 relative overflow-hidden border border-blue-400/30">
              <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <span className="font-display font-black text-lg tracking-wider text-amber-300">
                  STUDYMATE SARKARI 🇮🇳
                </span>
                <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse">
                  NEW RECRUITMENT LIVE
                </span>
              </div>

              <div className="space-y-2 py-2">
                <span className="text-blue-200 text-xs font-bold uppercase tracking-wider block">
                  {selectedNoticeForBanner?.department || 'Government of India'}
                </span>
                <h3 className="font-display font-black text-xl md:text-2xl text-white leading-tight">
                  {selectedNoticeForBanner?.title || 'Railway RRB NTPC 2026 Recruitment Online Form'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-black/30 p-4 rounded-2xl border border-white/10 text-xs">
                <div>
                  <span className="text-white/60 block text-[10px] uppercase font-bold">Total Posts</span>
                  <span className="font-black text-amber-400 text-base md:text-lg">
                    {selectedNoticeForBanner?.vacancies || '11,558'} Posts
                  </span>
                </div>
                <div>
                  <span className="text-white/60 block text-[10px] uppercase font-bold">Last Date</span>
                  <span className="font-black text-rose-300 text-base md:text-lg">
                    {selectedNoticeForBanner?.importantDates?.lastDate || '24-Oct-2026'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-blue-100/80">
                <span className="font-bold">Apply at: studymatesarkari.in</span>
                <span className="bg-white/20 px-2 py-1 rounded text-[11px] font-mono">1200 x 630 HD</span>
              </div>
            </div>

            {/* Banner Copy Text and Controls */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-display font-bold text-base text-slate-800">
                One-Click Telegram / WhatsApp Formatted Text
              </h4>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
{`🚨 NEW SARKARI RECRUITMENT 2026 LIVE 🇮🇳
━━━━━━━━━━━━━━━━━━━━━
📌 ${selectedNoticeForBanner?.title || 'Railway RRB NTPC 2026 Recruitment'}
🎯 Total Vacancies: ${selectedNoticeForBanner?.vacancies || '11,558'} Posts
📅 Last Date to Apply: ${selectedNoticeForBanner?.importantDates?.lastDate || '24-Oct-2026'}
🎓 Qualification: ${selectedNoticeForBanner?.qualification || 'Graduate / 12th Pass'}
🔗 Apply Online Link: https://studymatesarkari.in

📲 Join Official Telegram Channel:
https://t.me/studymatesarkari`}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const text = `🚨 NEW SARKARI RECRUITMENT 2026 LIVE 🇮🇳\n📌 ${selectedNoticeForBanner?.title || 'Railway Recruitment'}\n🎯 Vacancies: ${selectedNoticeForBanner?.vacancies || '11,558'}\n📅 Last Date: ${selectedNoticeForBanner?.importantDates?.lastDate || '24-Oct-2026'}\n🔗 Link: https://studymatesarkari.in`;
                    navigator.clipboard.writeText(text);
                    setCopiedBannerText(true);
                    setTimeout(() => setCopiedBannerText(false), 2000);
                  }}
                  className="bg-[#00236f] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  {copiedBannerText ? 'Copied!' : 'Copy Formatted Text'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: SENTINEL LINK HEALTH */}
      {activeSubTab === 'sentinel' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="font-display font-bold text-lg text-[#00236f] flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">shield</span>
              Broken Link Sentinel & Latency Auditor
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Continuously tests all application and notification links on the site. If a server returns 404/500, you receive an instant alert on Telegram.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sentinelReports.map((report) => (
              <div key={report.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 truncate max-w-[280px]">
                    {report.title}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      report.healthy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    HTTP {report.httpStatus} {report.healthy ? 'OK' : 'FAIL'}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-500 truncate">{report.url}</div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>Latency: <strong className="text-slate-700">{report.responseTimeMs}ms</strong></span>
                  <span>Checked: {report.checkedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 8: TRAFFIC & CONTROLS */}
      {activeSubTab === 'traffic' && (
        <div className="space-y-6">
          {/* Breaking News Ticker Manager */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-[#00236f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600">campaign</span>
                  Website Breaking News Marquee Controller
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Controls the live scrolling ticker at the very top of the portal. Also controllable via <code>/ticker</code> in Telegram.
                </p>
              </div>
              <button
                onClick={() => setTickerActive(!tickerActive)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tickerActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {tickerActive ? '🟢 Live on Site' : '🔴 Disabled'}
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={tickerText}
                onChange={(e) => setTickerText(e.target.value)}
                placeholder="Type breaking headline..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Scroll Speed:</span>
                  {(['slow', 'normal', 'fast'] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setTickerSpeed(spd)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                        tickerSpeed === spd ? 'bg-[#00236f] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {spd}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleUpdateTicker}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Publish Ticker
                </button>
              </div>
            </div>
          </div>

          {/* Database Export & Cleanup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600">delete_sweep</span>
                Expired Jobs Auto-Archive
              </h4>
              <p className="text-xs text-slate-500">
                Scans all live vacancies for past deadlines and cleanly moves them to the archive collection.
              </p>
              <button
                onClick={handleCleanExpired}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
                Run Cleanup Routine
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">download</span>
                Full Database JSON Backup
              </h4>
              <p className="text-xs text-slate-500">
                Download a complete verified snapshot of all jobs, admit cards, and results. Also available via <code>/export</code>.
              </p>
              <a
                href="/api/export-database"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#00236f] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-center"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_download</span>
                Download Database Snapshot
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
