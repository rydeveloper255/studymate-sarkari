import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  X,
  Check,
  Search,
  Volume2,
  VolumeX,
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
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useNotificationPreferences } from '../../lib/notifications/NotificationContext';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRESETS } from '../../data/notificationOptions';
import { ALL_STATES_AND_UTS } from '../../data/statesData';

export const NotificationPreferencesModal: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    permissionState,
    requestPermission,
    sendTestAlert,
    isPreferencesModalOpen,
    closePreferencesModal,
  } = useNotificationPreferences();

  const [stateSearch, setStateSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [testAlertLoading, setTestAlertLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  if (!isPreferencesModalOpen) return null;

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

  // Toggle select all categories
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

  // Toggle All India
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

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      closePreferencesModal();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      onClick={closePreferencesModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-[#0b101d] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-cyan-950/80 my-8 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-5 sm:px-7 py-5 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border-b border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 id="notification-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Notification & Push Alert Preferences
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your target categories & states to receive verified alerts as soon as forms release.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closePreferencesModal}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Push Notification Permission Status */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl border flex-shrink-0 ${
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
                    <span className="text-xs font-bold text-white">Browser Push Alerts:</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        permissionState === 'granted'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : permissionState === 'denied'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {permissionState === 'granted'
                        ? 'Enabled & Active'
                        : permissionState === 'denied'
                        ? 'Blocked in Browser'
                        : 'Permission Needed'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {permissionState === 'granted'
                      ? 'You will receive immediate system notifications when relevant job forms and admit cards publish.'
                      : permissionState === 'denied'
                      ? 'Notifications are blocked in your browser. Click the lock/info icon in your browser URL bar to allow notifications.'
                      : 'Grant browser permission to receive alerts even when you are not actively viewing this tab.'}
                  </p>
                </div>
              </div>

              {permissionState !== 'granted' && permissionState !== 'denied' && (
                <button
                  type="button"
                  onClick={requestPermission}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 flex-shrink-0"
                >
                  Enable Push Alerts
                </button>
              )}
            </div>
          </div>

          {/* 2. Quick Aspirant Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Quick Aspirant Presets
              </span>
              <span className="text-[11px] text-slate-500">1-click configuration</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {NOTIFICATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Job Categories Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Target Job Categories ({preferences.categories.length} selected)
                </h3>
                <p className="text-[11px] text-slate-400">Select exam boards and sectors you are preparing for</p>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
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
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/60 text-white shadow-sm'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {renderCategoryIcon(cat.iconName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{cat.shortName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{cat.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Target States & UTs Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Target Geographic Regions & States
                </h3>
                <p className="text-[11px] text-slate-400">
                  {preferences.states.includes('ALL') ? 'All India active' : `${preferences.states.length} state(s) selected`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
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
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                preferences.states.includes('ALL')
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className={`w-4 h-4 ${preferences.states.includes('ALL') ? 'text-cyan-400' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold">All India (Central Government Vacancies)</span>
                  <p className="text-[10px] text-slate-400">UPSC, SSC, Railways, Banks & Central Ministries nationwide</p>
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

            {/* Search & Zone Filters for States */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder="Search state (e.g., Bihar, UP, Rajasthan, Maharashtra)..."
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
              <div className="max-h-40 overflow-y-auto p-2 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-wrap gap-1.5">
                {filteredStates.map((st) => {
                  const isSelected = preferences.states.includes(st.code);
                  return (
                    <button
                      key={st.code}
                      type="button"
                      onClick={() => toggleState(st.code)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
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

          {/* 5. Alert Types & Delivery Settings */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Notification Events & Delivery
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { key: 'newVacancies', label: 'New Vacancies' },
                { key: 'admitCards', label: 'Admit Cards' },
                { key: 'results', label: 'Results Declared' },
                { key: 'answerKeys', label: 'Answer Keys' },
                { key: 'closingSoon', label: 'Closing in 3 Days' },
              ].map(({ key, label }) => {
                const checked = (preferences.alertTypes as any)[key] ?? true;
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-850"
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

              {/* Sound toggle */}
              <button
                type="button"
                onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-left hover:bg-slate-850 transition-colors"
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
          </div>

          {/* Test Alert Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-blue-950/50 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                Instant Alert Verification
              </div>
              <p className="text-[11px] text-slate-400">
                Trigger a test alert matching your current category & state preferences.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestAlert}
              disabled={testAlertLoading}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
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

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-4 bg-[#090d17] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/notifications"
            onClick={closePreferencesModal}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>Open Dedicated Alert Hub</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={closePreferencesModal}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Preferences Saved!
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
