// Web Push Notification Service for StudyMate Sarkari

export interface NotificationPreferences {
  enabled: boolean;
  newJobs: boolean;
  admitCards: boolean;
  results: boolean;
  closingAlerts: boolean;
}

const STORAGE_KEY = 'studymate_push_prefs';

class PushNotificationService {
  private prefs: NotificationPreferences = {
    enabled: false,
    newJobs: true,
    admitCards: true,
    results: true,
    closingAlerts: true,
  };

  constructor() {
    this.loadPrefs();
  }

  private loadPrefs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.prefs = { ...this.prefs, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
  }

  public getPrefs(): NotificationPreferences {
    return { ...this.prefs };
  }

  public savePrefs(newPrefs: Partial<NotificationPreferences>) {
    this.prefs = { ...this.prefs, ...newPrefs };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
    } catch {
      // ignore
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      this.savePrefs({ enabled: granted });
      if (granted) {
        this.sendAlert({
          title: '🔔 Sarkari Push Alerts Activated!',
          body: 'You will now receive instant breaking notifications for new vacancies, admit cards, and results.',
          tag: 'welcome-notification',
        });
      }
      return granted;
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      return false;
    }
  }

  public sendAlert(options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    url?: string;
  }) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notif = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo.png',
        badge: '/logo.png',
        tag: options.tag || 'studymate-alert',
      });

      notif.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
        notif.close();
      };

      return true;
    } catch (e) {
      console.warn('Error displaying native Notification:', e);
      return false;
    }
  }
}

export const notificationService = new PushNotificationService();
