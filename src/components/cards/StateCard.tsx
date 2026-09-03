import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Briefcase } from 'lucide-react';
import { StateInfo } from '../../types';
import { Badge } from '../ui/Badge';

interface StateCardProps {
  state: StateInfo;
}

export const StateCard: React.FC<StateCardProps> = ({ state }) => {
  return (
    <Link
      to={`/jobs/states/${state.slug}`}
      className="group p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
            {state.code}
          </div>
          <Badge variant={state.type === 'state' ? 'primary' : 'purple'} size="sm">
            {state.type === 'state' ? 'State' : 'UT'}
          </Badge>
        </div>

        <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors font-display mb-1">
          {state.name}
        </h4>

        <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 text-slate-500" />
          <span>Capital: {state.capital}</span>
        </p>

        {state.highlightOrganizations.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {state.highlightOrganizations.slice(0, 2).map((org) => (
              <span
                key={org}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50"
              >
                {org}
              </span>
            ))}
            {state.highlightOrganizations.length > 2 && (
              <span className="text-[10px] px-1 py-0.5 text-slate-400">
                +{state.highlightOrganizations.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300 font-medium">
            {state.totalActiveVacanciesCount} Vacancies
          </span>
        </span>
        <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center">
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
};
