import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserNotificationPreferences, NotificationToastPayload } from '../../types/notifications';
import {
  getStoredPreferences,
  saveNotificationPreferences,
  getBrowserPermissionState,
  requestBrowserPushPermission,
  sendTailoredTestNotification,
  registerNotificationServiceWorker,
} from './userNotificationService';

interface NotificationContextValue {
  preferences: UserNotificationPreferences;
  permissionState: 'granted' | 'denied' | 'default' | 'unsupported';
  isPreferencesModalOpen: boolean;
  activeToast: NotificationToastPayload | null;
  updatePreferences: (partial: Partial<UserNotificationPreferences>) => void;
  requestPermission: () => Promise<'granted' | 'denied' | 'default' | 'unsupported'>;
  sendTestAlert: () => Promise<{ success: boolean; message: string }>;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
  dismissToast: () => void;
  showToast: (toast: NotificationToastPayload) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserNotificationPreferences>(getStoredPreferences);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<NotificationToastPayload | null>(null);

  // Initialize service worker and check permission state on mount
  useEffect(() => {
    setPermissionState(getBrowserPermissionState());
    registerNotificationServiceWorker().catch(() => {});

    // Listen for cross-tab or local preference updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'studymate_user_notification_preferences_v1' && e.newValue) {
        try {
          setPreferences(JSON.parse(e.newValue));
        } catch {}
      }
    };

    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        setPreferences(e.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('studymate_notification_prefs_changed', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('studymate_notification_prefs_changed', handleCustomEvent);
    };
  }, []);

  // Update preferences with local save
  const updatePreferences = useCallback((partial: Partial<UserNotificationPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...partial };
      saveNotificationPreferences(updated);
      return updated;
    });
  }, []);

  // Request browser push permissions
  const requestPermission = useCallback(async () => {
    const result = await requestBrowserPushPermission();
    setPermissionState(result);
    if (result === 'granted') {
      updatePreferences({ browserPushGranted: true, enabled: true });
    }
    return result;
  }, [updatePreferences]);

  // Show Toast
  const showToast = useCallback((toast: NotificationToastPayload) => {
    setActiveToast(toast);
  }, []);

  // Dismiss Toast
  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Send Test Alert
  const sendTestAlert = useCallback(async () => {
    return await sendTailoredTestNotification(preferences, (toast) => {
      setActiveToast(toast);
    });
  }, [preferences]);

  const openPreferencesModal = useCallback(() => {
    setIsPreferencesModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsPreferencesModalOpen(false);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        permissionState,
        isPreferencesModalOpen,
        activeToast,
        updatePreferences,
        requestPermission,
        sendTestAlert,
        openPreferencesModal,
        closePreferencesModal: closeModal,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotificationPreferences() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationPreferences must be used within a NotificationProvider');
  }
  return context;
}
