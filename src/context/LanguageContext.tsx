import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation
  nav_home: { en: 'Home', hi: 'होम' },
  nav_latest_jobs: { en: 'Latest Jobs', hi: 'नवीनतम भर्तियां' },
  nav_admit_card: { en: 'Admit Card', hi: 'प्रवेश पत्र' },
  nav_results: { en: 'Results', hi: 'परिणाम' },
  nav_answer_key: { en: 'Answer Key', hi: 'उत्तर कुंजी' },
  nav_state_wise: { en: 'State Wise', hi: 'राज्य अनुसार' },
  nav_all_india: { en: 'All India', hi: 'अखिल भारतीय' },
  nav_exam_calendar: { en: 'Exam Calendar', hi: 'परीक्षा कैलेंडर' },
  nav_candidate_tools: { en: 'Candidate Tools', hi: 'अभ्यर्थी टूल्स' },
  nav_eligibility_matcher: { en: 'AI Eligibility Matcher', hi: 'योग्यता मैचर' },
  nav_photo_resizer: { en: 'Photo Resizer', hi: 'फोटो रिसाइज़र' },

  // Header & Search
  search_placeholder: {
    en: 'Search jobs, exams, results, admit cards...',
    hi: 'भर्ती, परीक्षा, परिणाम या प्रवेश पत्र खोजें...',
  },
  live_updates: { en: 'Live Updates', hi: 'लाइव अपडेट' },
  aspirant_zone: { en: 'Aspirant Zone', hi: 'अभ्यर्थी कॉर्नर' },
  saved_jobs: { en: 'Saved Jobs', hi: 'सहेजी गई भर्तियां' },
  join_telegram: { en: 'Join Telegram', hi: 'टेलीग्राम से जुड़ें' },
  join_whatsapp: { en: 'WhatsApp Channel', hi: 'व्हाट्सएप चैनल' },
  official_verified: { en: '100% Official', hi: '100% आधिकारिक' },

  // Hero Section
  hero_title_prefix: { en: 'Find Verified', hi: 'खोजें सत्यापित' },
  hero_title_highlight: { en: 'Government Job Vacancies', hi: 'सरकारी नौकरियां' },
  hero_title_suffix: { en: 'Across India', hi: 'संपूर्ण भारत में' },
  hero_subtitle: {
    en: 'Real-time updates for Central Ministries, SSC, UPSC, Railways, Banking, Defence, State PSCs & Police recruitments.',
    hi: 'केंद्र सरकार, एसएससी, यूपीएससी, रेलवे, बैंकिंग, रक्षा, राज्य पीएससी और पुलिस भर्तियों की रियल-टाइम आधिकारिक जानकारी।',
  },
  search_button: { en: 'Search Vacancies', hi: 'भर्तियां खोजें' },

  // Action Buttons
  apply_online: { en: 'Apply Online', hi: 'ऑनलाइन आवेदन करें' },
  download_notification: { en: 'Official Notification', hi: 'आधिकारिक विज्ञप्ति' },
  view_details: { en: 'View Details', hi: 'विवरण देखें' },
  download_summary_pdf: { en: '1-Page Summary (PDF)', hi: '1-पेज समरी (PDF)' },
  share_job: { en: 'Share Vacancy', hi: 'भर्ती शेयर करें' },
  discuss_forum: { en: 'Aspirant Discussion', hi: 'अभ्यर्थी चर्चा मंच' },

  // Badges
  badge_closing_soon: { en: 'Closing Soon', hi: 'अंतिम तिथि निकट' },
  badge_closing_24h: { en: 'Ending in 24h', hi: '24 घंटे शेष' },
  badge_new_today: { en: 'New Today', hi: 'आज जारी' },
  badge_admit_card_out: { en: 'Admit Card Out', hi: 'प्रवेश पत्र जारी' },
  badge_result_declared: { en: 'Result Declared', hi: 'परिणाम घोषित' },

  // Quick Category Bar
  cat_trending: { en: 'Trending', hi: 'ट्रेंडिंग' },
  cat_all_jobs: { en: 'All Jobs', hi: 'सभी नौकरियां' },
  cat_matcher: { en: 'AI Matcher', hi: 'स्मार्ट मैचर' },
  cat_calendar: { en: 'Calendar', hi: 'कैलेंडर' },
  cat_resizer: { en: 'Photo Tool', hi: 'फोटो टूल' },
  cat_push_alerts: { en: 'Push Alerts', hi: 'पुश अलर्ट' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'studymate_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === 'en' || saved === 'hi') return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const t = (key: string, defaultText?: string): string => {
    const item = TRANSLATIONS[key];
    if (!item) return defaultText || key;
    return item[language] || item.en || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
