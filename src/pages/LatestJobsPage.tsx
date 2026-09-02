import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Sparkles, Filter, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateBreadcrumbSchema } from '../lib/seo/structuredData';
import { VacancyCard } from '../components/cards/VacancyCard';
import { JobFilters } from '../components/filters/JobFilters';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Badge } from '../components/ui/Badge';
import { fetchJobs } from '../lib/data';
import { isSupabaseConfigured } from '../lib/supabase';
import { JobVacancy, JobFilterState } from '../types';

export const LatestJobsPage: React.FC = () => {
  const [filters, setFilters] = useState<JobFilterState>({
    searchQuery: '',
    sector: 'all',
    state: '',
    centralCategory: '',
    qualification: '',
    status: '',
    sortBy: 'latest',
  });

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isSupabaseSource, setIsSupabaseSource] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleFilterChange = (updated: Partial<JobFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    setPage(1); // Reset to page 1 on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      sector: 'all',
      state: '',
      centralCategory: '',
      qualification: '',
      status: '',
      sortBy: 'latest',
    });
    setPage(1);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadJobs() {
      try {
        const res = await fetchJobs({
          searchQuery: filters.searchQuery,
          sector: filters.sector,
          state: filters.state,
          centralCategory: filters.centralCategory,
          qualification: filters.qualification,
          status: filters.status,
          sortBy: filters.sortBy,
          page,
          pageSize,
        });

        if (isMounted) {
          setJobs(res.data);
          setTotalCount(res.total);
          setTotalPages(res.totalPages);
          setIsSupabaseSource(res.isSupabaseSource);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load jobs from data layer:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      loadJobs();
    }, 150); // slight debounce for smooth search

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [filters, page]);

  return (
    <div className="space-y-8">
      <MetaTags
        title="Latest Government Jobs 2026 — Central & State Sarkari Naukri"
        description="Browse all latest Central and State Government vacancies, qualification eligibility, age limit, application deadlines, and official notification PDFs."
        canonicalPath="/jobs"
        schemaJson={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Government Jobs', url: '/jobs' },
        ])}
      />

      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Latest Government Jobs
          </h1>
          {isSupabaseSource ? (
            <Badge variant="success">Supabase Live ({totalCount})</Badge>
          ) : (
            <Badge variant="demo">Data Layer ({totalCount})</Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Comprehensive list of active recruitment opportunities across Central Ministries, Public Sector Undertakings (PSUs), and State Government commissions.
        </p>
      </div>

      {/* Filter Section */}
      <JobFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResultsCount={totalCount}
      />

      {/* Listing / Results Grid */}
      {isLoading ? (
        <LoadingState count={6} />
      ) : jobs.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <VacancyCard key={job.id} job={job} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-6">
              <span className="text-xs text-slate-400">
                Showing Page <span className="text-slate-200 font-semibold">{page}</span> of{' '}
                <span className="text-slate-200 font-semibold">{totalPages}</span> ({totalCount} vacancies)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && p - prevPage > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <span className="px-1 text-slate-600 text-xs">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                              page === p
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No Vacancies Match Your Filter"
          description="We couldn't find any vacancies matching your selected sector, state, or category criteria. Try resetting your filters."
          onReset={handleResetFilters}
        />
      )}
    </div>
  );
};
