import React, { useState, useEffect } from 'react';
import { Building2, Shield, Train, Landmark, Compass, Mail, Factory, Layers } from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateBreadcrumbSchema } from '../lib/seo/structuredData';
import { VacancyCard } from '../components/cards/VacancyCard';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { fetchCentralJobs } from '../lib/data';
import { isSupabaseConfigured } from '../lib/supabase';
import { JobVacancy } from '../types';

export const CentralJobsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [centralJobs, setCentralJobs] = useState<JobVacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const categories: { label: string; value: string; icon: React.ReactNode; desc: string }[] = [
    { label: 'All Central', value: 'All', icon: <Layers className="w-4 h-4" />, desc: 'All national recruitments' },
    { label: 'UPSC', value: 'UPSC', icon: <Building2 className="w-4 h-4" />, desc: 'IAS, IPS, IFS, CDS, NDA' },
    { label: 'SSC', value: 'SSC', icon: <Compass className="w-4 h-4" />, desc: 'CGL, CHSL, MTS, GD, CPO' },
    { label: 'Railway', value: 'Railway', icon: <Train className="w-4 h-4" />, desc: 'RRB NTPC, ALP, Group D' },
    { label: 'Banking', value: 'Banking', icon: <Landmark className="w-4 h-4" />, desc: 'SBI, IBPS, RBI, NABARD' },
    { label: 'Defence', value: 'Defence', icon: <Shield className="w-4 h-4" />, desc: 'Army, Navy, Air Force, Coast Guard' },
    { label: 'Postal', value: 'Postal', icon: <Mail className="w-4 h-4" />, desc: 'India Post GDS, Mail Guard' },
    { label: 'Public Sector', value: 'Public Sector', icon: <Factory className="w-4 h-4" />, desc: 'ONGC, BHEL, NTPC, SAIL, IOCL' },
    { label: 'Other Central', value: 'Other Central Government', icon: <Building2 className="w-4 h-4" />, desc: 'Autonomous bodies & councils' },
  ];

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadCentral() {
      try {
        const res = await fetchCentralJobs(selectedCategory, 1, 30);
        if (isMounted) {
          setCentralJobs(res.data);
          setTotalCount(res.total);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load central jobs:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadCentral();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  return (
    <div className="space-y-8">
      <MetaTags
        title="Central Government Jobs 2026 — UPSC, SSC, Railway, Banking, Defence"
        description="All India Central Government vacancies, recruitment exam dates, syllabus, eligibility, and official notifications for UPSC, SSC, RRB, IBPS, and Armed Forces."
        canonicalPath="/jobs/central"
        schemaJson={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Central Government Jobs', url: '/jobs/central' },
        ])}
      />

      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Central Government Jobs
          </h1>
          {isSupabaseConfigured ? (
            <Badge variant="success">Supabase Live</Badge>
          ) : (
            <Badge variant="demo">Data Layer</Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Explore all Union Government recruitment drives including Staff Selection Commission (SSC), Union Public Service Commission (UPSC), Railway Recruitment Boards (RRB), Public Sector Banks, and Armed Forces.
        </p>
      </div>

      {/* Central Categories Horizontal / Grid Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2.5">
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setSelectedCategory(cat.value)}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[72px] ${
              selectedCategory === cat.value
                ? 'bg-indigo-600/25 border-indigo-500/70 text-white shadow-md shadow-indigo-950/50'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={selectedCategory === cat.value ? 'text-indigo-300' : 'text-slate-400'}>
                {cat.icon}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold font-display text-slate-100 truncate">
                {cat.label}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{cat.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Vacancy Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200 font-display">
            {selectedCategory === 'All'
              ? 'All Central Government Vacancies'
              : `${selectedCategory} Recruitment Vacancies`}
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({totalCount} listings)
            </span>
          </h2>
        </div>

        {isLoading ? (
          <LoadingState count={6} />
        ) : centralJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {centralJobs.map((job) => (
              <VacancyCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No vacancies under ${selectedCategory}`}
            description="We are updating recruitment notifications for this sector continuously."
            actionLabel="View All Central Jobs"
            onReset={() => setSelectedCategory('All')}
          />
        )}
      </div>
    </div>
  );
};
