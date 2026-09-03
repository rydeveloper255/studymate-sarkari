import React from 'react';
import { Download, Calendar, Building2, ExternalLink } from 'lucide-react';
import { AdmitCardItem } from '../../types';
import { Badge } from '../ui/Badge';

interface AdmitCardCardProps {
  item: AdmitCardItem;
}

export const AdmitCardCard: React.FC<AdmitCardCardProps> = ({ item }) => {
  return (
    <div className="rounded-xl p-5 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <Badge variant={item.sector === 'central' ? 'primary' : 'purple'} size="sm">
            <Building2 className="w-3 h-3" />
            {item.sector === 'central' ? 'Central' : item.stateName || 'State'}
          </Badge>
          <div className="flex items-center gap-1.5">
            <Badge variant={item.status === 'Available' ? 'success' : 'warning'} size="sm">
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
            <span className="text-slate-400">Release Date:</span>
            <span className="font-semibold text-emerald-400">{item.releaseDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Exam Date:</span>
            <span className="font-semibold text-amber-300">{item.examDate}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400">Official Portal Link</span>
        <a
          href={item.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Hall Ticket</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </div>
    </div>
  );
};
