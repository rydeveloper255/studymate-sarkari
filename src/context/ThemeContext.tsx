import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDarkMode: boolean;
  eyeCareMode: boolean;
  toggleDarkMode: () => void;
  toggleEyeCareMode: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'studymate_theme';
const EYE_CARE_STORAGE_KEY = 'studymate_eye_care';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const [eyeCareMode, setEyeCareMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(EYE_CARE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const isDarkMode = theme === 'dark' || (theme === 'system' && systemIsDark);

  // Apply dark and eye-care classes to document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    if (eyeCareMode) {
      root.classList.add('eye-care-study');
    } else {
      root.classList.remove('eye-care-study');
    }
  }, [isDarkMode, eyeCareMode]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const toggleEyeCareMode = () => {
    setEyeCareMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EYE_CARE_STORAGE_KEY, String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        eyeCareMode,
        toggleDarkMode,
        toggleEyeCareMode,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
