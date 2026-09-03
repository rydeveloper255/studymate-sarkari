import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  BellRing,
  FileCheck,
  Award,
  Key,
  Building2,
  ChevronRight,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateBreadcrumbSchema } from '../lib/seo/structuredData';
import {
  fetchStateBySlug,
  fetchStateJobs,
  fetchAdmitCards,
  fetchResults,
  fetchAnswerKeys,
  fetchUpdates,
} from '../lib/data';
import { VacancyCard } from '../components/cards/VacancyCard';
import { AdmitCardCard } from '../components/cards/AdmitCardCard';
import { ResultCard } from '../components/cards/ResultCard';
import { AnswerKeyCard } from '../components/cards/AnswerKeyCard';
import { UpdateCard } from '../components/cards/UpdateCard';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import {
  StateInfo,
  JobVacancy,
  AdmitCardItem,
  ResultItem,
  AnswerKeyItem,
  GovernmentUpdate,
} from '../types';

export const StateDetailPage: React.FC = () => {
  const { state: stateSlug } = useParams<{ state: string }>();
  const [activeTab, setActiveTab] = useState<
    'jobs' | 'admit-card' | 'results' | 'answer-key' | 'updates'
  >('jobs');

  const [stateInfo, setStateInfo] = useState<StateInfo | null>(null);
  const [stateJobs, setStateJobs] = useState<JobVacancy[]>([]);
  const [stateAdmitCards, setStateAdmitCards] = useState<AdmitCardItem[]>([]);
  const [stateResults, setStateResults] = useState<ResultItem[]>([]);
  const [stateAnswerKeys, setStateAnswerKeys] = useState<AnswerKeyItem[]>([]);
  const [stateUpdates, setStateUpdates] = useState<GovernmentUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadStateData() {
      if (!stateSlug) return;
      try {
        const info = await fetchStateBySlug(stateSlug);
        if (!info) {
          if (isMounted) {
            setStateInfo(null);
            setIsLoading(false);
          }
          return;
        }

        const [jobsRes, admitRes, resultsRes, answerRes, updatesRes] = await Promise.all([
          fetchStateJobs(info.code, 1, 30),
          fetchAdmitCards({ stateName: info.name }),
          fetchResults({ stateName: info.name }),
          fetchAnswerKeys({ stateName: info.name }),
          fetchUpdates({ searchQuery: info.name }),
        ]);

        if (isMounted) {
          setStateInfo(info);
          setStateJobs(jobsRes.data);
          setStateAdmitCards(admitRes.data);
          setStateResults(resultsRes.data);
          setStateAnswerKeys(answerRes.data);
          setStateUpdates(updatesRes.data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load state details:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadStateData();
    return () => {
      isMounted = false;
    };
  }, [stateSlug]);

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState label="Loading state details and opportunities..." />
      </div>
    );
  }

  if (!stateInfo) {
    return (
      <div className="py-12">
        <MetaTags title="State Not Found" />
        <EmptyState
          title="State Not Found"
          description={`The state or union territory "${stateSlug}" was not found in our directory of 36 Indian states and UTs.`}
          actionLabel="Explore All States"
          actionHref="/jobs/states"
        />
      </div>
    );
  }

  const tabs = [
    { id: 'jobs', label: 'Latest Jobs', count: stateJobs.length, icon: Briefcase },
    { id: 'admit-card', label: 'Admit Cards', count: stateAdmitCards.length, icon: FileCheck },
    { id: 'results', label: 'Results', count: stateResults.length, icon: Award },
    { id: 'answer-key', label: 'Answer Keys', count: stateAnswerKeys.length, icon: Key },
    { id: 'updates', label: 'Important Updates', count: stateUpdates.length, icon: BellRing },
  ];

  return (
    <div className="space-y-8">
      <MetaTags
        title={`${stateInfo.name} Government Jobs & Recruitment 2026`}
        description={`Find all latest ${stateInfo.name} government job vacancies, admit cards, results, exam updates, and state commission announcements.`}
        canonicalPath={`/jobs/states/${stateInfo.slug}`}
        schemaJson={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'State Government Jobs', url: '/jobs/states' },
          { name: stateInfo.name, url: `/jobs/states/${stateInfo.slug}` },
        ])}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link to="/" className="hover:text-slate-200">Home</Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <Link to="/jobs/states" className="hover:text-slate-200">States</Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="text-slate-200 font-semibold">{stateInfo.name}</span>
      </nav>

      {/* State Banner / Header */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-blue-950/40 border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg font-display flex-shrink-0">
              {stateInfo.code}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  {stateInfo.name} Government Jobs
                </h1>
                <Badge variant={stateInfo.type === 'state' ? 'purple' : 'info'}>
                  {stateInfo.type === 'state' ? 'State Government' : 'Union Territory'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                <span><strong>Capital:</strong> {stateInfo.capital}</span>
                <span>•</span>
                <span><strong>Zone:</strong> {stateInfo.zone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* State recruitment bodies highlight */}
        {stateInfo.highlightOrganizations.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium">Key Recruitment Commissions:</span>
            {stateInfo.highlightOrganizations.map((org) => (
              <span
                key={org}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-purple-300 border border-purple-500/30 font-semibold"
              >
                {org}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-200 font-display">
                Active Vacancies in {stateInfo.name}
              </h3>
            </div>
            {stateJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {stateJobs.map((job) => (
                  <VacancyCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={`No Active Jobs Currently in ${stateInfo.name}`}
                description={`Official notifications for ${stateInfo.name} will appear here as soon as published by state commissions.`}
                actionLabel="Explore All States"
                actionHref="/jobs/states"
              />
            )}
          </div>
        )}

        {activeTab === 'admit-card' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-200 font-display">
              {stateInfo.name} Admit Cards & Hall Tickets
            </h3>
            {stateAdmitCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stateAdmitCards.map((item) => (
                  <AdmitCardCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Admit Cards Currently"
                description={`No active hall tickets published for ${stateInfo.name} at this time.`}
                actionLabel="View All Admit Cards"
                actionHref="/admit-card"
              />
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-200 font-display">
              {stateInfo.name} Results & Merit Lists
            </h3>
            {stateResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stateResults.map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Results Available"
                description={`No declared exam results for ${stateInfo.name} at this moment.`}
                actionLabel="View All Results"
                actionHref="/results"
              />
            )}
          </div>
        )}

        {activeTab === 'answer-key' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-200 font-display">
              {stateInfo.name} Answer Keys & Question Papers
            </h3>
            {stateAnswerKeys.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stateAnswerKeys.map((item) => (
                  <AnswerKeyCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Answer Keys Published"
                description={`No provisional or final answer keys active for ${stateInfo.name}.`}
                actionLabel="View All Answer Keys"
                actionHref="/answer-key"
              />
            )}
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-200 font-display">
              {stateInfo.name} Recruitment Timeline & Notices
            </h3>
            {stateUpdates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stateUpdates.map((update) => (
                  <UpdateCard key={update.id} update={update} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No State Updates Yet"
                description={`No specific update notices registered for ${stateInfo.name}.`}
                actionLabel="View All Updates"
                actionHref="/updates"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
