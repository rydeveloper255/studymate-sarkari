import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  DollarSign,
  GraduationCap,
  FileText,
  Database,
} from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '../lib/seo/structuredData';
import { fetchJobBySlugOrId } from '../lib/data';
import { isSupabaseConfigured } from '../lib/supabase';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { JobVacancy } from '../types';

export const VacancyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobVacancy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadJob() {
      if (!id) return;
      try {
        const found = await fetchJobBySlugOrId(id);
        if (isMounted) {
          setJob(found);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load vacancy details:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadJob();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState label="Loading vacancy notification details..." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-12">
        <MetaTags title="Vacancy Not Found" />
        <EmptyState
          title="Vacancy Details Not Found"
          description="The requested recruitment notification was not found in our database."
          actionLabel="Browse All Jobs"
          actionHref="/jobs"
        />
      </div>
    );
  }

  const schemas = job
    ? [
        generateJobPostingSchema(job),
        generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Government Jobs', url: '/jobs' },
          { name: job.title, url: `/jobs/${job.slug || job.id}` },
        ]),
      ].filter(Boolean)
    : undefined;

  return (
    <div className="space-y-8">
      <MetaTags
        title={`${job.title} — ${job.organization} Recruitment 2026 | Apply Online & Dates`}
        description={
          job.summary ||
          `Official ${job.organization} notification for ${job.postName}. Total vacancies: ${job.totalVacancies || 'Multiple'}. Check eligibility, age limit, application fee, and direct apply link.`
        }
        canonicalPath={`/jobs/${job.slug || job.id}`}
        ogType="article"
        schemaJson={schemas as any}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link to="/" className="hover:text-slate-200">Home</Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <Link to="/jobs" className="hover:text-slate-200">Jobs</Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="text-slate-200 font-medium truncate max-w-[240px] sm:max-w-md">{job.postName}</span>
      </nav>

      {/* Main Vacancy Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-950/50 via-slate-900/90 to-indigo-950/50 border border-blue-500/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={job.sector === 'central' ? 'primary' : 'purple'} size="md">
              <Building2 className="w-3.5 h-3.5" />
              {job.sector === 'central' ? 'Central Government' : `${job.stateName || 'State'} Government`}
            </Badge>

            {job.centralCategory && (
              <Badge variant="slate" size="md">
                {job.centralCategory}
              </Badge>
            )}

            {isSupabaseConfigured && (
              <Badge variant="success" size="md">
                <Database className="w-3 h-3" />
                Live Database
              </Badge>
            )}
          </div>

          <Badge
            variant={job.status === 'Active' ? 'success' : job.status === 'Closing Soon' ? 'danger' : 'info'}
            size="md"
          >
            {job.status}
          </Badge>
        </div>

        {/* Organization & Title */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-cyan-400">
            {job.organization} {job.deptOrMinistry && `• ${job.deptOrMinistry}`}
          </p>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display tracking-tight leading-tight">
            {job.title}
          </h1>
        </div>

        {/* Summary */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          {job.summary}
        </p>

        {/* Quick Meta Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block text-[11px] mb-0.5">Total Vacancies</span>
            <span className="text-base font-bold text-slate-100">{job.totalVacancies} Posts</span>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block text-[11px] mb-0.5">Apply Last Date</span>
            <span className="text-base font-bold text-amber-300">{job.importantDates?.applyEndDate || 'Refer notification'}</span>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block text-[11px] mb-0.5">Pay Scale / Salary</span>
            <span className="text-xs font-semibold text-emerald-300 truncate block">
              {job.salaryOrPayScale || 'As per norms'}
            </span>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block text-[11px] mb-0.5">Age Limit (General)</span>
            <span className="text-base font-bold text-slate-100">{job.ageLimit?.minAge || 18} – {job.ageLimit?.maxAge || 30} Yrs</span>
          </div>
        </div>

        {/* Official Action CTA Buttons */}
        <div className="pt-3 flex items-center gap-3 flex-wrap">
          <a
            href={job.officialApplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-600/30"
          >
            <span>Official Apply Online</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={job.officialNotificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Official PDF</span>
          </a>

          <a
            href={job.officialWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <span>Official Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column (2 Cols): Detailed Specifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Important Dates Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-display">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Important Dates & Timeline</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-400 font-medium">Notification Release Date:</td>
                    <td className="py-2.5 font-semibold text-slate-200">{job.importantDates?.notificationDate || 'Refer notification'}</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-400 font-medium">Online Application Start:</td>
                    <td className="py-2.5 font-semibold text-emerald-400">{job.importantDates?.applyStartDate || 'Refer notification'}</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-400 font-medium">Last Date to Submit Online:</td>
                    <td className="py-2.5 font-bold text-amber-300">{job.importantDates?.applyEndDate || 'Refer notification'}</td>
                  </tr>
                  {job.importantDates?.examDate && (
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-400 font-medium">Examination Date (Tentative):</td>
                      <td className="py-2.5 font-semibold text-cyan-300">{job.importantDates.examDate}</td>
                    </tr>
                  )}
                  {job.importantDates?.admitCardDate && (
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-400 font-medium">Admit Card Release:</td>
                      <td className="py-2.5 font-semibold text-purple-300">{job.importantDates.admitCardDate}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Educational Qualification */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-display">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Eligibility & Educational Qualification</span>
            </h3>

            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {job.qualification?.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Selection Process */}
          {job.selectionProcess && job.selectionProcess.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-display">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Selection Process Stages</span>
              </h3>

              <div className="space-y-2">
                {job.selectionProcess.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 text-xs sm:text-sm text-slate-200"
                  >
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Instructions */}
          {job.importantInstructions && job.importantInstructions.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-display">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Important Candidate Instructions</span>
              </h3>

              <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 leading-relaxed">
                {job.importantInstructions.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Sidebar: Fees & Age Limits & Official URLs */}
        <div className="space-y-6">
          {/* Application Fee */}
          {job.applicationFee && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display uppercase tracking-wider">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Application Fee</span>
              </h3>

              <div className="space-y-2 text-xs divide-y divide-slate-800">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">General / UR / EWS:</span>
                  <span className="font-bold text-slate-100">{job.applicationFee.general}</span>
                </div>
                {job.applicationFee.obcEws && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">OBC (NCL):</span>
                    <span className="font-bold text-slate-100">{job.applicationFee.obcEws}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">SC / ST / PwBD:</span>
                  <span className="font-bold text-emerald-400">{job.applicationFee.scStPh}</span>
                </div>
                {job.applicationFee.female && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Female Candidates:</span>
                    <span className="font-bold text-emerald-400">{job.applicationFee.female}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <strong>Payment Mode:</strong> {job.applicationFee.paymentMode}
              </p>
            </div>
          )}

          {/* Age Limit & Relaxation */}
          {job.ageLimit && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display uppercase tracking-wider">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Age Criteria</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Minimum Age:</span>
                  <span className="font-bold text-slate-100">{job.ageLimit.minAge} Years</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Maximum Age:</span>
                  <span className="font-bold text-slate-100">{job.ageLimit.maxAge} Years</span>
                </div>
                {job.ageLimit.asOnDate && (
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Calculated As On:</span>
                    <span className="font-medium text-slate-300">{job.ageLimit.asOnDate}</span>
                  </div>
                )}
              </div>

              {job.ageLimit.relaxationDetails && (
                <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                  <strong>Relaxation Rules:</strong> {job.ageLimit.relaxationDetails}
                </p>
              )}
            </div>
          )}

          {/* Official Verification Notice */}
          <div className="bg-gradient-to-b from-blue-950/30 to-slate-900/60 border border-blue-500/20 rounded-2xl p-5 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Verification Notice</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Candidates are redirected strictly to authentic official recruitment links ({job.officialWebsiteUrl}). Never pay fees on unauthorized third-party platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
