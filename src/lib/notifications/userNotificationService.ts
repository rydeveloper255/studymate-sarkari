/**
 * StudyMate Sarkari — Client-Side User Notification Service
 * Manages push permissions, local preference storage, audio chimes, and job matching filters.
 */

import { UserNotificationPreferences, NotificationToastPayload } from '../../types/notifications';
import { JobVacancy } from '../../types';
import { NOTIFICATION_CATEGORIES } from '../../data/notificationOptions';

const STORAGE_KEY = 'studymate_user_notification_preferences_v1';
const NOTIFIED_CACHE_KEY = 'studymate_notified_job_ids_v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
  enabled: true,
  browserPushGranted: false,
  categories: [
    'SSC',
    'Railway',
    'Police',
    'Banking',
    'UPSC',
    'Defence',
  ],
  states: ['ALL'], // Default to All India
  alertTypes: {
    newVacancies: true,
    admitCards: true,
    results: true,
    answerKeys: true,
    closingSoon: true,
  },
  soundEnabled: true,
  minVacanciesOnly: false,
  minVacanciesThreshold: 50,
  updatedAt: new Date().toISOString(),
};

/**
 * Register Service Worker if supported by browser environment
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('[Notification Service] Service Worker registration skipped or failed:', err);
    return null;
  }
}

/**
 * Check current native browser push permission
 */
export function getBrowserPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request native browser notification permission
 */
export async function requestBrowserPushPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    const prefs = getStoredPreferences();
    prefs.browserPushGranted = permission === 'granted';
    saveNotificationPreferences(prefs);

    if (permission === 'granted') {
      await registerNotificationServiceWorker();
    }

    return permission;
  } catch (err) {
    console.error('[Notification Service] Error requesting push permission:', err);
    return 'denied';
  }
}

/**
 * Load stored notification preferences from localStorage
 */
export function getStoredPreferences(): UserNotificationPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Check if browser permission is already granted
      const browserState = getBrowserPermissionState();
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        browserPushGranted: browserState === 'granted',
      };
    }
    const parsed = JSON.parse(stored) as UserNotificationPreferences;
    const browserState = getBrowserPermissionState();
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
      browserPushGranted: browserState === 'granted',
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Save notification preferences to localStorage and sync to server
 */
export function saveNotificationPreferences(prefs: UserNotificationPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    const updated: UserNotificationPreferences = {
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom event so all open UI components react synchronously
    window.dispatchEvent(
      new CustomEvent('studymate_notification_prefs_changed', {
        detail: updated,
      })
    );

    // Asynchronously sync with server API
    syncPreferencesWithServer(updated).catch(() => {});
  } catch (err) {
    console.warn('[Notification Service] Failed to save preferences to localStorage:', err);
  }
}

/**
 * Asynchronous sync with server endpoint
 */
async function syncPreferencesWithServer(prefs: UserNotificationPreferences): Promise<void> {
  try {
    await fetch('/api/v1/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
  } catch {
    // Non-blocking sync error
  }
}

/**
 * Synthesize a gentle audio chime using Web Audio API (no external MP3 asset needed)
 */
export function playAlertChime(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second harmonious tone (880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.52);
  } catch {
    // Web Audio blocked by browser autoplay policy if user has not interacted
  }
}

/**
 * Trigger a native system notification with tailored content
 */
export async function triggerBrowserNotification(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const permission = getBrowserPermissionState();
  if (permission !== 'granted') {
    return false;
  }

  try {
    // Attempt through Service Worker first for persistent background display
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(payload.title, {
          body: payload.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: payload.tag || `studymate-${Date.now()}`,
          data: { url: payload.url || '/jobs' },
        } as NotificationOptions);
        return true;
      }
    }

    // Fallback to in-window Notification constructor
    if ('Notification' in window) {
      const n = new Notification(payload.title, {
        body: payload.body,
        icon: '/favicon.ico',
        tag: payload.tag || `studymate-${Date.now()}`,
      });
      n.onclick = () => {
        n.close();
        if (payload.url) {
          window.location.href = payload.url;
        }
      };
      return true;
    }
  } catch (err) {
    console.warn('[Notification Service] Direct browser notification failed:', err);
  }

  return false;
}

/**
 * Send an immediate tailored Test Notification based on current user preferences
 */
