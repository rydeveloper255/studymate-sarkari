import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  MapPin,
  FileCheck,
  Award,
  Key,
  BellRing,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateWebsiteSchema, generateOrganizationSchema } from '../lib/seo/structuredData';
import { QuickSearchBar } from '../components/search/QuickSearchBar';
import { JobAlertBanner } from '../components/notifications/JobAlertBanner';
import { VacancyCard } from '../components/cards/VacancyCard';
import { StateCard } from '../components/cards/StateCard';
import { UpdateCard } from '../components/cards/UpdateCard';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import {
  fetchFeaturedJobs,
  fetchLatestUpdates,
  fetchAllStates,
  fetchJobStats,
} from '../lib/data';
import { isSupabaseConfigured } from '../lib/supabase';
import { JobVacancy, StateInfo, GovernmentUpdate } from '../types';

export const HomePage: React.FC = () => {
  const [stateZoneFilter, setStateZoneFilter] = useState<string>('all');
  const [stateSearch, setStateSearch] = useState<string>('');

  const [featuredJobs, setFeaturedJobs] = useState<JobVacancy[]>([]);
  const [homeUpdates, setHomeUpdates] = useState<GovernmentUpdate[]>([]);
  const [allStates, setAllStates] = useState<StateInfo[]>([]);
  const [stats, setStats] = useState<{
    totalActive: number;
    centralCount: number;
    stateCount: number;
    closingSoonCount: number;
  }>({
    totalActive: 0,
    centralCount: 0,
    stateCount: 0,
    closingSoonCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [jobs, updates, states, jobStats] = await Promise.all([
          fetchFeaturedJobs(6),
          fetchLatestUpdates(4),
          fetchAllStates(),
          fetchJobStats(),
        ]);
        if (isMounted) {
          setFeaturedJobs(jobs);
          setHomeUpdates(updates);
          setAllStates(states);
          setStats(jobStats);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Quick Category items
  const quickCategories = [
    {
      title: 'Latest Jobs',
      description: 'Central & state notifications',
      path: '/jobs',
      icon: Briefcase,
      color: 'from-blue-600 to-indigo-600',
      badge: `${stats.totalActive || 'Active'} Vacancies`,
    },
    {
      title: 'Central Jobs',
      description: 'UPSC, SSC, Railway, Bank, Defence',
      path: '/jobs/central',
      icon: Building2,
      color: 'from-indigo-600 to-purple-600',
      badge: `${stats.centralCount || 'All'} Central`,
    },
    {
      title: 'State Jobs',
      description: '28 States & 8 UT recruitments',
      path: '/jobs/states',
      icon: MapPin,
      color: 'from-purple-600 to-pink-600',
      badge: '36 States / UTs',
    },
    {
      title: 'Admit Cards',
      description: 'Exam city slips & hall tickets',
      path: '/admit-card',
      icon: FileCheck,
      color: 'from-cyan-600 to-blue-600',
      badge: 'Hall Tickets',
    },
    {
      title: 'Results',
      description: 'Declared lists & scorecards',
      path: '/results',
      icon: Award,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Scorecards',
    },
    {
      title: 'Answer Keys',
      description: 'Provisional & final keys',
      path: '/answer-key',
      icon: Key,
      color: 'from-amber-600 to-orange-600',
      badge: 'Objection Window',
    },
  ];

  // Filtered states for state section
  const filteredStates = allStates.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
      item.code.toLowerCase().includes(stateSearch.toLowerCase()) ||
      item.capital.toLowerCase().includes(stateSearch.toLowerCase());

    const matchesZone =
      stateZoneFilter === 'all' ||
      (stateZoneFilter === 'states' && item.type === 'state') ||
      (stateZoneFilter === 'ut' && item.type === 'ut') ||
      item.zone.toLowerCase() === stateZoneFilter.toLowerCase();

    return matchesSearch && matchesZone;
  });

  return (
    <div className="space-y-12 sm:space-y-16">
      <MetaTags
        title="StudyMate Sarkari — Latest Government Jobs, Admit Cards & Results 2026"
        description="All India Central & State Government Jobs Portal. Check authentic recruitment notifications, online application forms, admit cards, answer keys, cutoff marks, and exam results."
        canonicalPath="/"
        schemaJson={[generateWebsiteSchema(), generateOrganizationSchema()]}
      />

      {/* 1. HERO & SEARCH SECTION */}
      <section className="relative rounded-3xl p-6 sm:p-10 md:p-12 overflow-hidden bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-[#0b101d] border border-slate-800/90 shadow-2xl">
        {/* Glow & Backdrop accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>StudyMate Sarkari Portal</span>
            <span className="text-slate-500">•</span>
            {isSupabaseConfigured ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Database className="w-3 h-3" /> Supabase Connected
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                Step 2 Data Layer Ready
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-display">
            Find Government Jobs & Exam Updates
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
            Central and State Government vacancies, admit cards, results and important updates in one place.
          </p>

          {/* Large Hero Search Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <QuickSearchBar placeholder="Search jobs, exams, organizations..." />
          </div>
        </div>
      </section>

      {/* Tailored Job Alert Preference Banner */}
      <JobAlertBanner />

      {/* 2. QUICK CATEGORY CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Explore Categories
            </h2>
          </div>
          <span className="text-xs text-slate-400">Direct Portal Navigation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                to={cat.path}
                className="group relative p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors font-display mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="text-cyan-400 font-semibold">{cat.badge}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. LATEST JOBS SECTION */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Latest Government Vacancies
              </h2>
              {isSupabaseConfigured && (
                <Badge variant="success">Supabase Live</Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Current active recruitment notifications across central ministries and state commissions
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-slate-800 transition-colors self-start sm:self-auto"
          >
            <span>View All Latest Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingState label="Loading latest vacancies from data layer..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredJobs.map((job, idx) => (
              <VacancyCard key={job.id || idx} job={job} featured={idx === 0} />
            ))}
          </div>
        )}
      </section>

      {/* 4. STATE-WISE GOVERNMENT JOBS (ALL 28 STATES + 8 UTS) */}
      <section className="space-y-5 bg-gradient-to-b from-slate-900/40 to-slate-950/40 rounded-3xl p-6 sm:p-8 border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                State-Wise Government Jobs
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Explore public service commissions and recruitment vacancies across 28 States and 8 Union Territories
            </p>
          </div>

          {/* State search filter */}
          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                placeholder="Find state or UT..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Zone Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { label: 'All (36)', value: 'all' },
            { label: '28 States', value: 'states' },
            { label: '8 UTs', value: 'ut' },
            { label: 'Northern', value: 'northern' },
            { label: 'Southern', value: 'southern' },
            { label: 'Eastern', value: 'eastern' },
            { label: 'Western', value: 'western' },
            { label: 'Central', value: 'central' },
            { label: 'North-Eastern', value: 'north-eastern' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStateZoneFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                stateZoneFilter === tab.value
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* State Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredStates.slice(0, 12).map((state) => (
            <StateCard key={state.code} state={state} />
          ))}
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/jobs/states"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-all"
          >
            <span>View Complete Directory of All 36 States & UTs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 5. IMPORTANT UPDATES & NOTICES SECTION */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Important Recruitment Updates
              </h2>
              <Badge variant="info">Real-time Data Layer</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Chronological feed of admit card alerts, answer keys, results, and exam schedule notices
            </p>
          </div>

          <Link
            to="/updates"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-semibold border border-slate-800 transition-colors self-start sm:self-auto"
          >
            <span>View All Updates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <LoadingState label="Loading exam notices..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeUpdates.map((update) => (
              <UpdateCard key={update.id} update={update} />
            ))}
          </div>
        )}
      </section>

      {/* 6. TRUST & BRAND VALUES SECTION */}
      <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-purple-950/40 border border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3 mx-auto sm:mx-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Verified Notifications</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every job listing traces back to official government gazettes, state recruitment commissions, and official portal URLs.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3 mx-auto sm:mx-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Real-Time Alerts</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant alerts for release of admit cards, answer key challenge windows, and final result declarations.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-3 mx-auto sm:mx-0">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white font-display">All-India Coverage</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seamless access to central ministries and dedicated sub-portals for all 28 states and 8 union territories.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
