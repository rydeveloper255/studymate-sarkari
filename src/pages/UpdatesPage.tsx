import React, { useState, useEffect } from 'react';
import { BellRing, Filter, Search, Sparkles, Layers } from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateBreadcrumbSchema } from '../lib/seo/structuredData';
import { UpdateCard } from '../components/cards/UpdateCard';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Badge } from '../components/ui/Badge';
import { fetchUpdates } from '../lib/data';
import { isSupabaseConfigured } from '../lib/supabase';
import { GovernmentUpdate, UpdateCategory } from '../types';

export const UpdatesPage: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [updates, setUpdates] = useState<GovernmentUpdate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const categoryChips: { label: string; value: string }[] = [
    { label: 'All Updates', value: 'all' },
    { label: 'Recruitment Notices', value: 'recruitment' },
    { label: 'Admit Cards', value: 'admit_card' },
    { label: 'Results Declared', value: 'result' },
    { label: 'Answer Keys', value: 'answer_key' },
    { label: 'Exam Schedules', value: 'exam_update' },
  ];

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadUpdates() {
      try {
        const res = await fetchUpdates({
          category: selectedCat !== 'all' ? (selectedCat as UpdateCategory) : undefined,
          searchQuery: search,
          pageSize: 40,
        });

        if (isMounted) {
          setUpdates(res.data);
          setTotalCount(res.total);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load updates:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadUpdates();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCat, search]);

  return (
    <div className="space-y-8">
      <MetaTags
        title="Important Recruitment Updates & Exam Bulletins 2026 — StudyMate Sarkari"
        description="Real-time chronological timeline of government recruitment notifications, exam date postponements, admit cards, and commission circulars."
        canonicalPath="/updates"
        schemaJson={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Recruitment Updates', url: '/updates' },
        ])}
      />

      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BellRing className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Important Recruitment Updates
          </h1>
          <Badge variant="warning">Live Feed</Badge>
          {isSupabaseConfigured ? (
            <Badge variant="success">Supabase Live</Badge>
          ) : (
            <Badge variant="demo">Data Layer</Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Stay updated with timely notices, exam date calendars, application extension announcements, and official press releases.
        </p>
      </div>

      {/* Search & Category Tabs */}
      <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter updates by organization, exam, or keyword..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categoryChips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setSelectedCat(chip.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCat === chip.value
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Updates Timeline List / Grid */}
      {isLoading ? (
        <LoadingState count={4} />
      ) : updates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {updates.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Updates Found"
          description="No recruitment updates matched your selected category and keyword."
          onReset={() => {
            setSelectedCat('all');
            setSearch('');
          }}
        />
      )}
    </div>
  );
};
