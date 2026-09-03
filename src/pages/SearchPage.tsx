import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Briefcase,
  Building2,
  MapPin,
  FileCheck,
  Award,
  Key,
  BellRing,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
} from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { QuickSearchBar } from '../components/search/QuickSearchBar';
import { VacancyCard } from '../components/cards/VacancyCard';
import { StateCard } from '../components/cards/StateCard';
import { AdmitCardCard } from '../components/cards/AdmitCardCard';
import { ResultCard } from '../components/cards/ResultCard';
import { AnswerKeyCard } from '../components/cards/AnswerKeyCard';
import { UpdateCard } from '../components/cards/UpdateCard';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Badge } from '../components/ui/Badge';
import { searchAll } from '../lib/data';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  JobVacancy,
  StateInfo,
  AdmitCardItem,
  ResultItem,
  AnswerKeyItem,
  GovernmentUpdate,
} from '../types';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [filterType, setFilterType] = useState<
    'all' | 'jobs' | 'states' | 'admit-cards' | 'results' | 'answer-keys' | 'updates'
  >('all');

  const [matchedJobs, setMatchedJobs] = useState<JobVacancy[]>([]);
  const [matchedStates, setMatchedStates] = useState<StateInfo[]>([]);
  const [matchedAdmitCards, setMatchedAdmitCards] = useState<AdmitCardItem[]>([]);
  const [matchedResults, setMatchedResults] = useState<ResultItem[]>([]);
  const [matchedAnswerKeys, setMatchedAnswerKeys] = useState<AnswerKeyItem[]>([]);
  const [matchedUpdates, setMatchedUpdates] = useState<GovernmentUpdate[]>([]);
  const [totalResultsCount, setTotalResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const handleSearchSubmit = (newQuery: string) => {
    setSearchQuery(newQuery);
    setSearchParams(newQuery ? { q: newQuery } : {});
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function executeSearch() {
      try {
        const res = await searchAll(searchQuery);
        if (isMounted) {
          setMatchedJobs(res.jobs);
          setMatchedStates(res.states);
          setMatchedAdmitCards(res.admitCards);
          setMatchedResults(res.results);
          setMatchedAnswerKeys(res.answerKeys);
          setMatchedUpdates(res.updates);
          setTotalResultsCount(res.totalMatches);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Unified search error:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      executeSearch();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <div className="space-y-8">
      <MetaTags
        title={searchQuery ? `Search Results for "${searchQuery}"` : 'Unified Recruitment Search'}
        description="Search across central & state government job vacancies, admit cards, declared results, answer keys, and syllabus."
        canonicalPath="/search"
        robots="noindex, follow"
      />

      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Search className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Recruitment Search
          </h1>
          {isSupabaseConfigured && (
            <Badge variant="success">Supabase Live</Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Quickly discover jobs, state commissions, admit cards, answer keys, and exam updates across the entire portal.
        </p>

        <div className="pt-4 max-w-2xl">
          <QuickSearchBar
            initialValue={searchQuery}
            onSearch={handleSearchSubmit}
            placeholder="Search by job title, organization, state, or exam..."
          />
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-3">
        {[
          { id: 'all', label: `All Results (${totalResultsCount})` },
          { id: 'jobs', label: `Jobs (${matchedJobs.length})` },
          { id: 'states', label: `States & UTs (${matchedStates.length})` },
          { id: 'admit-cards', label: `Admit Cards (${matchedAdmitCards.length})` },
          { id: 'results', label: `Results (${matchedResults.length})` },
          { id: 'answer-keys', label: `Answer Keys (${matchedAnswerKeys.length})` },
          { id: 'updates', label: `Updates (${matchedUpdates.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Results Display */}
      {isLoading ? (
        <LoadingState count={6} />
      ) : totalResultsCount === 0 ? (
        <EmptyState
          title="No Results Found"
          description={`We couldn't find any vacancies or exam notifications matching "${searchQuery}". Try different keywords or browse our categories.`}
          onReset={() => handleSearchSubmit('')}
        />
      ) : (
        <div className="space-y-10">
          {/* Section: Matching Vacancies */}
          {(filterType === 'all' || filterType === 'jobs') && matchedJobs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  <span>Matching Vacancies ({matchedJobs.length})</span>
                </h2>
                <Link to="/jobs" className="text-xs text-blue-400 hover:underline">
                  View All Jobs
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {matchedJobs.map((job) => (
                  <VacancyCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Matching States */}
          {(filterType === 'all' || filterType === 'states') && matchedStates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>Matching States & UTs ({matchedStates.length})</span>
                </h2>
                <Link to="/jobs/states" className="text-xs text-purple-400 hover:underline">
                  View All 36 States & UTs
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {matchedStates.map((state) => (
                  <StateCard key={state.code} state={state} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Matching Admit Cards */}
          {(filterType === 'all' || filterType === 'admit-cards') && matchedAdmitCards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  <span>Matching Admit Cards ({matchedAdmitCards.length})</span>
                </h2>
                <Link to="/admit-card" className="text-xs text-cyan-400 hover:underline">
                  View All Admit Cards
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchedAdmitCards.map((item) => (
                  <AdmitCardCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Matching Results */}
          {(filterType === 'all' || filterType === 'results') && matchedResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Matching Results ({matchedResults.length})</span>
                </h2>
                <Link to="/results" className="text-xs text-emerald-400 hover:underline">
                  View All Results
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchedResults.map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Matching Answer Keys */}
          {(filterType === 'all' || filterType === 'answer-keys') && matchedAnswerKeys.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span>Matching Answer Keys ({matchedAnswerKeys.length})</span>
                </h2>
                <Link to="/answer-key" className="text-xs text-purple-400 hover:underline">
                  View All Answer Keys
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchedAnswerKeys.map((item) => (
                  <AnswerKeyCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Matching Updates */}
          {(filterType === 'all' || filterType === 'updates') && matchedUpdates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                  <BellRing className="w-4 h-4 text-amber-400" />
                  <span>Matching Recruitment Updates ({matchedUpdates.length})</span>
                </h2>
                <Link to="/updates" className="text-xs text-amber-400 hover:underline">
                  View All Updates
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchedUpdates.map((update) => (
                  <UpdateCard key={update.id} update={update} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
