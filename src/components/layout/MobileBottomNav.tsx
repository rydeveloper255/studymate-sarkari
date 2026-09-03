import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Briefcase, MapPin, Bell, BellRing } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home,
    },
    {
      name: 'Jobs',
      path: '/jobs',
      icon: Briefcase,
    },
    {
      name: 'States',
      path: '/jobs/states',
      icon: MapPin,
    },
    {
      name: 'Alerts',
      path: '/notifications',
      icon: Bell,
    },
    {
      name: 'Updates',
      path: '/updates',
      icon: BellRing,
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1 shadow-2xl"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-cyan-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-medium tracking-tight truncate max-w-full">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