export async function sendTailoredTestNotification(
  prefs: UserNotificationPreferences,
  onToast?: (toast: NotificationToastPayload) => void
): Promise<{ success: boolean; message: string }> {
  const selectedCats = prefs.categories.length > 0 ? prefs.categories.slice(0, 2).join(' & ') : 'All India';
  const stateDesc = prefs.states.includes('ALL')
    ? 'All India'
    : `${prefs.states.slice(0, 2).join(', ')}${prefs.states.length > 2 ? ` (+${prefs.states.length - 2} more)` : ''}`;

  const title = `StudyMate Sarkari Alert`;
  const body = `Tailored alert active for ${selectedCats} vacancies in ${stateDesc}. You will receive verified notifications as soon as official forms open!`;
  const url = '/jobs';

  if (prefs.soundEnabled) {
    playAlertChime();
  }

  const toastPayload: NotificationToastPayload = {
    id: `test_${Date.now()}`,
    title: 'Notification Alert Configured',
    organization: 'StudyMate Sarkari Alerts',
    message: body,
    category: selectedCats,
    stateName: stateDesc,
    url,
    timestamp: 'Just now',
  };

  if (onToast) {
    onToast(toastPayload);
  }

  const permission = getBrowserPermissionState();
  if (permission === 'granted') {
    await triggerBrowserNotification({
      title,
      body,
      url,
      tag: 'studymate-test-alert',
    });
    return {
      success: true,
      message: 'Test notification sent to your system notification tray!',
    };
  } else if (permission === 'denied') {
    return {
      success: false,
      message: 'Browser notifications are blocked in your browser settings. In-app alerts are active.',
    };
  } else {
    return {
      success: true,
      message: 'In-app alert test succeeded. Enable browser push permission to receive alerts outside this tab.',
    };
  }
}

/**
 * Filter a list of jobs based on the user's active notification preferences
 */
export function filterJobsByPreferences(
  jobs: JobVacancy[],
  prefs: UserNotificationPreferences
): JobVacancy[] {
  if (!prefs.enabled) {
    return [];
  }

  const userCats = new Set(prefs.categories.map((c) => c.toLowerCase().trim()));
  const userStates = new Set(prefs.states.map((s) => s.toUpperCase().trim()));
  const allowsAllIndia = userStates.has('ALL');

  return jobs.filter((job) => {
    // 1. Vacancy threshold check
    if (prefs.minVacanciesOnly && prefs.minVacanciesThreshold > 0) {
      const vacNum = typeof job.totalVacancies === 'number' ? job.totalVacancies : parseInt(String(job.totalVacancies).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(vacNum) && vacNum < prefs.minVacanciesThreshold) {
        return false;
      }
    }

    // 2. Category Match
    let matchesCategory = false;
    if (userCats.size === 0) {
      matchesCategory = true;
    } else {
      const jobCategory = (job.centralCategory || '').toLowerCase();
      const jobTitle = (job.title + ' ' + job.postName + ' ' + job.organization).toLowerCase();

      for (const cat of userCats) {
        if (cat === 'all') {
          matchesCategory = true;
          break;
        }
        if (cat === 'police' && (jobTitle.includes('police') || jobTitle.includes('cisf') || jobTitle.includes('bsf') || jobTitle.includes('crpf') || jobTitle.includes('constable') || jobTitle.includes('si '))) {
          matchesCategory = true;
          break;
        }
        if (cat === 'teaching' && (jobTitle.includes('teacher') || jobTitle.includes('tet') || jobTitle.includes('kvs') || jobTitle.includes('nvs') || jobTitle.includes('faculty') || jobTitle.includes('lecturer'))) {
          matchesCategory = true;
          break;
        }
        if (cat === 'defence' && (jobTitle.includes('army') || jobTitle.includes('navy') || jobTitle.includes('air force') || jobTitle.includes('defence') || jobTitle.includes('coast guard') || jobTitle.includes('nda') || jobTitle.includes('cds'))) {
          matchesCategory = true;
          break;
        }
        if (cat === 'railway' && (jobCategory.includes('railway') || jobTitle.includes('railway') || jobTitle.includes('rrb') || jobTitle.includes('rrc') || jobTitle.includes('ntpc'))) {
          matchesCategory = true;
          break;
        }
        if (cat === 'ssc' && (jobCategory.includes('ssc') || jobTitle.includes('ssc') || jobTitle.includes('staff selection'))) {
          matchesCategory = true;
          break;
        }
        if (cat === 'upsc' && (jobCategory.includes('upsc') || jobTitle.includes('upsc') || jobTitle.includes('union public service'))) {
          matchesCategory = true;
          break;
        }
        if (cat === 'banking' && (jobCategory.includes('bank') || jobTitle.includes('bank') || jobTitle.includes('ibps') || jobTitle.includes('sbi') || jobTitle.includes('rbi'))) {
          matchesCategory = true;
          break;
        }
        if (cat === 'public sector' && (jobCategory.includes('public sector') || jobCategory.includes('psu') || jobTitle.includes('ongc') || jobTitle.includes('bhel') || jobTitle.includes('iocl') || jobTitle.includes('sail') || jobTitle.includes('ntpc'))) {
          matchesCategory = true;
          break;
        }
        if (jobCategory.includes(cat) || jobTitle.includes(cat)) {
          matchesCategory = true;
          break;
        }
      }
    }

    if (!matchesCategory) return false;

    // 3. State/Region Match
    if (allowsAllIndia && job.sector === 'central') {
      return true;
    }

    if (job.sector === 'central' && !allowsAllIndia) {
      // User only wants specific states, but central job is All-India
      return false;
    }

    if (job.stateCode && userStates.has(job.stateCode.toUpperCase())) {
      return true;
    }

    if (job.stateName) {
      const stateNameUpper = job.stateName.toUpperCase();
      for (const st of userStates) {
        if (st !== 'ALL' && stateNameUpper.includes(st)) {
          return true;
        }
      }
    }

    return allowsAllIndia;
  });
}
