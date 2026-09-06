import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';

export interface HeaderProps {
  currentTab?: string;
  activeTab?: string;
  onNavigate: (tab: string, jobId?: string) => void;
  savedJobsCount?: number;
  savedCount?: number;
  onOpenSavedModal: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  onOpenBotModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeTab,
  onNavigate,
  savedJobsCount,
  savedCount,
  onOpenSavedModal,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { isDarkMode, toggleDarkMode, theme, setTheme } = useTheme();

  const selectedTab = activeTab || currentTab || 'home';
  const bookmarksCount = savedCount !== undefined ? savedCount : (savedJobsCount || 0);

  const handleQueryChange = (q: string) => {
    if (onSearchChange) onSearchChange(q);
    if (onSearchSubmit) onSearchSubmit(q);
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'latest-jobs', label: 'Latest Jobs' },
    { id: 'admit-card', label: 'Admit Card' },
    { id: 'results', label: 'Results' },
    { id: 'answer-key', label: 'Answer Key' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'state-wise', label: 'State Wise' },
    { id: 'all-india', label: 'All India' },
    { id: 'exam-calendar', label: 'Exam Calendar' },
    { id: 'candidate-tools', label: 'Candidate Tools' },
    { id: 'telegram-bot', label: '🤖 Telegram Bot & Scraper', highlight: true },
  ];

  const handleNavClick = (tabId: string) => {
    onNavigate(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#ffffff] shadow-[0_1px_8px_rgba(0,0,0,0.04)] font-sans">
      {/* 1. Topmost Live Marquee Ticker Bar */}
      <div className="bg-[#ffdcc3] text-[#2f1500] text-[11px] font-bold px-4 md:px-6 py-1.5 flex items-center justify-between border-b border-[#ffb77d]/30">
        <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 w-full">
            <span className="bg-[#904d00] text-white px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider flex-shrink-0 flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              Live Updates
            </span>
            <div className="overflow-hidden whitespace-nowrap text-[#2f1500] flex-1">
              <p className="inline-block animate-marquee pl-4 text-xs font-semibold">
                UPSC Civil Services 2025 Prelims Admit Card Released • SSC CGL 2025 (17,727 Posts) Apply Online Closes 24 July • Railway RRB NTPC (11,558 Posts) Notification Out • IBPS PO XV Online Form Active • Telegram Bot Scraper Syncing Portals Every 1 Hr
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 flex-shrink-0 pl-4 text-[11px]">
            <span className="text-[#6e3900]">Govt Exam Alert Service</span>
            <span className="text-[#c5c5d3]">|</span>
            <span className="font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">support_agent</span> Toll-Free: 1800-SM-SARKARI
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Brand & Search Bar Header */}
      <div className="h-20 bg-[#ffffff] border-b border-[#eff4ff]">
        <div className="max-w-[1280px] mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4 md:gap-6">
          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 flex-shrink-0 cursor-pointer select-none group"
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform border border-[#38bdf8]/40 bg-[#070e1e] flex items-center justify-center p-0.5">
              <img
                src="/logo.png"
                alt="StudyMate Sarkari Official Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-[22px] md:text-[24px] text-[#00236f] leading-tight tracking-tight">
                StudyMate<span className="text-[#904d00]">Sarkari</span>
              </span>
              <span className="text-[10px] md:text-[11px] font-bold text-[#444651] uppercase tracking-wider flex items-center gap-1">
                Govt. Career Gateway <span className="w-1 h-1 rounded-full bg-[#003120]"></span> 100% Official
              </span>
            </div>
          </div>

          {/* Central Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-2">
            <div className="w-full relative flex items-center bg-[#eff4ff] hover:bg-[#e5eeff] focus-within:bg-[#ffffff] focus-within:ring-2 focus-within:ring-[#00236f] rounded-xl px-3 py-1.5 transition-all shadow-inner">
              <span className="material-symbols-outlined text-[#757682] mr-2 text-[20px]">search</span>
              <input
                className="w-full bg-transparent text-sm text-[#0b1c30] placeholder:text-[#757682] focus:outline-none"
                placeholder="Search jobs, exams, results, admit cards, states..."
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  handleQueryChange(e.target.value);
                  if (selectedTab !== 'latest-jobs' && e.target.value.trim().length > 0) {
                    onNavigate('latest-jobs');
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => handleQueryChange('')}
                  className="text-xs text-[#757682] hover:text-[#0b1c30] mr-1"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
              <span className="material-symbols-outlined text-[#757682] hover:text-[#0b1c30] cursor-pointer text-[18px]">
                tune
              </span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* PWA App Install Button */}
            <PWAInstallButton variant="nav" />

            {/* Telegram Fast Badge Link */}
            <button
              onClick={() => handleNavClick('telegram-bot')}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#003120] hover:bg-[#004a32] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02]"
              title="Open Bot Management & Instructions"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Telegram Bot</span>
            </button>

            {/* Dark Mode Toggle Switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-[#444651] hover:text-[#0b1c30] rounded-xl hover:bg-[#eff4ff] transition-all flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-[#d3e4fe]"
              type="button"
              aria-label="Toggle dark mode"
              title={isDarkMode ? 'Switch to Light Mode (Din)' : 'Switch to Dark Mode (Raat)'}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${isDarkMode ? 'text-[#fbbf24] rotate-90' : 'text-[#00236f]'}`}>
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden xl:inline text-[11px] font-bold">
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* Notifications Alert Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 text-[#444651] hover:text-[#0b1c30] rounded-full hover:bg-[#eff4ff] transition-colors"
                type="button"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white animate-pulse"></span>
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#eff4ff] p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#eff4ff]">
                    <span className="font-bold text-xs text-[#0b1c30] uppercase">Latest Alerts</span>
                    <span className="text-[10px] bg-[#dce1ff] text-[#00164e] font-bold px-1.5 py-0.5 rounded">3 New</span>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 text-xs">
                    <div
                      onClick={() => {
                        setNotificationOpen(false);
                        onNavigate('admit-card');
                      }}
                      className="p-2 bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg cursor-pointer transition-colors"
                    >
                      <p className="font-bold text-[#00236f]">UPSC CSE 2025 Prelims Admit Card Out</p>
                      <p className="text-[11px] text-[#444651]">Direct hall ticket download server live.</p>
                    </div>
                    <div
                      onClick={() => {
                        setNotificationOpen(false);
                        onNavigate('job-detail', 'ssc-cgl-2025');
                      }}
                      className="p-2 bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg cursor-pointer transition-colors"
                    >
                      <p className="font-bold text-[#904d00]">SSC CGL 2025 Registration Ending</p>
                      <p className="text-[11px] text-[#444651]">Only 3 days left for 17,727 posts.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Aspirant Zone / Saved Jobs Button */}
            <div
              onClick={onOpenSavedModal}
              className="flex items-center gap-2 pl-2 md:pl-3 border-l border-[#c5c5d3] cursor-pointer group"
              title="View Bookmarked & Saved Jobs"
            >
              <div className="w-8 h-8 rounded-full bg-[#dce1ff] text-[#00236f] flex items-center justify-center font-bold text-xs shadow-inner">
                {bookmarksCount > 0 ? (
                  <span className="text-[#00236f] font-black">{bookmarksCount}</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">bookmark</span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[13px] font-bold text-[#0b1c30] leading-none group-hover:text-[#00236f]">
                  Aspirant Zone
                </span>
                <span className="text-[11px] text-[#444651] leading-tight flex items-center gap-0.5">
                  Saved ({bookmarksCount}) <span className="material-symbols-outlined text-[13px]">expand_more</span>
                </span>
              </div>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#444651] hover:text-[#0b1c30] rounded-lg hover:bg-[#eff4ff]"
              aria-label="Toggle navigation"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sticky Primary Category Navigation Bar */}
      <div className="bg-[#eff4ff] shadow-[0_1px_4px_rgba(0,0,0,0.02)] border-b border-[#d3e4fe]/50">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto py-1.5 whitespace-nowrap scrollbar-none">
            {navItems.map((item) => {
              const isActive = selectedTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs md:text-[13px] font-bold transition-all duration-150 flex items-center gap-1 shrink-0 ${
                    isActive
                      ? 'bg-[#00236f] text-white shadow-sm'
                      : item.highlight
                      ? 'bg-[#003120]/10 text-[#003120] hover:bg-[#003120] hover:text-white font-extrabold'
                      : 'text-[#444651] hover:text-[#0b1c30] hover:bg-white/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#eff4ff] shadow-lg px-4 py-3 max-h-[75vh] overflow-y-auto">
          {/* Mobile PWA Install Row */}
          <div className="mb-3">
            <PWAInstallButton variant="mobile" />
          </div>

          {/* Mobile Dark Mode Switcher Row */}
          <div className="mb-3 p-2.5 rounded-xl bg-[#eff4ff] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0b1c30]">
              <span className="material-symbols-outlined text-[20px] text-[#00236f]">
                {isDarkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <span>Theme: {isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg shadow-xs">
              <button
                onClick={() => setTheme('light')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                  theme === 'light' ? 'bg-[#00236f] text-white' : 'text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">light_mode</span> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                  theme === 'dark' ? 'bg-[#00236f] text-white' : 'text-[#444651]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">dark_mode</span> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                  theme === 'system' ? 'bg-[#00236f] text-white' : 'text-[#444651]'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          <div className="mb-3">
            <input
              className="w-full bg-[#eff4ff] text-sm text-[#0b1c30] placeholder:text-[#757682] px-3 py-2 rounded-lg"
              placeholder="Search jobs, exams..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                handleQueryChange(e.target.value);
                if (selectedTab !== 'latest-jobs') {
                  onNavigate('latest-jobs');
                }
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  selectedTab === item.id
                    ? 'bg-[#00236f] text-white'
                    : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
