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

import {
  MOCK_JOBS,
  MOCK_ADMIT_CARDS,
  MOCK_RESULTS,
  MOCK_ANSWER_KEYS,
  MOCK_SOURCES,
  MOCK_BOT_LOGS,
} from './data/mockData';
import { JobItem, GovernmentSource, TelegramBotLog } from './types';
import { supabaseService } from './services/supabaseService';

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [jobs, setJobs] = useState<JobItem[]>(MOCK_JOBS);
  const [admitCards, setAdmitCards] = useState(MOCK_ADMIT_CARDS);
  const [results, setResults] = useState(MOCK_RESULTS);
  const [answerKeys, setAnswerKeys] = useState(MOCK_ANSWER_KEYS);
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

  // Load from Supabase on mount if configured
  useEffect(() => {
    const loadSupabaseData = async () => {
      try {
        const [liveJobs, liveAdmitCards, liveResults, liveKeys, liveSources, liveLogs] =
          await Promise.all([
            supabaseService.getJobs(),
            supabaseService.getAdmitCards(),
            supabaseService.getResults(),
            supabaseService.getAnswerKeys(),
            supabaseService.getSourcesAsync(),
            supabaseService.getBotLogsAsync(),
          ]);

        if (liveJobs && liveJobs.length > 0) setJobs(liveJobs);
        if (liveAdmitCards && liveAdmitCards.length > 0) setAdmitCards(liveAdmitCards);
        if (liveResults && liveResults.length > 0) setResults(liveResults);
        if (liveKeys && liveKeys.length > 0) setAnswerKeys(liveKeys);
        if (liveSources && liveSources.length > 0) setSources(liveSources);
        if (liveLogs && liveLogs.length > 0) setBotLogs(liveLogs);
      } catch (err) {
        console.warn('Failed to load live data from Supabase', err);
      }
    };
    loadSupabaseData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  const handleNavigate = (tab: string, jobId?: string) => {
    setActiveTab(tab);
    if (jobId) {
      setSelectedJobId(jobId);
    } else if (tab !== 'job-detail') {
      setSelectedJobId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('job-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (query: string) => {
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
    <div className="min-h-screen flex flex-col bg-[#f7f9ff] dark:bg-[#080e18] text-[#0b1c30] dark:text-[#f1f5f9] antialiased selection:bg-[#00236f] selection:text-white transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00236f] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-white/20 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[#85f8c4] text-[18px]">info</span>
          {toastMessage}
        </div>
      )}

      {/* PWA Offline Network Indicator */}
      <OfflineIndicator />

      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onNavigate={handleNavigate}
        savedCount={bookmarkedJobIds.length}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        onSearchSubmit={handleSearchSubmit}
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
            onBack={() => handleNavigate('latest-jobs')}
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
          <ExamCalendarView onNavigate={handleNavigate} />
        )}

        {activeTab === 'candidate-tools' && (
          <CandidateToolsView onNavigate={handleNavigate} />
        )}

        {activeTab === 'telegram-bot' && (
          <TelegramBotDashboard
            sources={sources}
            botLogs={botLogs}
            onAddSource={handleAddSource}
            onToggleSource={handleToggleSource}
            onSimulateScrape={handleSimulateScrape}
            onNavigate={handleNavigate}
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

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
