import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface QuickCategoryBarProps {
  activeTab: string;
  onNavigate: (tab: string, jobId?: string) => void;
  onOpenNotifications: () => void;
}

export const QuickCategoryBar: React.FC<QuickCategoryBarProps> = ({
  activeTab,
  onNavigate,
  onOpenNotifications,
}) => {
  const { language, t } = useLanguage();

  const chips = [
    {
      id: 'latest-jobs',
      label: language === 'hi' ? '🆕 नवीनतम नौकरियां' : '🆕 Latest Jobs',
      icon: 'work',
    },
    {
      id: 'admit-card',
      label: language === 'hi' ? '🎫 प्रवेश पत्र' : '🎫 Admit Card',
      icon: 'badge',
    },
    {
      id: 'results',
      label: language === 'hi' ? '🏆 परिणाम' : '🏆 Results',
      icon: 'workspace_premium',
    },
    {
      id: 'answer-key',
      label: language === 'hi' ? '🔑 उत्तर कुंजी' : '🔑 Answer Key',
      icon: 'key',
    },
    {
      id: 'eligibility-matcher',
      label: language === 'hi' ? '🎯 एआई पात्रता मैचर' : '🎯 AI Matcher',
      icon: 'psychology',
      highlight: true,
    },
    {
      id: 'exam-calendar',
      label: language === 'hi' ? '📅 परीक्षा कैलेंडर' : '📅 Exam Calendar',
      icon: 'calendar_month',
    },
    {
      id: 'candidate-tools',
      label: language === 'hi' ? '✂️ फोटो रिसाइज़र व टूल्स' : '✂️ Photo Resizer & Tools',
      icon: 'crop',
    },
    {
      id: 'state-wise',
      label: language === 'hi' ? '🗺️ राज्य अनुसार' : '🗺️ State Wise',
      icon: 'map',
    },
    {
      id: 'notifications_btn',
      label: language === 'hi' ? '🔔 पुश अलर्ट्स' : '🔔 Push Alerts',
      icon: 'notifications_active',
      isAction: true,
    },
  ];

  const handleClick = (chip: (typeof chips)[0]) => {
    if (chip.isAction) {
      onOpenNotifications();
    } else {
      onNavigate(chip.id);
    }
  };

  return (
    <div className="sticky top-[108px] sm:top-[128px] z-30 bg-white/95 dark:bg-[#070e1e]/95 backdrop-blur-md border-b border-[#d3e4fe]/80 dark:border-[#1e324c] shadow-xs py-2 px-3 sm:px-4 md:px-6 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 whitespace-nowrap w-full">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#757682] dark:text-[#94a3b8] flex items-center gap-1 shrink-0 mr-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            {language === 'hi' ? 'क्विक बार' : 'Quick'}
          </span>

          {chips.map((chip) => {
            const isActive = activeTab === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => handleClick(chip)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#00236f] dark:bg-[#2563eb] text-white shadow-xs scale-102'
                    : chip.highlight
                    ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-400/40 text-amber-900 dark:text-amber-300 font-extrabold hover:bg-amber-100 dark:hover:bg-amber-950/40'
                    : 'bg-[#eff4ff] dark:bg-[#0f172a] text-[#444651] dark:text-[#cbd5e1] hover:text-[#00236f] dark:hover:text-white hover:bg-[#dce9ff] dark:hover:bg-[#1e293b] border border-transparent dark:border-[#1e324c]'
                }`}
              >
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
