import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Building2,
  MapPin,
  ArrowRight,
  Clock,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { JobVacancy } from '../../types';
import { Badge } from '../ui/Badge';

interface VacancyCardProps {
  job: JobVacancy;
  featured?: boolean;
}

export const VacancyCard: React.FC<VacancyCardProps> = ({ job, featured = false }) => {
  const isClosingSoon = job.status === 'Closing Soon';

  return (
    <div
      className={`group relative rounded-2xl p-5 md:p-6 transition-all duration-200 border flex flex-col justify-between ${
        featured
          ? 'bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-blue-950/30 border-blue-500/40 hover:border-blue-500/70 shadow-lg shadow-blue-950/30'
          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={job.sector === 'central' ? 'primary' : 'purple'}
              size="sm"
            >
              <Building2 className="w-3 h-3" />
              {job.sector === 'central' ? 'Central Govt' : `${job.stateName || 'State'} Govt`}
            </Badge>

            {job.centralCategory && (
              <Badge variant="slate" size="sm">
                {job.centralCategory}
              </Badge>
            )}
          </div>

          <Badge
            variant={
              job.status === 'Active'
                ? 'success'
                : job.status === 'Closing Soon'
                ? 'danger'
                : job.status === 'Upcoming'
                ? 'info'
                : 'slate'
            }
            size="sm"
          >
            {job.status === 'Closing Soon' && <Clock className="w-3 h-3 animate-pulse" />}
            {job.status}
          </Badge>
        </div>

        {/* Organization Name */}
        <p className="text-xs uppercase tracking-wider font-semibold text-cyan-400 mb-1 flex items-center gap-1.5">
          <span>{job.organization}</span>
        </p>

        {/* Job Title / Post */}
        <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-2 mb-2 font-display">
          <Link to={`/jobs/${job.slug || job.id}`}>
            {job.title}
          </Link>
        </h3>

        {/* Key Attributes Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-slate-800/60 my-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Total Posts:</span>
              <span className="font-semibold text-slate-100">{job.totalVacancies} Vacancies</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Last Date:</span>
              <span className={`font-semibold ${isClosingSoon ? 'text-rose-400 font-bold' : 'text-slate-100'}`}>
                {job.importantDates.applyEndDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[11px]">Eligibility:</span>
              <span className="font-medium text-slate-200 truncate block">
                {job.qualification[0] || 'Graduation'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Published:</span>
              <span className="font-medium text-slate-300">{job.publishedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Foundation Preview
        </span>

        <Link
          to={`/jobs/${job.slug || job.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm shadow-blue-600/20 group-hover:gap-2"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
