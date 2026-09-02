import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, BellRing, FileText, CheckCircle2, Key, Megaphone } from 'lucide-react';
import { GovernmentUpdate } from '../../types';
import { Badge } from '../ui/Badge';

interface UpdateCardProps {
  update: GovernmentUpdate;
}

export const UpdateCard: React.FC<UpdateCardProps> = ({ update }) => {
  const getCategoryIcon = () => {
    switch (update.category) {
      case 'recruitment':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'admit_card':
        return <BellRing className="w-4 h-4 text-cyan-400" />;
      case 'result':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'answer_key':
        return <Key className="w-4 h-4 text-purple-400" />;
      default:
        return <Megaphone className="w-4 h-4 text-amber-400" />;
    }
  };

  const getCategoryBadgeVariant = () => {
    switch (update.category) {
      case 'recruitment':
        return 'primary';
      case 'admit_card':
        return 'info';
      case 'result':
        return 'success';
      case 'answer_key':
        return 'purple';
      default:
        return 'warning';
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-slate-800/80 border border-slate-700/60">
              {getCategoryIcon()}
            </span>
            <Badge variant={getCategoryBadgeVariant()} size="sm">
              {update.badgeTag || update.category.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{update.date}</span>
            <Badge variant="demo" size="sm">DEMO</Badge>
          </div>
        </div>

        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mt-1 mb-1">
          {update.organization}
        </p>

        <h4 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-2 font-display">
          {update.title}
        </h4>

        <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {update.summary}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Recruitment Notice</span>
        {update.linkUrl ? (
          <Link
            to={update.linkUrl}
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Read Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className="text-xs text-slate-400">Notice Bulletin</span>
        )}
      </div>
    </div>
  );
};
