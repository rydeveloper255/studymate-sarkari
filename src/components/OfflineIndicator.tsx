import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-[#dc2626] text-white px-3.5 py-2 text-xs font-bold shadow-2xl border border-white/20 animate-pulse">
      <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
      <span>Offline Mode — Showing cached government exam notifications</span>
    </div>
  );
};
