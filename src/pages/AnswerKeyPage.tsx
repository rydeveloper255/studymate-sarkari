import React, { useState, useEffect } from 'react';
import { Key, Search, Filter } from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateBreadcrumbSchema } from '../lib/seo/structuredData';
import { AnswerKeyCard } from '../components/cards/AnswerKeyCard';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Badge } from '../components/ui/Badge';
import { fetchAnswerKeys } from '../lib/data';
import { isSupabaseConfigured } from '../lib/supabase';
import { AnswerKeyItem } from '../types';

export const AnswerKeyPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<'all' | 'central' | 'state'>('all');
  const [keys, setKeys] = useState<AnswerKeyItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadKeys() {
      try {
        const res = await fetchAnswerKeys({
          sector: sectorFilter,
          searchQuery: search,
          pageSize: 30,
        });

        if (isMounted) {
          setKeys(res.data);
          setTotalCount(res.total);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch answer keys:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadKeys();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, sectorFilter]);

  return (
    <div className="space-y-8">
      <MetaTags
        title="Official Answer Keys & Question Papers 2026 — StudyMate Sarkari"
        description="Download official tentative and final answer keys, response sheets, raise online objections, and calculate tentative marks for competitive exams."
        canonicalPath="/answer-key"
        schemaJson={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Answer Keys', url: '/answer-key' },
        ])}
      />

      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Answer Keys & Question Papers
          </h1>
          <Badge variant="warning">Provisional & Final</Badge>
          {isSupabaseConfigured && (
            <Badge variant="success">Supabase Live</Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Access official response sheets, question papers, tentative answer keys, and direct links to submit candidate objection representations.
        </p>
      </div>

      {/* Search & Sector Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exam or commission answer keys (e.g. SSC GD, CTET, BPSC)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            type="button"
            onClick={() => setSectorFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              sectorFilter === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSectorFilter('central')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              sectorFilter === 'central'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Central Govt
          </button>
          <button
            type="button"
            onClick={() => setSectorFilter('state')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              sectorFilter === 'state'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            State Govt
          </button>
        </div>
      </div>

      {/* Answer Keys Grid */}
      {isLoading ? (
        <LoadingState count={6} />
      ) : keys.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {keys.map((item) => (
            <AnswerKeyCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Answer Keys Found"
          description="No answer keys matching your search criteria are currently available."
          onReset={() => {
            setSearch('');
            setSectorFilter('all');
          }}
        />
      )}
    </div>
  );
};
