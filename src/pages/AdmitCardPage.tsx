import React, { useState, useEffect } from 'react';
import { FileCheck, Search, Filter, Calendar, Building2 } from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateBreadcrumbSchema } from '../lib/seo/structuredData';
import { AdmitCardCard } from '../components/cards/AdmitCardCard';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Badge } from '../components/ui/Badge';
import { fetchAdmitCards } from '../lib/data';
import { isSupabaseConfigured } from '../lib/supabase';
import { AdmitCardItem } from '../types';

export const AdmitCardPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<'all' | 'central' | 'state'>('all');
  const [admitCards, setAdmitCards] = useState<AdmitCardItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadCards() {
      try {
        const res = await fetchAdmitCards({
          sector: sectorFilter,
          searchQuery: search,
          pageSize: 30,
        });

        if (isMounted) {
          setAdmitCards(res.data);
          setTotalCount(res.total);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch admit cards:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadCards();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, sectorFilter]);

  return (
    <div className="space-y-8">
      <MetaTags
        title="Admit Card & Hall Ticket Releases 2026 — StudyMate Sarkari"
        description="Download competitive exam admit cards, e-call letters, and check exam city intimation slips for UPSC, SSC, Railways, State PSCs, and Banking exams."
        canonicalPath="/admit-card"
        schemaJson={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Admit Cards', url: '/admit-card' },
        ])}
      />

      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Admit Cards & Hall Tickets
          </h1>
          <Badge variant="info">Exam Entry Passes</Badge>
          {isSupabaseConfigured && (
            <Badge variant="success">Supabase Live</Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Direct access to official examination hall tickets, preliminary/mains call letters, and examination city allotment slips.
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
            placeholder="Search exam or organization (e.g. UPSC, SSC, BPSC)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            type="button"
            onClick={() => setSectorFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              sectorFilter === 'all'
                ? 'bg-cyan-600 text-white'
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
                ? 'bg-cyan-600 text-white'
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
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            State Govt
          </button>
        </div>
      </div>

      {/* Admit Cards Grid */}
      {isLoading ? (
        <LoadingState count={6} />
      ) : admitCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {admitCards.map((item) => (
            <AdmitCardCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Admit Cards Found"
          description="No admit cards matching your search query are available."
          onReset={() => {
            setSearch('');
            setSectorFilter('all');
          }}
        />
      )}
    </div>
  );
};
