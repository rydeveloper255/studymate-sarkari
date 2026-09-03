import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ShieldCheck, ExternalLink, Mail, ArrowUpRight, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050810] border-t border-slate-800/80 text-slate-400 text-xs mt-16 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1: Brand & Overview */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5">
                <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="text-lg font-bold text-white font-display">
                StudyMate <span className="text-cyan-400">Sarkari</span>
              </span>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Your comprehensive portal for Central and State Government vacancies, competitive exam admit cards, declared results, answer keys, and verified recruitment notices.
            </p>

            <div className="flex items-center gap-2 pt-1 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs">
                Part of the <strong>StudyMate</strong> educational ecosystem.
              </span>
            </div>
          </div>

          {/* Column 2: Vacancies & Exams */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-200">
              Recruitment
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/jobs" className="hover:text-cyan-300 transition-colors">
                  Latest Government Jobs
                </Link>
              </li>
              <li>
                <Link to="/jobs/central" className="hover:text-cyan-300 transition-colors">
                  Central Govt Jobs
                </Link>
              </li>
              <li>
                <Link to="/jobs/states" className="hover:text-cyan-300 transition-colors">
                  State-wise Vacancies
                </Link>
              </li>
              <li>
                <Link to="/admit-card" className="hover:text-cyan-300 transition-colors">
                  Admit Cards / Hall Tickets
                </Link>
              </li>
              <li>
                <Link to="/results" className="hover:text-cyan-300 transition-colors">
                  Declared Results & Cutoffs
                </Link>
              </li>
              <li>
                <Link to="/answer-key" className="hover:text-cyan-300 transition-colors">
                  Answer Keys & Objections
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Popular Central Exams */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-200">
              Key Categories
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/jobs/central" className="hover:text-cyan-300 transition-colors">
                  UPSC Civil Services
                </Link>
              </li>
              <li>
                <Link to="/jobs/central" className="hover:text-cyan-300 transition-colors">
                  Staff Selection (SSC)
                </Link>
              </li>
              <li>
                <Link to="/jobs/central" className="hover:text-cyan-300 transition-colors">
                  Railway Recruitment (RRB)
                </Link>
              </li>
              <li>
                <Link to="/jobs/central" className="hover:text-cyan-300 transition-colors">
                  Banking & Insurance (IBPS/SBI)
                </Link>
              </li>
              <li>
                <Link to="/jobs/central" className="hover:text-cyan-300 transition-colors">
                  Defence (NDA, CDS, AFCAT)
                </Link>
              </li>
              <li>
                <Link to="/jobs/central" className="hover:text-cyan-300 transition-colors">
                  India Post (GDS)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Quick State Portals */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-200">
              State Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/jobs/states/bihar" className="hover:text-cyan-300 transition-colors">
                  Bihar (BPSC / BSSC)
                </Link>
              </li>
              <li>
                <Link to="/jobs/states/uttar-pradesh" className="hover:text-cyan-300 transition-colors">
                  Uttar Pradesh (UPPSC / UPSSSC)
                </Link>
              </li>
              <li>
                <Link to="/jobs/states/rajasthan" className="hover:text-cyan-300 transition-colors">
                  Rajasthan (RPSC / RSMSSB)
                </Link>
              </li>
              <li>
                <Link to="/jobs/states/madhya-pradesh" className="hover:text-cyan-300 transition-colors">
                  Madhya Pradesh (MPPSC)
                </Link>
              </li>
              <li>
                <Link to="/jobs/states/delhi" className="hover:text-cyan-300 transition-colors">
                  Delhi (DSSSB)
                </Link>
              </li>
              <li>
                <Link to="/jobs/states" className="text-cyan-400 hover:text-cyan-300 font-medium">
                  View All 36 States & UTs →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Notice Box */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-8 text-xs text-slate-400 space-y-1.5">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Disclaimer & Official Source Information:
          </p>
          <p className="leading-relaxed">
            StudyMate Sarkari is an informational portal. We encourage all candidates to verify specific vacancy notices, eligibility requirements, and deadlines on respective official recruitment portals (e.g., upsc.gov.in, ssc.gov.in, state public service commissions).
          </p>
        </div>

          {/* Bottom copyright line */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} StudyMate Sarkari. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-6">
              <Link to="/notifications" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                🔔 Alert Preferences
              </Link>
              <Link to="/about" className="hover:text-slate-200 transition-colors">
                About
              </Link>
              <Link to="/contact" className="hover:text-slate-200 transition-colors">
                Contact & Support
              </Link>
              <Link to="/search" className="hover:text-slate-200 transition-colors">
                Search Portal
              </Link>
            </div>
          </div>
      </div>
    </footer>
  );
};
