import React from 'react';
import { Briefcase, ShieldCheck, Sparkles, Building2, MapPin, CheckCircle, Info } from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';
import { generateBreadcrumbSchema } from '../lib/seo/structuredData';
import { Badge } from '../components/ui/Badge';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <MetaTags
        title="About StudyMate Sarkari — Mission & Verification Standards"
        description="Learn about StudyMate Sarkari, our mission to simplify government job discovery, and our official verification principles."
        canonicalPath="/about"
        schemaJson={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'About Us', url: '/about' },
        ])}
      />

      {/* Header */}
      <div className="border-b border-slate-800 pb-6 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            About StudyMate Sarkari
          </h1>
          <Badge variant="primary">Portal Overview</Badge>
        </div>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Democratizing and streamlining access to authentic Central and State government recruitment notices across India.
        </p>
      </div>

      {/* Mission & Purpose */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span>Our Vision & Ecosystem</span>
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          StudyMate Sarkari is crafted as the dedicated public examinations and government careers division of the <strong>StudyMate</strong> ecosystem. Millions of aspirants across India spend countless hours navigating fragmented websites to find verified exam dates, admit cards, and recruitment notices. Our portal provides a structured, responsive, and reliable destination for all government exam information.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-100 font-display">100% Official Sources</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Every notification links directly to authenticated government commissions (UPSC, SSC, State PSCs, RRB). We strictly avoid unverified third-party rumors.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-100 font-display">Full-India Coverage</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Dedicated sections for all 28 States, 8 Union Territories, and Union Central Government bodies, ensuring every student has equal access to local opportunities.
          </p>
        </div>
      </div>

      {/* Step 2 Architecture Notice */}
      <div className="p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-cyan-400">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>Project Architecture Note (Step 2: Supabase Data Layer)</span>
        </div>
        <p className="leading-relaxed text-cyan-300/90">
          This portal is powered by <strong>Step 2: Supabase Data Layer Architecture</strong>. All pages query through an abstracted, strongly typed Data Access Layer that supports live Supabase PostgreSQL tables (organizations, states, government_jobs, admit_cards, exam_results, answer_keys, government_updates, content_sources) with graceful fallbacks.
        </p>
      </div>
    </div>
  );
};
