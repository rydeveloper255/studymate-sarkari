import React from 'react';
import { Award, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import { ResultItem } from '../../types';
import { Badge } from '../ui/Badge';

interface ResultCardProps {
  item: ResultItem;
}

export const ResultCard: React.FC<ResultCardProps> = ({ item }) => {
  return (
    <div className="rounded-xl p-5 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <Badge variant={item.sector === 'central' ? 'primary' : 'purple'} size="sm">
            {item.sector === 'central' ? 'Central' : item.stateName || 'State'}
          </Badge>
          <div className="flex items-center gap-1.5">
            <Badge variant="demo" size="sm">DEMO</Badge>
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3" />
              {item.status}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">
          {item.organization}
        </p>

        <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors mb-3 font-display">
          {item.title}
        </h4>

        <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/50 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Exam:</span>
            <span className="font-medium text-slate-200 truncate max-w-[200px]">{item.examName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Declaration Date:</span>
            <span className="font-semibold text-emerald-400">{item.resultDate}</span>
          </div>
          {item.cutOffAvailable && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cut-off Marks:</span>
              <span className="text-cyan-400 font-medium">Included with Scorecard</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400">Scorecard / Merit list</span>
        <a
          href={item.viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
        >
          <Award className="w-3.5 h-3.5" />
          <span>View Result (Demo Link)</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </div>
    </div>
  );
};
