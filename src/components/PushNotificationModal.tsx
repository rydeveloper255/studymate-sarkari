import React, { useState, useEffect } from 'react';
import { notificationService, NotificationPreferences } from '../services/notificationService';
import { useLanguage } from '../context/LanguageContext';

export interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const { language } = useLanguage();
  const [prefs, setPrefs] = useState<NotificationPreferences>(notificationService.getPrefs());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const isSupported = notificationService.isSupported();

  useEffect(() => {
    if (isOpen) {
      setPrefs(notificationService.getPrefs());
      setPermission(notificationService.getPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermission());
    if (granted) {
      setPrefs(notificationService.getPrefs());
      onToast('✅ Browser Push Notifications Enabled!');
    } else {
      onToast('⚠️ Push notification permission was not granted.');
    }
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    notificationService.savePrefs(updated);
  };

  const handleTestAlert = () => {
    const sent = notificationService.sendAlert({
      title: '🚨 Test Alert: SSC CGL 2025 Tier-1 City Slip',
      body: 'Exam City Intimation Slip is live now! Check center and shift details.',
      url: window.location.href,
    });
    if (sent) {
      onToast('🔔 Test notification sent to your device!');
    } else {
      onToast('⚠️ Please allow notification permission in your browser first.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff] dark:border-[#1e324c]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00236f] dark:bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px] text-amber-300">
                notifications_active
              </span>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-[#0b1c30] dark:text-white">
                {language === 'hi' ? 'पुश नोटिफिकेशन सेटिंग्स' : 'Live Browser Push Alerts'}
              </h3>
              <p className="text-[11px] text-[#757682] dark:text-[#94a3b8]">
                {language === 'hi'
                  ? 'रियल-टाइम सरकारी भर्ती व एडमिट कार्ड अलर्ट्स'
                  : 'Get instant pop-up alerts on your device'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#eff4ff] dark:bg-[#1e293b] text-[#444651] dark:text-white flex items-center justify-center hover:bg-[#dce9ff]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Status Box */}
        <div className="p-3.5 rounded-2xl bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#757682] dark:text-[#94a3b8] block uppercase">
              {language === 'hi' ? 'ब्राउज़र अनुमति स्थिति' : 'Permission Status'}
            </span>
            <span
              className={`text-xs font-black capitalize flex items-center gap-1 mt-0.5 ${
                permission === 'granted'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : permission === 'denied'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              {permission === 'granted'
                ? language === 'hi' ? 'सक्रिय (Allowed)' : 'Allowed / Active'
                : permission === 'denied'
                ? language === 'hi' ? 'अस्वीकृत (Blocked in Browser)' : 'Blocked in Browser'
                : language === 'hi' ? 'अनुमति की आवश्यकता (Not Set)' : 'Permission Needed'}
            </span>
          </div>

          {permission !== 'granted' ? (
            <button
              onClick={handleEnableNotifications}
              className="px-3.5 py-2 bg-[#00236f] hover:bg-[#00174c] text-white text-xs font-black rounded-xl shadow-xs transition-all hover:scale-105 cursor-pointer"
            >
              {language === 'hi' ? 'अनुमति दें' : 'Allow Alerts'}
            </button>
          ) : (
            <button
              onClick={handleTestAlert}
              className="px-3.5 py-1.5 bg-[#85f8c4] hover:bg-[#6ee7b7] text-[#002114] text-xs font-black rounded-xl shadow-xs transition-all hover:scale-105 cursor-pointer"
            >
              {language === 'hi' ? 'टेस्ट अलर्ट भेजें' : 'Send Test Alert'}
            </button>
          )}
        </div>

        {/* Notification Topics */}
        <div className="space-y-2.5 text-xs">
          <span className="font-bold text-[#444651] dark:text-[#cbd5e1] block text-[11px] uppercase tracking-wider">
            {language === 'hi' ? 'सूचना श्रेणियां (Alert Channels)' : 'Select Alert Topics'}
          </span>

          {[
            {
              key: 'newJobs' as const,
              label: language === 'hi' ? 'नई सरकारी नौकरियां (New Vacancies)' : 'New Govt Vacancies (100+ Posts)',
              desc: 'UPSC, SSC, Railway, Banking, Police',
            },
            {
              key: 'admitCards' as const,
              label: language === 'hi' ? 'एडमिट कार्ड व परीक्षा सिटी स्लिप' : 'Admit Cards & Exam City Intimations',
              desc: 'Direct hall ticket download server alert',
            },
            {
              key: 'results' as const,
              label: language === 'hi' ? 'सर्कल व कट-ऑफ रिजल्ट' : 'Sarkari Results & Cut-off Merit Lists',
              desc: 'Final scorecards and selection lists',
            },
            {
              key: 'closingAlerts' as const,
              label: language === 'hi' ? 'अंतिम तिथि अलर्ट (24 घंटे शेष)' : 'Form Closing Urgency (24h Left)',
              desc: 'Never miss any application deadline',
            },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => handleTogglePref(item.key)}
              className="flex items-center justify-between p-2.5 rounded-xl border border-[#eff4ff] dark:border-[#1e324c] hover:bg-[#eff4ff] dark:hover:bg-[#1e293b] cursor-pointer transition-colors"
            >
              <div>
                <p className="font-bold text-[#0b1c30] dark:text-white leading-tight">{item.label}</p>
                <p className="text-[10px] text-[#757682] dark:text-[#94a3b8]">{item.desc}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                  prefs[item.key]
                    ? 'bg-[#00236f] dark:bg-[#38bdf8] border-[#00236f] text-white'
                    : 'border-[#c5c5d3] dark:border-[#475569]'
                }`}
              >
                {prefs[item.key] && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center justify-between text-xs">
          <p className="text-[10px] text-[#757682] dark:text-[#94a3b8]">
            {isSupported
              ? 'Works 100% locally via browser ServiceWorker'
              : 'Push notifications are not supported in this browser'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#eff4ff] dark:bg-[#1e293b] text-[#0b1c30] dark:text-white font-bold rounded-xl hover:bg-[#dce9ff]"
          >
            {language === 'hi' ? 'पूर्ण' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
