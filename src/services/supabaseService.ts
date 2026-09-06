import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  JobItem,
  AdmitCardItem,
  ResultItem,
  AnswerKeyItem,
  GovernmentSource,
  TelegramBotLog,
} from '../types';
import {
  INITIAL_JOBS,
  INITIAL_ADMIT_CARDS,
  INITIAL_RESULTS,
  INITIAL_ANSWER_KEYS,
  OFFICIAL_GOVERNMENT_SOURCES,
  INITIAL_BOT_LOGS,
} from '../data/mockData';

const SUPABASE_CONFIG_KEY = 'studymate_supabase_config';
const BOOKMARKS_STORAGE_KEY = 'studymate_saved_jobs';
const CUSTOM_SOURCES_STORAGE_KEY = 'studymate_custom_sources';
const BOT_LOGS_STORAGE_KEY = 'studymate_bot_logs';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  telegramAdminId: string;
  hasServiceRoleKey?: boolean;
  hasTelegramToken?: boolean;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    isConnected: false,
    telegramAdminId: '5165363865',
    hasServiceRoleKey: false,
    hasTelegramToken: false,
  };

  constructor() {
    this.loadConfig();
    this.fetchServerConfig();
  }

  private loadConfig() {
    try {
      // 1. Check Vite build-time environment variables
      const viteUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const viteKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

      if (viteUrl && viteKey) {
        this.config.url = viteUrl;
        this.config.anonKey = viteKey;
        this.client = createClient(viteUrl, viteKey);
        this.config.isConnected = true;
        return;
      }

      // 2. Fallback to localStorage
      const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.anonKey) {
          this.config.url = parsed.url;
          this.config.anonKey = parsed.anonKey;
          this.client = createClient(parsed.url, parsed.anonKey);
          this.config.isConnected = true;
        }
      }
    } catch {
      // fallback
    }
  }

  public async fetchServerConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.supabaseUrl && data.supabaseAnonKey && !this.client) {
          this.setConfig(data.supabaseUrl, data.supabaseAnonKey);
        }
        this.config.hasServiceRoleKey = data.hasServiceRoleKey;
        this.config.hasTelegramToken = data.hasTelegramToken;
        this.config.telegramAdminId = data.telegramAdminId || '5165363865';
      }
    } catch {
      // Offline / standalone
    }
  }

  public async sendTestTelegramAlert(customMessage?: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/telegram/test-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customMessage }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: '✅ Notification successfully sent to Telegram ID: 5165363865!' };
      }
      return { success: false, message: data.error || 'Failed to dispatch Telegram message' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error reaching server' };
    }
  }

  public setConfig(url: string, anonKey: string) {
    this.config = {
      ...this.config,
      url,
      anonKey,
      isConnected: !!(url && anonKey),
    };
    if (url && anonKey) {
      try {
        this.client = createClient(url, anonKey);
      } catch (err) {
        console.error('Supabase init error', err);
      }
    } else {
      this.client = null;
    }
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.config));
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  // --- JOBS ---
  public async getJobs(): Promise<JobItem[]> {
    if (this.client && this.config.isConnected) {
      try {
        const { data, error } = await this.client
          .from('sarkari_notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge dynamic Supabase rows with rich standard jobs
          const dynamicJobs: JobItem[] = data.map((row: any) => ({
            id: String(row.id),
            title: row.title,
            shortTitle: row.title.length > 40 ? row.title.substring(0, 40) + '...' : row.title,
            department: row.department || 'Government Board',
            category: (row.category || 'SSC') as any,
            state: row.state || 'All India',
            advtNo: 'Notice 2025',
            vacanciesCount: parseInt(row.vacancies?.replace(/[^0-9]/g, '') || '100', 10),
            vacanciesFormatted: row.vacancies || 'Multiple',
            payScale: 'As per Govt Norms',
            payLevel: 'Standard Cadre',
            jobLocation: row.state || 'All India',
            applyMode: 'Online Portal',
            lastDate: row.last_date || 'Check Notice',
            lastDateTimestamp: new Date().toISOString(),
            examDate: 'To be notified',
            selectionProcess: 'Written / CBT Stage',
            qualificationSummary: "Bachelor's Degree or 10+2",
            qualificationLevel: 'Graduate',
            ageLimit: '18 - 30 Years',
            crucialAgeDate: '01-08-2025',
            feeGeneral: '₹ 100/-',
            feeReserved: '₹ 0/-',
            acceptedPaymentModes: 'Online Net Banking / UPI',
            isOfficialGazetteVerified: true,
            isNew: true,
            updatedTime: 'Live from Supabase',
            description: row.title,
            importantDates: [{ milestone: 'Official Scraped Date', date: new Date().toLocaleDateString() }],
            postWiseVacancies: [],
            examPatternTier1: [],
            directLinks: [{ title: 'Apply / View Notice', subtitle: 'Official Direct Link', url: row.url || '#', buttonText: 'Visit Portal', isExternal: true }],
            faqs: [],
          }));
          return [...dynamicJobs, ...INITIAL_JOBS];
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local dataset', e);
      }
    }
    return INITIAL_JOBS;
  }

  public async getJobById(id: string): Promise<JobItem | undefined> {
    const jobs = await this.getJobs();
    return jobs.find((j) => j.id === id);
  }

  // --- ADMIT CARDS ---
  public getAdmitCards(): AdmitCardItem[] {
    return INITIAL_ADMIT_CARDS;
  }

  // --- RESULTS ---
  public getResults(): ResultItem[] {
    return INITIAL_RESULTS;
  }

  // --- ANSWER KEYS ---
  public getAnswerKeys(): AnswerKeyItem[] {
    return INITIAL_ANSWER_KEYS;
  }

  // --- BOOKMARKS / SAVED JOBS ---
  public getBookmarks(): string[] {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['ssc-cgl-2025'];
    } catch {
      return ['ssc-cgl-2025'];
    }
  }

  public toggleBookmark(jobId: string): boolean {
    const list = this.getBookmarks();
    let isSaved = false;
    let updated: string[];
    if (list.includes(jobId)) {
      updated = list.filter((id) => id !== jobId);
      isSaved = false;
    } else {
      updated = [...list, jobId];
      isSaved = true;
    }
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
    return isSaved;
  }

  // --- GOVERNMENT SOURCES ---
  public getSources(): GovernmentSource[] {
    try {
      const saved = localStorage.getItem(CUSTOM_SOURCES_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return OFFICIAL_GOVERNMENT_SOURCES;
  }

  public addSource(newSource: Omit<GovernmentSource, 'id' | 'itemsFoundCount' | 'lastStatus'>): GovernmentSource {
    const sources = this.getSources();
    const created: GovernmentSource = {
      ...newSource,
      id: 'src-' + Date.now(),
      lastStatus: 'Active',
      itemsFoundCount: Math.floor(Math.random() * 8) + 2,
    };
    const updated = [created, ...sources];
    localStorage.setItem(CUSTOM_SOURCES_STORAGE_KEY, JSON.stringify(updated));
    return created;
  }

  public toggleSource(id: string): GovernmentSource[] {
    const sources = this.getSources().map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    localStorage.setItem(CUSTOM_SOURCES_STORAGE_KEY, JSON.stringify(sources));
    return sources;
  }

  // --- BOT LOGS ---
  public getBotLogs(): TelegramBotLog[] {
    try {
      const saved = localStorage.getItem(BOT_LOGS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_BOT_LOGS;
  }

  public addBotLog(log: Omit<TelegramBotLog, 'id' | 'timestamp'>) {
    const logs = this.getBotLogs();
    const newEntry: TelegramBotLog = {
      ...log,
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
    };
    const updated = [newEntry, ...logs.slice(0, 49)];
    localStorage.setItem(BOT_LOGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
}

export const supabaseService = new SupabaseService();
