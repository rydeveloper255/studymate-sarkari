import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchUpdates } from '../../lib/data/updates';
import { GovernmentUpdate } from '../../types';

export const LiveTicker: React.FC = () => {
  const [updates, setUpdates] = useState<GovernmentUpdate[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchUpdates({ pageSize: 5 }).then((res) => {
      if (mounted && res.data) {
        setUpdates(res.data);
      }
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 text-xs">
      <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase tracking-wider flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="hidden sm:inline">Latest Alerts:</span>
        </div>

        <div className="flex-1 flex items-center gap-4 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
          {updates.length > 0 ? (
            updates.map((item, index) => (
              <Link
                key={item.id}
                to={item.linkUrl || '/updates'}
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 transition-colors flex-shrink-0"
              >
                {index > 0 && <span className="text-slate-600 font-bold">•</span>}
                <span className="text-amber-400 font-medium">[{item.organization}]</span>
                <span className="truncate max-w-[280px] sm:max-w-[420px]">{item.title}</span>
              </Link>
            ))
          ) : (
            <span className="text-slate-400 italic">
              Official recruitment alerts, admit card releases, and exam updates will appear here in real time.
            </span>
          )}
        </div>

        <Link
          to="/updates"
          className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5 flex-shrink-0 ml-2"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
