import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Briefcase, MapPin, ArrowLeft } from 'lucide-react';
import { MetaTags } from '../components/seo/MetaTags';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-16 text-center space-y-6 max-w-lg mx-auto">
      <MetaTags
        title="404 — Page Not Found"
        description="The requested government job notification or examination update could not be found on StudyMate Sarkari."
        robots="noindex, nofollow"
      />

      <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-2xl font-black font-display">
        404
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          The requested page or vacancy link may have moved or does not exist on StudyMate Sarkari.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-600/30"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
        >
          <Search className="w-4 h-4 text-cyan-400" />
          <span>Search Jobs</span>
        </Link>
      </div>
    </div>
  );
};
