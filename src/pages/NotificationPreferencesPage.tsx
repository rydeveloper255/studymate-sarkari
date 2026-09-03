import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  Search,
  Sparkles,
  ShieldCheck,
  Compass,
  Train,
  Siren,
  Landmark,
  Building2,
  Shield,
  GraduationCap,
  Factory,
  Mail,
  HeartPulse,
  Scale,
  Layers,
  MapPin,
  Send,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  ArrowRight,
  Briefcase,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { VacancyCard } from '../components/cards/VacancyCard';
import { useNotificationPreferences } from '../lib/notifications/NotificationContext';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRESETS } from '../data/notificationOptions';
import { ALL_STATES_AND_UTS } from '../data/statesData';
import { fetchJobs } from '../lib/data';
import { JobVacancy } from '../types';
import { filterJobsByPreferences } from '../lib/notifications/userNotificationService';

export const NotificationPreferencesPage: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    permissionState,
    requestPermission,
    sendTestAlert,
  } = useNotificationPreferences();

  const [allJobs, setAllJobs] = useState<JobVacancy[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [stateSearch, setStateSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [testAlertLoading, setTestAlertLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Fetch jobs for the live preview matching feed
  useEffect(() => {
    let isMounted = true;
    setIsLoadingJobs(true);
    fetchJobs({ pageSize: 50, sortBy: 'latest' })
      .then((res) => {
        if (isMounted) {
          setAllJobs(res.data);
        }
      })
      .catch((err) => {
        console.error('Error fetching jobs for notification preview:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingJobs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live matched jobs based on user preferences
  const matchedJobs = useMemo(() => {
    return filterJobsByPreferences(allJobs, preferences);
  }, [allJobs, preferences]);

  // Category Icon helper
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'compass': return <Compass className="w-4 h-4" />;
      case 'train': return <Train className="w-4 h-4" />;
      case 'siren': return <Siren className="w-4 h-4" />;
      case 'landmark': return <Landmark className="w-4 h-4" />;
      case 'building': return <Building2 className="w-4 h-4" />;
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'graduation-cap': return <GraduationCap className="w-4 h-4" />;
      case 'factory': return <Factory className="w-4 h-4" />;
      case 'mail': return <Mail className="w-4 h-4" />;
      case 'heart-pulse': return <HeartPulse className="w-4 h-4" />;
      case 'scale': return <Scale className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  // Filtered States list
  const filteredStates = useMemo(() => {
    return ALL_STATES_AND_UTS.filter((state) => {
      const matchesSearch =
        state.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
        state.code.toLowerCase().includes(stateSearch.toLowerCase());
      const matchesZone = selectedZone === 'All' || state.zone === selectedZone;
      return matchesSearch && matchesZone;
    });
  }, [stateSearch, selectedZone]);

  const zones = ['All', 'Northern', 'Southern', 'Eastern', 'Western', 'Central', 'North-Eastern', 'UT'];

  // Toggle category
  const toggleCategory = (catId: string) => {
    const current = new Set(preferences.categories);
    if (current.has(catId)) {
      current.delete(catId);
    } else {
      current.add(catId);
    }
    updatePreferences({ categories: Array.from(current) });
  };

  const selectAllCategories = () => {
    updatePreferences({ categories: NOTIFICATION_CATEGORIES.map((c) => c.id) });
  };

  const clearCategories = () => {
    updatePreferences({ categories: [] });
  };

  // Toggle state
  const toggleState = (code: string) => {
    const current = new Set(preferences.states);
    if (current.has(code)) {
      current.delete(code);
    } else {
      current.add(code);
    }
    updatePreferences({ states: Array.from(current) });
  };

  const toggleAllIndia = () => {
    const current = new Set(preferences.states);
    if (current.has('ALL')) {
      current.delete('ALL');
    } else {
      current.add('ALL');
    }
    updatePreferences({ states: Array.from(current) });
  };

  const selectAllStates = () => {
    const allCodes = ['ALL', ...ALL_STATES_AND_UTS.map((s) => s.code)];
    updatePreferences({ states: allCodes });
  };

  const clearStates = () => {
    updatePreferences({ states: ['ALL'] });
  };

  // Apply Preset
  const applyPreset = (preset: typeof NOTIFICATION_PRESETS[0]) => {
    updatePreferences({
      categories: preset.categories,
      states: preset.states,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Trigger test alert
  const handleTestAlert = async () => {
    setTestAlertLoading(true);
    setTestResult(null);
    try {
      const res = await sendTestAlert();
      setTestResult(res.message);
    } catch {
      setTestResult('Alert sent. Check in-app toast preview.');
    } finally {
      setTestAlertLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <MetaTags
        title="Customized Job Alerts & Notification Preferences | StudyMate Sarkari"
        description="Select your preferred government job exam categories and target states to receive tailored browser push notifications and real-time alerts as soon as official vacancies are released."
        canonicalUrl="/notifications"
      />

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Tailored Job Alerts
            </span>
            <span className="text-xs text-slate-400">Browser & In-App Alerts</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
            Notification Preferences & Alerts
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Customize your alerts so you only receive notices for exam boards, recruitments, and states relevant to your preparation.
          </p>

          {/* Quick Stat Pill Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span><strong>{preferences.categories.length}</strong> Categories Selected</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{preferences.states.includes('ALL') ? 'All India Active' : `${preferences.states.length} States Selected`}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              <span><strong>{matchedJobs.length}</strong> Live Matching Vacancies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left side configuration, Right side live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Preference Selectors (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Browser Push Permission Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    permissionState === 'granted'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : permissionState === 'denied'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Browser Push Notifications:</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        permissionState === 'granted'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : permissionState === 'denied'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {permissionState === 'granted'
                        ? 'Active & Enabled'
                        : permissionState === 'denied'
                        ? 'Blocked in Browser'
                        : 'Permission Required'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {permissionState === 'granted'
                      ? 'Push notifications are active. You will receive immediate alerts even if you do not have this site open in a tab.'
                      : permissionState === 'denied'
                      ? 'Notifications are blocked in your browser. Click the site permissions icon in your browser URL bar to allow notifications.'
                      : 'Click below to allow notifications on this browser. No personal information or email is required.'}
                  </p>
                </div>
              </div>

              {permissionState !== 'granted' && permissionState !== 'denied' && (
                <button
                  type="button"
                  onClick={requestPermission}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex-shrink-0"
                >
                  Enable Push Alerts
                </button>
              )}
            </div>
          </div>

          {/* 2. Quick Presets */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Popular Aspirant Presets
              </span>
              <span className="text-[11px] text-slate-500">1-click setup</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NOTIFICATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-left border border-slate-800/80 transition-all hover:border-slate-700 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {preset.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{preset.tagline}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Job Categories Multi-Select */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Target Exam Categories ({preferences.categories.length} Selected)
                </h3>
                <p className="text-[11px] text-slate-400">Toggle the exams and recruitment boards you want alerts for</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllCategories}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={clearCategories}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {NOTIFICATION_CATEGORIES.map((cat) => {
                const isSelected = preferences.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/60 text-white shadow-sm'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {renderCategoryIcon(cat.iconName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{cat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{cat.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Target Geographic Regions & States */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Target Geographic Regions & States
                </h3>
                <p className="text-[11px] text-slate-400">
                  {preferences.states.includes('ALL') ? 'All India Active' : `${preferences.states.length} States Selected`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllStates}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  All States
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={clearStates}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Reset (All India)
                </button>
              </div>
            </div>

            {/* All India Toggle Card */}
            <button
              type="button"
              onClick={toggleAllIndia}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                preferences.states.includes('ALL')
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${preferences.states.includes('ALL') ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold">All India (Central Government Recruitments)</span>
                  <p className="text-[10px] text-slate-400">UPSC, SSC, Railways, Banks, Defence & Central Ministries</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  preferences.states.includes('ALL')
                    ? 'bg-cyan-500 border-cyan-400 text-black'
                    : 'border-slate-700 bg-slate-800'
                }`}
              >
                {preferences.states.includes('ALL') && <Check className="w-3.5 h-3.5 font-bold" />}
              </div>
            </button>

            {/* State Search & Zone Filter */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder="Search state (e.g. Uttar Pradesh, Bihar, Rajasthan, Maharashtra)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {stateSearch && (
                    <button
                      type="button"
                      onClick={() => setStateSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Zone Filter */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {zones.map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setSelectedZone(zone)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors ${
                        selectedZone === zone
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              {/* State Chips Grid */}
              <div className="max-h-48 overflow-y-auto p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap gap-1.5">
                {filteredStates.map((st) => {
                  const isSelected = preferences.states.includes(st.code);
                  return (
                    <button
                      key={st.code}
                      type="button"
                      onClick={() => toggleState(st.code)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                          : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{st.name}</span>
                      <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-cyan-800 text-cyan-100' : 'bg-slate-800 text-slate-400'}`}>
                        {st.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Alert Events & Sound Delivery */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Notification Stages & Sound
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'newVacancies', label: 'New Vacancies' },
                { key: 'admitCards', label: 'Admit Cards' },
                { key: 'results', label: 'Results Declared' },
                { key: 'answerKeys', label: 'Answer Keys' },
                { key: 'closingSoon', label: 'Closing Soon (< 3 Days)' },
              ].map(({ key, label }) => {
                const checked = (preferences.alertTypes as any)[key] ?? true;
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        updatePreferences({
                          alertTypes: {
                            ...preferences.alertTypes,
                            [key]: e.target.checked,
                          },
                        });
                      }}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-xs text-slate-200">{label}</span>
                  </label>
                );
              })}

              <button
                type="button"
                onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left hover:bg-slate-850 transition-colors"
              >
                {preferences.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <span className="text-xs text-slate-200">
                  {preferences.soundEnabled ? 'Chime Enabled' : 'Muted'}
                </span>
              </button>
            </div>

            {/* Test Alert Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  Test Push Alert
                </span>
                <p className="text-[11px] text-slate-400">
                  Trigger an immediate test push alert matching your selected categories and states.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestAlert}
                disabled={testAlertLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {testAlertLoading ? 'Sending...' : 'Send Test Alert'}
              </button>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-xs text-cyan-200 flex items-start gap-2">
                <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{testResult}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Tailored Feed Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0b1220] to-[#080d17] border border-cyan-500/20 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Live Tailored Vacancy Feed
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {matchedJobs.length} matches
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Here are the active vacancies currently matching your selected criteria. Whenever a new job in these categories is verified, an alert will be dispatched.
              </p>

              {/* Feed items */}
              <div className="max-h-[650px] overflow-y-auto space-y-3 pr-1">
                {isLoadingJobs ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Loading matching recruitments...
                  </div>
                ) : matchedJobs.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-300">No current matches</h4>
                    <p className="text-[11px] text-slate-400">
                      Try adding more exam categories or selecting &quot;All India&quot; to expand your feed.
                    </p>
                    <button
                      type="button"
                      onClick={selectAllCategories}
                      className="mt-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      Select All Categories
                    </button>
                  </div>
                ) : (
                  matchedJobs.slice(0, 10).map((job) => (
                    <VacancyCard key={job.id} vacancy={job} />
                  ))
                )}
              </div>

              {matchedJobs.length > 10 && (
                <div className="pt-2 text-center">
                  <Link
                    to="/jobs"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                  >
                    <span>View all {matchedJobs.length} matching vacancies</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
