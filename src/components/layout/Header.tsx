import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  MapPin,
  FileCheck,
  Award,
  Key,
  Bell,
  Building2,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Latest Jobs', path: '/jobs' },
    { name: 'Central Jobs', path: '/jobs/central' },
    { name: 'State Jobs', path: '/jobs/states' },
    { name: 'Admit Card', path: '/admit-card' },
    { name: 'Results', path: '/results' },
    { name: 'Answer Key', path: '/answer-key' },
    { name: 'Updates', path: '/updates' },
  ];

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-18 gap-4">
          {/* Brand Logo & Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
            onClick={handleMobileNavClick}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-display">
                  StudyMate
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 font-display">
                  Sarkari
                </span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-wide font-medium hidden sm:block">
                Govt Jobs, Results & Exam Updates
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-white bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Header Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Button */}
            <Link
              to="/search"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 text-xs transition-all"
              aria-label="Search jobs"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Quick Search</span>
            </Link>

            {/* Notification Indicator Placeholder (Step 1 requirement) */}
            <Link
              to="/updates"
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-cyan-400 hover:border-slate-600 transition-colors"
              aria-label="Important updates"
              title="Recent recruitment updates"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (When hamburger menu is opened) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0f1c] border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-xs font-semibold text-slate-400 px-2 uppercase tracking-wider mb-2">
            Portal Navigation
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={handleMobileNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`
                }
              >
                <span>{link.name}</span>
              </NavLink>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-2">
            <Link to="/about" onClick={handleMobileNavClick} className="hover:text-cyan-400">
              About Portal
            </Link>
            <span>•</span>
            <Link to="/contact" onClick={handleMobileNavClick} className="hover:text-cyan-400">
              Contact & Feedback
            </Link>
            <span>•</span>
            <span className="text-cyan-400 font-semibold">Data Layer Active</span>
          </div>
        </div>
      )}
    </header>
  );
};
