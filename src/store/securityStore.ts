import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MonitoredEmail {
  id: string;
  email: string;
  isVerified: boolean;
  alertsEnabled: boolean;
  breachCount: number;
  breaches: any[];
  addedAt: string;
}

export interface SecurityScan {
  id: string;
  type: 'password' | 'email' | 'network' | 'phishing' | 'ssl';
  target: string;
  status: 'safe' | 'warning' | 'danger' | 'info';
  timestamp: string;
  details: string;
}

interface SecurityState {
  monitoredEmails: MonitoredEmail[];
  recentScans: SecurityScan[];
  userPlan: 'FREE' | 'PRO';
  notifications: {
    emailAlerts: boolean;
    weeklyDigest: boolean;
    browserNotifications: boolean;
  };
  addMonitoredEmail: (email: string, breachCount?: number, breaches?: any[]) => void;
  verifyEmail: (id: string) => void;
  removeMonitoredEmail: (id: string) => void;
  toggleEmailAlerts: (id: string) => void;
  addScan: (scan: Omit<SecurityScan, 'id' | 'timestamp'>) => void;
  clearScans: () => void;
  setPlan: (plan: 'FREE' | 'PRO') => void;
  updateNotifications: (notifications: Partial<SecurityState['notifications']>) => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      monitoredEmails: [
        {
          id: '1',
          email: 'demo@xtrashield.io',
          isVerified: true,
          alertsEnabled: true,
          breachCount: 2,
          breaches: [
            { name: 'Adobe', date: '2013-10-04', description: 'Compromised email addresses and password hashes.' },
            { name: 'Canva', date: '2019-05-24', description: 'Usernames, real names, email addresses, and passwords.' }
          ],
          addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          email: 'test-user@gmail.com',
          isVerified: false,
          alertsEnabled: false,
          breachCount: 0,
          breaches: [],
          addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      recentScans: [
        {
          id: 's1',
          type: 'password',
          target: '••••••••••••',
          status: 'safe',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          details: 'Password not found in breach databases. Excellent strength.'
        },
        {
          id: 's2',
          type: 'network',
          target: '8.8.8.8',
          status: 'safe',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          details: 'No critical ports open. Safe IP reputation.'
        }
      ],
      userPlan: 'FREE',
      notifications: {
        emailAlerts: true,
        weeklyDigest: false,
        browserNotifications: true
      },

      addMonitoredEmail: (email, breachCount = 0, breaches = []) =>
        set((state) => {
          if (state.monitoredEmails.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
            return state;
          }
          const newEmail: MonitoredEmail = {
            id: Math.random().toString(36).substring(2, 9),
            email,
            isVerified: false,
            alertsEnabled: true,
            breachCount,
            breaches,
            addedAt: new Date().toISOString()
          };
          return { monitoredEmails: [newEmail, ...state.monitoredEmails] };
        }),

      verifyEmail: (id) =>
        set((state) => ({
          monitoredEmails: state.monitoredEmails.map((m) =>
            m.id === id ? { ...m, isVerified: true } : m
          )
        })),

      removeMonitoredEmail: (id) =>
        set((state) => ({
          monitoredEmails: state.monitoredEmails.filter((m) => m.id !== id)
        })),

      toggleEmailAlerts: (id) =>
        set((state) => ({
          monitoredEmails: state.monitoredEmails.map((m) =>
            m.id === id ? { ...m, alertsEnabled: !m.alertsEnabled } : m
          )
        })),

      addScan: (scan) =>
        set((state) => {
          const newScan: SecurityScan = {
            ...scan,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString()
          };
          return { recentScans: [newScan, ...state.recentScans].slice(0, 50) };
        }),

      clearScans: () => set({ recentScans: [] }),

      setPlan: (plan) => set({ userPlan: plan }),

      updateNotifications: (notifications) =>
        set((state) => ({ notifications: { ...state.notifications, ...notifications } }))
    }),
    {
      name: 'xtrashield-security-state',
    }
  )
);
