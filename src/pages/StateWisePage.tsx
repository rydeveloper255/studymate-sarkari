import React, { useState, useEffect } from 'react';
import { MapPin, Search, Layers, Compass, Building2 } from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateBreadcrumbSchema } from '../lib/seo/structuredData';
import { StateCard } from '../components/cards/StateCard';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { fetchAllStates } from '../lib/data';
import { StateInfo } from '../types';

export const StateWisePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeZone, setActiveZone] = useState('all');
  const [statesList, setStatesList] = useState<StateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStates() {
      try {
        const data = await fetchAllStates();
        if (isMounted) {
          setStatesList(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load states list:', err);
        if (isMounted) setIsLoading(false);
      }
    }
    loadStates();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = statesList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.capital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.highlightOrganizations.some((org) => org.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesZone =
      activeZone === 'all' ||
      (activeZone === 'states' && item.type === 'state') ||
      (activeZone === 'ut' && item.type === 'ut') ||
      item.zone.toLowerCase() === activeZone.toLowerCase();

    return matchesSearch && matchesZone;
  });

  return (
    <div className="space-y-8">
      <MetaTags
        title="State-wise Government Jobs 2026 — 28 States & 8 Union Territories"
        description="Explore State Public Service Commissions, Subordinate Selection Boards, Police Recruitment, and Teacher Vacancies across all 36 Indian States and UTs."
        canonicalPath="/jobs/states"
        schemaJson={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'State Government Jobs', url: '/jobs/states' },
        ])}
      />

      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <MapPin className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            State-Wise Government Jobs
          </h1>
          <Badge variant="purple">36 States & UTs</Badge>
        </div>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Access specialized state career boards including BPSC, UPPSC, MPPSC, MPSC, RPSC, TNPSC, WBPSC, DSSSB, and all state subordinate recruitment boards.
        </p>
      </div>

      {/* Search & Zone Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search state, UT, capital, or commission (e.g. Bihar, BPSC, UPPSC)..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { label: `All (36)`, value: 'all' },
            { label: `28 States`, value: 'states' },
            { label: `8 UTs`, value: 'ut' },
            { label: 'Northern', value: 'northern' },
            { label: 'Southern', value: 'southern' },
            { label: 'Eastern', value: 'eastern' },
            { label: 'Western', value: 'western' },
            { label: 'Central', value: 'central' },
            { label: 'North-East', value: 'north-eastern' },
          ].map((z) => (
            <button
              key={z.value}
              type="button"
              onClick={() => setActiveZone(z.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeZone === z.value
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Showing {filteredItems.length} regions</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-purple-400 hover:underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* States & UTs Grid */}
      {isLoading ? (
        <LoadingState count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((state) => (
            <StateCard key={state.code} state={state} />
          ))}
        </div>
      )}
    </div>
  );
};
