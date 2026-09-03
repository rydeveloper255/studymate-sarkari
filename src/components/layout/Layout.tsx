import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { LiveTicker } from '../ui/LiveTicker';
import { NotificationPreferencesModal } from '../notifications/NotificationPreferencesModal';
import { NotificationToast } from '../notifications/NotificationToast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pathname } = useLocation();

  // Scroll to top automatically on route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#080c15] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Live Alerts Ticker */}
      <LiveTicker />

      {/* Main Responsive Header */}
      <Header />

      {/* Main Dynamic Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Dedicated Mobile Bottom Navigation (Hidden on Desktop) */}
      <MobileBottomNav />

      {/* Global Tailored Notification Components */}
      <NotificationPreferencesModal />
      <NotificationToast />
    </div>
  );
};
