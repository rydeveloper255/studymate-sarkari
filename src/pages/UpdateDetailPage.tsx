import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Bell,
  Building2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateNewsArticleSchema, generateBreadcrumbSchema } from '../lib/seo/structuredData';
import { fetchUpdateById } from '../lib/data/updates';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { GovernmentUpdate } from '../types';

export const UpdateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [update, setUpdate] = useState<GovernmentUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadUpdate() {
      if (!id) return;
      try {
        const found = await fetchUpdateById(id);
        if (isMounted) {
          setUpdate(found);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load update details:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadUpdate();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <LoadingState message="Loading official recruitment update..." />
      </div>
    );
  }

  if (!update) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <EmptyState
          icon={Bell}
          title="Update Not Found"
          description="The requested official notice or examination update could not be found or may have been archived."
          actionLabel="View All Updates"
          onAction={() => (window.location.href = '/updates')}
        />
      </div>
    );
  }

  const categoryLabelMap: Record<string, { label: string; variant: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate' }> = {
    recruitment: { label: 'Recruitment Notice', variant: 'blue' },
    admit_card: { label: 'Admit Card Alert', variant: 'emerald' },
    result: { label: 'Result Declared', variant: 'purple' },
    answer_key: { label: 'Answer Key', variant: 'amber' },
    exam_update: { label: 'Exam Schedule', variant: 'slate' },
  };

  const catMeta = categoryLabelMap[update.category] || { label: 'Official Notice', variant: 'blue' };

  const schemas = update
    ? [
        generateNewsArticleSchema(update),
        generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Updates', url: '/updates' },
          { name: update.title, url: `/updates/${update.id}` },
        ]),
      ].filter(Boolean)
    : undefined;

  return (
    <div className="min-h-screen bg-[#080c15] text-slate-100 py-10 pb-20">
      <MetaTags
        title={`${update.title} — ${update.organization}`}
        description={`${update.summary} Official notice released on ${update.date}. StudyMate Sarkari verified data.`}
        canonicalPath={`/updates/${update.id}`}
        ogType="article"
        schemaJson={schemas as any}
      />

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <Link to="/updates" className="hover:text-white transition-colors">Updates</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-300 font-medium truncate max-w-xs">{update.title}</span>
        </nav>

        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/updates"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Updates
          </Link>
        </div>

        {/* Main Card */}
        <article className="bg-[#0f172a]/95 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Top Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <Badge variant={catMeta.variant} size="md">
              {catMeta.label}
            </Badge>

            {update.isHighPriority && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                High Priority
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Official Notice
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug mb-4">
            {update.title}
          </h1>

          {/* Meta Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 px-5 bg-slate-900/60 rounded-xl border border-slate-800/80 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Issuing Authority</p>
                <p className="text-sm font-semibold text-slate-200">{update.organization}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Release Date</p>
                <p className="text-sm font-semibold text-slate-200">{update.date}</p>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Notice Summary & Key Details
            </h2>
            <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-800/70 text-slate-300 text-sm md:text-base leading-relaxed">
              <p>{update.summary}</p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {update.linkUrl && (
              <a
                href={update.linkUrl}
                target={update.linkUrl.startsWith('http') ? '_blank' : '_self'}
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98]"
              >
                <span>{update.linkUrl.startsWith('http') ? 'View Official Source / Portal' : 'Open Related Vacancy'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Published & Synced: {update.date}</span>
            </div>
          </div>
        </article>

        {/* Verification Guarantee Notice */}
        <div className="mt-8 p-5 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-300 mb-1">StudyMate Sarkari Verification Guarantee</p>
            <p>
              All updates on this platform are synchronized directly from official government portals and gazette notifications.
              We do not publish unverified social media leaks or speculative dates. Always verify final roll numbers and instructions on the respective commission portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
