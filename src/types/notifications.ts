/**
 * StudyMate Sarkari — User Notification Preference Types
 */

export interface JobCategoryOption {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconName: 'landmark' | 'compass' | 'train' | 'siren' | 'building' | 'shield' | 'graduation-cap' | 'factory' | 'mail' | 'heart-pulse' | 'scale' | 'layers';
  color: string;
}

export interface StateRegionOption {
  code: string;
  name: string;
  slug: string;
  type: 'all_india' | 'state' | 'ut';
  zone: 'All India' | 'Northern' | 'Southern' | 'Eastern' | 'Western' | 'Central' | 'North-Eastern' | 'UT';
  capital?: string;
}

export interface UserNotificationPreferences {
  enabled: boolean;
  browserPushGranted: boolean;
  categories: string[]; // e.g. ['UPSC', 'SSC', 'Railway', 'Police', 'Banking', 'Defence', 'Teaching', ...]
  states: string[];     // e.g. ['ALL', 'UP', 'BR', 'RJ', 'DL', ...]
  alertTypes: {
    newVacancies: boolean;
    admitCards: boolean;
    results: boolean;
    answerKeys: boolean;
    closingSoon: boolean;
  };
  soundEnabled: boolean;
  minVacanciesOnly: boolean;
  minVacanciesThreshold: number;
  lastNotifiedJobId?: string;
  updatedAt: string;
}

export interface NotificationToastPayload {
  id: string;
  title: string;
  organization: string;
  message: string;
  category?: string;
  stateName?: string;
  url?: string;
  timestamp: string;
}
