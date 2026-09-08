import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { LatestJobsView } from './components/LatestJobsView';
import { JobDetailView } from './components/JobDetailView';
import { AdmitCardView } from './components/AdmitCardView';
import { ResultsView } from './components/ResultsView';
import { AnswerKeyView } from './components/AnswerKeyView';
import { StateWiseView } from './components/StateWiseView';
import { AllIndiaView } from './components/AllIndiaView';
import { ExamCalendarView } from './components/ExamCalendarView';
import { CandidateToolsView } from './components/CandidateToolsView';
import { TelegramBotDashboard } from './components/TelegramBotDashboard';
import { SavedJobsModal } from './components/SavedJobsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallPopup } from './components/PWAInstallPopup';
import { QuickCategoryBar } from './components/QuickCategoryBar';
import { PushNotificationModal } from './components/PushNotificationModal';
import { EligibilityMatcher } from './components/EligibilityMatcher';
import { StickyChannelBar } from './components/StickyChannelBar';

import {
  MOCK_JOBS,
  MOCK_ADMIT_CARDS,
  MOCK_RESULTS,
  MOCK_ANSWER_KEYS,
  MOCK_SOURCES,
  MOCK_BOT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';
import { JobItem, GovernmentSource, TelegramBotLog, PreVacancyNoticeItem } from './types';
import { supabaseService } from './services/supabaseService';
import { whatsAppService } from './services/whatsappService';
import { telegramService } from './services/telegramService';

export function App() {
  // Initialize Navigation State from URL hash or default
  const getInitialRoute = (): { tab: string; jobId: string | null } => {
    try {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        const [tabPart, queryPart] = hash.split('?');
        const params = new URLSearchParams(queryPart || '');
        const jId = params.get('id');
        return { tab: tabPart || 'home', jobId: jId || null };
      }
    } catch {
      // ignore
    }
    return { tab: 'home', jobId: null };
  };

  const initialRoute = getInitialRoute();
  const [activeTab, setActiveTab] = useState<string>(initialRoute.tab);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(initialRoute.jobId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  // Admin Mode State (Unlocked by secret code 'adminY n' or 'adminyn')
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('studymate_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  // Browser History & Back Navigation Synchronization
  useEffect(() => {
    // Set initial state in history
    const initialHash = '#' + activeTab + (selectedJobId ? `?id=${selectedJobId}` : '');
    window.history.replaceState({ tab: activeTab, jobId: selectedJobId }, '', initialHash);

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
        setSelectedJobId(event.state.jobId || null);
      } else {
        const hash = window.location.hash.replace(/^#/, '');
        if (hash) {
          const [tabPart, queryPart] = hash.split('?');
          const params = new URLSearchParams(queryPart || '');
          const jId = params.get('id');
          setActiveTab(tabPart || 'home');
          setSelectedJobId(jId || null);
        } else {
          setActiveTab('home');
          setSelectedJobId(null);
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Data State
  const [jobs, setJobs] = useState<JobItem[]>(MOCK_JOBS);
  const [admitCards, setAdmitCards] = useState(MOCK_ADMIT_CARDS);
  const [results, setResults] = useState(MOCK_RESULTS);
  const [answerKeys, setAnswerKeys] = useState(MOCK_ANSWER_KEYS);
  const [notifications, setNotifications] = useState<PreVacancyNoticeItem[]>(INITIAL_NOTIFICATIONS);
  const [sources, setSources] = useState<GovernmentSource[]>(MOCK_SOURCES);
  const [botLogs, setBotLogs] = useState<TelegramBotLog[]>(MOCK_BOT_LOGS);

  // Aspirant Zone / Bookmarked Jobs State (with local persistence)
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('studymate_bookmarked_jobs');
      return saved ? JSON.parse(saved) : ['ssc-cgl-2025', 'rrb-ntpc-2025'];
    } catch {
      return ['ssc-cgl-2025', 'rrb-ntpc-2025'];
    }
  });

  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('studymate_bookmarked_jobs', JSON.stringify(bookmarkedJobIds));
    } catch (e) {
      console.error(e);
    }
  }, [bookmarkedJobIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUnlockAdmin = () => {
    setIsAdmin(true);
    try {
      localStorage.setItem('studymate_admin_unlocked', 'true');
    } catch (e) {
      console.error(e);
    }
    showToast('👑 Admin Mode Unlocked! Telegram Bot & Scraper Control Active');
    setActiveTab('telegram-bot');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitAdmin = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem('studymate_admin_unlocked');
    } catch (e) {
      console.error(e);
    }
    showToast('🔒 Admin Mode Locked. Telegram Bot panel hidden from public.');
    if (activeTab === 'telegram-bot') {
      setActiveTab('home');
    }
  };

  // Load from Supabase on mount and periodic background sync (every 3 minutes)
  useEffect(() => {
    const loadSupabaseData = async () => {
      try {
        const [liveJobs, liveAdmitCards, liveResults, liveKeys, liveSources, liveLogs, liveNotifs] =
          await Promise.all([
            supabaseService.getJobs(),
            supabaseService.getAdmitCards(),
            supabaseService.getResults(),
            supabaseService.getAnswerKeys(),
            supabaseService.getSourcesAsync(),
            supabaseService.getBotLogsAsync(),
            supabaseService.getNotifications(),
          ]);

        if (liveJobs && liveJobs.length > 0) {
          setJobs(liveJobs);
          // Automatic 100% hands-free broadcast for new jobs with strict deduplication
          whatsAppService.autoBroadcastNewItems(liveJobs, 'JOB');
          telegramService.autoBroadcastNewItems(liveJobs, 'JOB');
        }
        if (liveAdmitCards && liveAdmitCards.length > 0) {
          setAdmitCards(liveAdmitCards);
          whatsAppService.autoBroadcastNewItems(liveAdmitCards, 'ADMIT_CARD');
          telegramService.autoBroadcastNewItems(liveAdmitCards, 'ADMIT_CARD');
        }
        if (liveResults && liveResults.length > 0) {
          setResults(liveResults);
          whatsAppService.autoBroadcastNewItems(liveResults, 'RESULT');
          telegramService.autoBroadcastNewItems(liveResults, 'RESULT');
        }
        if (liveKeys && liveKeys.length > 0) {
          setAnswerKeys(liveKeys);
          whatsAppService.autoBroadcastNewItems(liveKeys, 'ANSWER_KEY');
          telegramService.autoBroadcastNewItems(liveKeys, 'ANSWER_KEY');
        }
        if (liveNotifs && liveNotifs.length > 0) {
          setNotifications(liveNotifs);
        }
        if (liveSources && liveSources.length > 0) setSources(liveSources);
        if (liveLogs && liveLogs.length > 0) setBotLogs(liveLogs);
      } catch (err) {
        console.warn('Failed to load live data from Supabase', err);
      }
    };

    loadSupabaseData();
    const interval = setInterval(loadSupabaseData, 180000); // 3-minute background auto-sync loop
    return () => clearInterval(interval);
  }, []);

  const handleToggleBookmark = (jobId: string) => {
    setBookmarkedJobIds((prev) => {
      const exists = prev.includes(jobId);
      if (exists) {
        showToast('Bookmark removed from Aspirant Zone');
        return prev.filter((id) => id !== jobId);
      } else {
        showToast('✅ Job bookmarked! Saved in Aspirant Zone');
        return [...prev, jobId];
      }
    });
  };

  const handleNavigate = (tab: string, jobId?: string, pushHistory: boolean = true) => {
    setActiveTab(tab);
    if (jobId) {
      setSelectedJobId(jobId);
    } else if (tab !== 'job-detail') {
      setSelectedJobId(null);
    }

    if (pushHistory) {
      const url = '#' + tab + (jobId ? `?id=${jobId}` : '');
      window.history.pushState({ tab, jobId: jobId || null }, '', url);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('job-detail');
    const url = '#job-detail?id=' + jobId;
    window.history.pushState({ tab: 'job-detail', jobId }, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleNavigate('home');
    }
  };

  const handleSearchSubmit = (query: string) => {
    const trimmed = query.trim();
    if (/^adminy\s*n$/i.test(trimmed) || trimmed.toLowerCase() === 'adminyn') {
      handleUnlockAdmin();
      return;
    }
    setSearchQuery(query);
    setActiveTab('latest-jobs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddSource = (src: Omit<GovernmentSource, 'id' | 'itemsFoundCount' | 'lastStatus'>) => {
    const created = supabaseService.addSource(src);
    setSources(supabaseService.getSources());
    showToast(`Added ${created.name} to 1-hour scraping schedule!`);
  };

  const handleToggleSource = (id: string) => {
    const updated = supabaseService.toggleSource(id);
    setSources(updated);
  };

  const handleSimulateScrape = (sourceName: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog: TelegramBotLog = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      sourceName,
      messageType: 'SCRAPE_DISCOVERY',
      details: `[Hourly Crawler] Scraped ${sourceName} • 1 New Notification Discovered • Synced with Supabase & Dispatched to Telegram Channel @StudyMateSarkariLive`,
    };
    supabaseService.addBotLog(newLog);
    setBotLogs(supabaseService.getBotLogs());
    showToast(`⚡ Test Scrape Completed for ${sourceName}!`);
  };

  const currentJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];
  const savedJobsList = jobs.filter((j) => bookmarkedJobIds.includes(j.id));

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f7f9ff] dark:bg-[#080e18] text-[#0b1c30] dark:text-[#f1f5f9] antialiased selection:bg-[#00236f] selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00236f] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-white/20 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[#85f8c4] text-[18px]">info</span>
          {toastMessage}
        </div>
      )}

      {/* PWA Offline Network Indicator */}
      <OfflineIndicator />

      {/* Delayed 6-7 second PWA Install Popup */}
      <PWAInstallPopup />

      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onNavigate={handleNavigate}
        savedCount={bookmarkedJobIds.length}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        onOpenPushModal={() => setIsPushModalOpen(true)}
        onSearchSubmit={handleSearchSubmit}
        isAdmin={isAdmin}
        onUnlockAdmin={handleUnlockAdmin}
      />

      {/* Quick Category Bar (Feature 4 / Quick Access) */}
      <QuickCategoryBar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onOpenPushModal={() => setIsPushModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {activeTab === 'home' && (
          <HomeView
            jobs={jobs}
            admitCards={admitCards}
            results={results}
            answerKeys={answerKeys}
            onSelectJob={handleSelectJob}
            onNavigate={handleNavigate}
            onSearch={handleSearchSubmit}
            onSelectState={(st) => {
              setSearchQuery(st);
              setActiveTab('state-wise');
            }}
            onUnlockAdmin={handleUnlockAdmin}
          />
        )}

        {activeTab === 'latest-jobs' && (
          <LatestJobsView
            jobs={jobs}
            bookmarkedJobIds={bookmarkedJobIds}
            onToggleBookmark={handleToggleBookmark}
            onSelectJob={handleSelectJob}
            onNavigate={handleNavigate}
            initialSearchQuery={searchQuery}
          />
        )}

        {activeTab === 'job-detail' && (
          <JobDetailView
            job={currentJob}
            isSaved={bookmarkedJobIds.includes(currentJob.id)}
            onToggleBookmark={handleToggleBookmark}
            onBack={handleGoBack}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'admit-card' && (
          <AdmitCardView admitCards={admitCards} onNavigate={handleNavigate} />
        )}

        {activeTab === 'results' && (
          <ResultsView results={results} onNavigate={handleNavigate} />
        )}

        {activeTab === 'answer-key' && (
          <AnswerKeyView answerKeys={answerKeys} onNavigate={handleNavigate} />
        )}

        {activeTab === 'state-wise' && (
          <StateWiseView jobs={jobs} onSelectJob={handleSelectJob} onNavigate={handleNavigate} />
        )}

        {activeTab === 'all-india' && (
          <AllIndiaView jobs={jobs} onSelectJob={handleSelectJob} onNavigate={handleNavigate} />
        )}

        {activeTab === 'exam-calendar' && (
          <ExamCalendarView onNavigate={handleNavigate} notifications={notifications} />
        )}

        {activeTab === 'candidate-tools' && (
          <CandidateToolsView jobs={jobs} onNavigate={handleNavigate} />
        )}

        {activeTab === 'eligibility-matcher' && (
          <div className="space-y-4">
            <nav className="flex items-center gap-2 text-xs text-[#757682] dark:text-[#94a3b8]">
              <button
                onClick={() => handleNavigate('home')}
                className="hover:text-[#00236f] dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">home</span> Home
              </button>
              <span>/</span>
              <span className="text-[#0b1c30] dark:text-white font-bold">AI Eligibility Matcher</span>
            </nav>
            <EligibilityMatcher jobs={jobs} onSelectJob={handleSelectJob} />
          </div>
        )}

        {activeTab === 'telegram-bot' && (
          <TelegramBotDashboard
            sources={sources}
            botLogs={botLogs}
            jobs={jobs}
            admitCards={admitCards}
            results={results}
            answerKeys={answerKeys}
            onAddSource={handleAddSource}
            onToggleSource={handleToggleSource}
            onSimulateScrape={handleSimulateScrape}
            onNavigate={handleNavigate}
            onExitAdmin={handleExitAdmin}
          />
        )}
      </main>

      {/* Saved Jobs Modal */}
      <SavedJobsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedJobs={savedJobsList}
        onRemoveBookmark={handleToggleBookmark}
        onSelectJob={handleSelectJob}
      />

      {/* Push Notification & Telegram Alert Modal (Feature 1 / Header Bell) */}
      <PushNotificationModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
      />

      {/* Sticky Channel & Breaking Alerts Bar */}
      {activeTab !== 'job-detail' && <StickyChannelBar />}

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} isAdmin={isAdmin} />
    </div>
  );
}

export default App;
