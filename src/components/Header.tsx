import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

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
  isAdmin?: boolean;
  onUnlockAdmin?: () => void;
  onExitAdmin?: () => void;
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
  isAdmin = false,
  onUnlockAdmin,
  onExitAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { isDarkMode, toggleDarkMode, theme, setTheme } = useTheme();

  const selectedTab = activeTab || currentTab || 'home';
  const bookmarksCount = savedCount !== undefined ? savedCount : (savedJobsCount || 0);

  const checkSecretAdminCode = (text: string) => {
    const trimmed = text.trim();
    if (/^adminy\s*n$/i.test(trimmed) || trimmed.toLowerCase() === 'adminyn') {
      if (onUnlockAdmin) {
        onUnlockAdmin();
      }
      return true;
    }
    return false;
  };

  const handleQueryChange = (q: string) => {
    if (checkSecretAdminCode(q)) {
      if (onSearchChange) onSearchChange('');
      return;
    }
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
    ...(isAdmin ? [{ id: 'telegram-bot', label: '👑 Admin: Telegram Bot & Scraper', highlight: true }] : []),
  ];

  const handleNavClick = (tabId: string) => {
    onNavigate(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 left-0 w-full z-40 bg-[#ffffff] dark:bg-[#070e1e] shadow-[0_1px_8px_rgba(0,0,0,0.04)] font-sans border-b border-[#eff4ff] dark:border-[#1e324c]">
      {/* 1. Topmost Live Marquee Ticker Bar */}
      <div className="bg-[#ffdcc3] dark:bg-[#2d1a04] text-[#2f1500] dark:text-[#fed7aa] text-[11px] font-bold px-3 sm:px-4 md:px-6 py-1.5 flex items-center justify-between border-b border-[#ffb77d]/30 dark:border-[#7c2d12]/40 w-full">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 w-full min-w-0">
            <span className="bg-[#904d00] text-white px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider flex-shrink-0 flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              Live Updates
            </span>
            <div className="overflow-hidden whitespace-nowrap text-[#2f1500] dark:text-[#fed7aa] flex-1 min-w-0">
              <p className="inline-block animate-marquee pl-4 text-xs font-semibold">
                UPSC Civil Services 2025 Prelims Admit Card Released • SSC CGL 2025 (17,727 Posts) Apply Online Closes 24 July • Railway RRB NTPC (11,558 Posts) Notification Out • IBPS PO XV Online Form Active
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 flex-shrink-0 pl-4 text-[11px]">
            <a
              href="https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z"
              target="_blank"
              rel="noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-[#002114] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs transition-all hover:scale-105 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">chat</span>
              <span>Join WhatsApp Channel</span>
            </a>
            <span className="text-[#c5c5d3] dark:text-[#475569]">|</span>
            <span className="font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">support_agent</span> Toll-Free: 1800-SM-SARKARI
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Brand & Search Bar Header */}
      <div className="h-16 sm:h-20 bg-[#ffffff] dark:bg-[#070e1e] border-b border-[#eff4ff] dark:border-[#1e324c] w-full">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform border border-[#38bdf8]/40 bg-[#070e1e] flex items-center justify-center p-0.5 flex-shrink-0">
              <img
                src="/logo.png"
                alt="StudyMate Sarkari Official Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-[18px] sm:text-[22px] md:text-[24px] text-[#00236f] dark:text-white leading-tight tracking-tight">
                StudyMate<span className="text-[#904d00] dark:text-[#fb923c]">Sarkari</span>
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-[#444651] dark:text-[#94a3b8] uppercase tracking-wider flex items-center gap-1">
                Govt. Career Gateway <span className="w-1 h-1 rounded-full bg-[#003120] dark:bg-[#4ade80]"></span> 100% Official
              </span>
            </div>
          </div>

          {/* Central Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg lg:max-w-xl mx-2 min-w-0">
            <div className="w-full relative flex items-center bg-[#eff4ff] dark:bg-[#0f172a] hover:bg-[#e5eeff] dark:hover:bg-[#1e293b] focus-within:bg-[#ffffff] dark:focus-within:bg-[#070e1e] focus-within:ring-2 focus-within:ring-[#00236f] dark:focus-within:ring-[#38bdf8] rounded-xl px-3 py-1.5 transition-all shadow-inner border border-transparent dark:border-[#1e324c]">
              <span className="material-symbols-outlined text-[#757682] dark:text-[#94a3b8] mr-2 text-[20px]">search</span>
              <input
                className="w-full bg-transparent text-sm text-[#0b1c30] dark:text-white placeholder:text-[#757682] dark:placeholder:text-[#64748b] focus:outline-none"
                placeholder="Search jobs, exams, results, admit cards..."
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  handleQueryChange(e.target.value);
                  if (selectedTab !== 'latest-jobs' && e.target.value.trim().length > 0 && !/^adminy\s*n$/i.test(e.target.value)) {
                    onNavigate('latest-jobs');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (checkSecretAdminCode(searchQuery)) {
                      e.preventDefault();
                    }
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => handleQueryChange('')}
                  className="text-xs text-[#757682] dark:text-[#94a3b8] hover:text-[#0b1c30] dark:hover:text-white mr-1"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* Admin Fast Badge Link - Admin Only */}
            {isAdmin && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleNavClick('telegram-bot')}
                  className="inline-flex items-center gap-1.5 bg-[#fe932c] hover:bg-[#ff840b] text-[#2f1500] text-xs font-black px-2.5 sm:px-3 py-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] border border-amber-400"
                  title="Admin Control: Bot Management & Scraper"
                >
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  <span className="hidden sm:inline">Admin Bot</span>
                </button>
                {onExitAdmin && (
                  <button
                    onClick={onExitAdmin}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline px-1"
                    title="Lock Admin Mode"
                  >
                    Lock
                  </button>
                )}
              </div>
            )}

            {/* Dark Mode Toggle Switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 sm:p-2 text-[#444651] dark:text-[#94a3b8] hover:text-[#0b1c30] dark:hover:text-white rounded-xl hover:bg-[#eff4ff] dark:hover:bg-[#101b2c] transition-all flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-[#d3e4fe] dark:hover:border-[#1e324c]"
              type="button"
              aria-label="Toggle dark mode"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className={`material-symbols-outlined text-[20px] sm:text-[22px] transition-transform duration-300 ${isDarkMode ? 'text-[#fbbf24] rotate-90' : 'text-[#00236f]'}`}>
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
                className="relative p-1.5 sm:p-2 text-[#444651] dark:text-[#94a3b8] hover:text-[#0b1c30] dark:hover:text-white rounded-xl hover:bg-[#eff4ff] dark:hover:bg-[#101b2c] transition-colors"
                type="button"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-[22px] sm:text-[24px]">notifications</span>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white dark:ring-[#070e1e] animate-pulse"></span>
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#101b2c] rounded-2xl shadow-xl border border-[#eff4ff] dark:border-[#1e324c] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#eff4ff] dark:border-[#1e324c]">
                    <span className="font-bold text-xs text-[#0b1c30] dark:text-white uppercase">Latest Alerts</span>
                    <span className="text-[10px] bg-[#dce1ff] dark:bg-[#1e3a8a] text-[#00164e] dark:text-[#93c5fd] font-bold px-1.5 py-0.5 rounded">3 New</span>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 text-xs">
                    <div
                      onClick={() => {
                        setNotificationOpen(false);
                        onNavigate('admit-card');
                      }}
                      className="p-2 bg-[#eff4ff] dark:bg-[#070e1e] hover:bg-[#dce9ff] dark:hover:bg-[#1e293b] rounded-xl cursor-pointer transition-colors"
                    >
                      <p className="font-bold text-[#00236f] dark:text-[#93c5fd]">UPSC CSE 2025 Prelims Admit Card Out</p>
                      <p className="text-[11px] text-[#444651] dark:text-[#94a3b8]">Direct hall ticket download server live.</p>
                    </div>
                    <div
                      onClick={() => {
                        setNotificationOpen(false);
                        onNavigate('job-detail', 'ssc-cgl-2025');
                      }}
                      className="p-2 bg-[#eff4ff] dark:bg-[#070e1e] hover:bg-[#dce9ff] dark:hover:bg-[#1e293b] rounded-xl cursor-pointer transition-colors"
                    >
                      <p className="font-bold text-[#904d00] dark:text-[#fb923c]">SSC CGL 2025 Registration Ending</p>
                      <p className="text-[11px] text-[#444651] dark:text-[#94a3b8]">Only 3 days left for 17,727 posts.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Aspirant Zone / Saved Jobs Button */}
            <div
              onClick={onOpenSavedModal}
              className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-3 border-l border-[#c5c5d3] dark:border-[#1e324c] cursor-pointer group flex-shrink-0"
              title="View Bookmarked & Saved Jobs"
            >
              <div className="w-8 h-8 rounded-full bg-[#dce1ff] dark:bg-[#1e3a8a] text-[#00236f] dark:text-[#93c5fd] flex items-center justify-center font-bold text-xs shadow-inner">
                {bookmarksCount > 0 ? (
                  <span className="font-black">{bookmarksCount}</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">bookmark</span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[13px] font-bold text-[#0b1c30] dark:text-white leading-none group-hover:text-[#00236f] dark:group-hover:text-[#93c5fd]">
                  Aspirant Zone
                </span>
                <span className="text-[11px] text-[#444651] dark:text-[#94a3b8] leading-tight flex items-center gap-0.5">
                  Saved ({bookmarksCount}) <span className="material-symbols-outlined text-[13px]">expand_more</span>
                </span>
              </div>
            </div>

            {/* Mobile Menu Toggle Button (Three Lines ☰ Always Clear & Visible) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 text-[#00236f] dark:text-[#60a5fa] hover:bg-[#eff4ff] dark:hover:bg-[#101b2c] rounded-xl flex items-center justify-center border border-[#d3e4fe] dark:border-[#1e324c] flex-shrink-0 ml-1 transition-all active:scale-95"
              aria-label="Toggle navigation menu"
              title="Navigation Menu (Three Lines)"
            >
              <span className="material-symbols-outlined text-[24px] sm:text-[26px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sticky Primary Category Navigation Bar */}
      <div className="bg-[#eff4ff] dark:bg-[#0b1424] shadow-[0_1px_4px_rgba(0,0,0,0.02)] border-b border-[#d3e4fe]/50 dark:border-[#1e324c]/60 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto py-1.5 whitespace-nowrap scrollbar-none w-full">
            {navItems.map((item) => {
              const isActive = selectedTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs md:text-[13px] font-bold transition-all duration-150 flex items-center gap-1 shrink-0 ${
                    isActive
                      ? 'bg-[#00236f] dark:bg-[#2563eb] text-white shadow-sm'
                      : item.highlight
                      ? 'bg-[#fe932c] text-[#2f1500] font-black'
                      : 'text-[#444651] dark:text-[#cbd5e1] hover:text-[#0b1c30] dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#1e293b]'
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
        <div className="lg:hidden bg-white dark:bg-[#101b2c] border-b border-[#eff4ff] dark:border-[#1e324c] shadow-xl px-4 py-3 max-h-[75vh] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          {/* Mobile Dark Mode Switcher Row */}
          <div className="mb-3 p-2.5 rounded-xl bg-[#eff4ff] dark:bg-[#070e1e] flex items-center justify-between border border-[#d3e4fe]/60 dark:border-[#1e324c]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0b1c30] dark:text-white">
              <span className="material-symbols-outlined text-[20px] text-[#00236f] dark:text-[#60a5fa]">
                {isDarkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <span>Theme: {isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className="flex items-center gap-1 bg-white dark:bg-[#101b2c] p-1 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTheme('light')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                  theme === 'light' ? 'bg-[#00236f] text-white' : 'text-[#444651] dark:text-[#94a3b8]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">light_mode</span> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                  theme === 'dark' ? 'bg-[#00236f] text-white' : 'text-[#444651] dark:text-[#94a3b8]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">dark_mode</span> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                  theme === 'system' ? 'bg-[#00236f] text-white' : 'text-[#444651] dark:text-[#94a3b8]'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          <div className="mb-3">
            <div className="relative flex items-center bg-[#eff4ff] dark:bg-[#070e1e] rounded-xl px-3 py-2 border border-[#d3e4fe] dark:border-[#1e324c]">
              <span className="material-symbols-outlined text-[#757682] dark:text-[#94a3b8] mr-2 text-[20px]">search</span>
              <input
                className="w-full bg-transparent text-sm text-[#0b1c30] dark:text-white placeholder:text-[#757682] dark:placeholder:text-[#64748b] focus:outline-none"
                placeholder="Search jobs or type adminY n..."
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  handleQueryChange(e.target.value);
                  if (selectedTab !== 'latest-jobs' && !/^adminy\s*n$/i.test(e.target.value)) {
                    onNavigate('latest-jobs');
                  }
                }}
              />
            </div>
          </div>

          <div className="mb-3">
            <a
              href="https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-[#002114] font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-sm text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Join Official WhatsApp Channel (Instant Alerts)</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  selectedTab === item.id
                    ? 'bg-[#00236f] dark:bg-[#2563eb] text-white'
                    : item.highlight
                    ? 'bg-[#fe932c] text-[#2f1500] font-black'
                    : 'bg-[#eff4ff] dark:bg-[#070e1e] text-[#0b1c30] dark:text-[#cbd5e1] hover:bg-[#dce9ff] dark:hover:bg-[#1e293b]'
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
