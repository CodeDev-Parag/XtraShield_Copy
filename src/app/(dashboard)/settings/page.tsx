'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useSecurityStore } from '@/store/securityStore';
import { useUserSession } from '@/hooks/useUserSession';
import {
  Settings,
  Key,
  Bell,
  Sparkles,
  CreditCard,
  User,
  Lock,
  Check,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const { update: updateSession } = useSession();
  const { plan: serverPlan } = useUserSession();

  // Plan comes from the session (sourced from DB via jwt callback).
  // Falls back to FREE while session is loading.
  const currentPlan = serverPlan;

  // apiKeys + notifications still live in Zustand for Phase 1. Phase 3 will
  // move these to a `UserPreferences` table + PATCH /api/user/preferences.
  const notifications = useSecurityStore((s) => s.notifications);
  const updateNotifications = useSecurityStore((s) => s.updateNotifications);
  const addScan = useSecurityStore((s) => s.addScan);

  // Component local states for inputs.
  const [keysSaved, setKeysSaved] = useState(false);

  // Profile local state — Phase 3 will wire to PATCH /api/user/profile.
  const [profileName, setProfileName] = useState('Secured User');
  const [profileSaved, setProfileSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  /**
   * Flip plan in DB via /api/user/upgrade.
   * Phase 6 replaces this with a Stripe Checkout redirect.
   */
  const handleUpgrade = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/user/upgrade', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to upgrade (${res.status})`);
      }
      await updateSession();
      toast.success('Upgraded to PRO.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to upgrade.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelPlan = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/user/upgrade', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to cancel (${res.status})`);
      }
      await updateSession();
      toast.success('Subscription returned to FREE.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to cancel subscription.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative font-mono">
      {/* Title */}
      <div className="border-b border-black pb-6">
        <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-[#0A0A0A] flex items-center gap-3 uppercase">
          <Settings className="w-8 h-8 text-[#0A0A0A]" />
          {'>'} SYSTEM CONFIGURATION
        </h1>
        <p className="mt-1 text-sm text-[#4B5563] font-mono">
          Manage system notification preferences, configure active API keys, update profile metadata, and check billing subscription details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: API Keys & Notifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active API Keys Form */}
          <div className="bg-white border border-black p-6 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Key className="w-5 h-5 text-[#0A0A0A]" />
              {'>'} DEVELOPER API CREDENTIALS
            </h2>
            <p className="text-xs text-[#4B5563] mb-6 font-mono leading-relaxed">
              Use your XtraShield API key to authenticate with all security scanning endpoints. Your key is generated automatically on account creation and can be found in your dashboard.
            </p>

            <div className="space-y-4">
              <div className="bg-[#F8F9FA] border border-black p-4 rounded-none">
                <label className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-bold mb-1.5 font-mono">
                  Your XtraShield API Key
                </label>
                <p className="text-xs text-[#0A0A0A] font-mono font-medium break-all">
                  Use this key in the <code className="bg-white border border-black px-1 py-0.5">Authorization: Bearer xtra_xxxxx</code> header for all API requests.
                </p>
              </div>
              <p className="text-[10px] text-[#4B5563] font-mono leading-relaxed">
                All external threat intelligence is handled server-side through XtraShield&rsquo;s secured proxy. No third-party API keys are required from your end.
              </p>
            </div>
          </div>

          {/* Notifications Toggles */}
          <div className="bg-white border border-black p-6 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Bell className="w-5 h-5 text-[#0A0A0A]" />
              {'>'} NOTIFICATION PREFERENCES
            </h2>

            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={() => updateNotifications({ emailAlerts: !notifications.emailAlerts })}
                  data-testid="checkbox-email-alerts"
                  className="rounded-none border-black text-black bg-white focus:ring-black w-4.5 h-4.5 mt-0.5 transition-colors duration-100 cursor-pointer"
                />
                <div className="text-xs font-mono">
                  <span className="font-bold text-[#0A0A0A] block uppercase">Critical Leak Alert Emails</span>
                  <span className="text-[#4B5563]">Send immediate e-mails if registered credentials match a newly scraping leak database.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer select-none pt-4 border-t border-black">
                <input
                  type="checkbox"
                  checked={notifications.weeklyDigest}
                  onChange={() => updateNotifications({ weeklyDigest: !notifications.weeklyDigest })}
                  data-testid="checkbox-weekly-digest"
                  className="rounded-none border-black text-black bg-white focus:ring-black w-4.5 h-4.5 mt-0.5 transition-colors duration-100 cursor-pointer"
                />
                <div className="text-xs font-mono">
                  <span className="font-bold text-[#0A0A0A] block uppercase">Weekly Security Digests</span>
                  <span className="text-[#4B5563]">Receive an aggregated summary report of password checks and network vulnerability scans.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer select-none pt-4 border-t border-black">
                <input
                  type="checkbox"
                  checked={notifications.browserNotifications}
                  onChange={() => updateNotifications({ browserNotifications: !notifications.browserNotifications })}
                  data-testid="checkbox-browser-push"
                  className="rounded-none border-black text-black bg-white focus:ring-black w-4.5 h-4.5 mt-0.5 transition-colors duration-100 cursor-pointer"
                />
                <div className="text-xs font-mono">
                  <span className="font-bold text-[#0A0A0A] block uppercase">In-App Browser Push</span>
                  <span className="text-[#4B5563]">Trigger desktop banners for completed SSL certificate inspection warnings.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Billing Plan & Profile Info */}
        <div className="space-y-6">
          {/* Subscription Tier */}
          <div className="bg-white border border-black p-6 space-y-4 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h2 className="text-sm font-heading font-bold text-[#0A0A0A] flex items-center gap-2 uppercase tracking-tight">
              <CreditCard className="w-4 h-4 text-[#0A0A0A]" />
              {'>'} SUBSCRIPTION STATUS
            </h2>

            <div
              className={`p-4 rounded-none border text-xs flex items-start space-x-3 font-mono ${
                currentPlan === 'PRO'
                  ? 'bg-[#DCFCE7] border-black text-[#16A34A]'
                  : 'bg-[#F8F9FA] border-black text-[#4B5563]'
              }`}
            >
              {currentPlan === 'PRO' ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-[#16A34A] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block text-[#0A0A0A] mb-0.5 uppercase tracking-tight">ExtraShield PRO Activated</strong>
                    All tools unlocked, including 24/7 dark web market scraping and verified push alerts.
                  </div>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-[#4B5563] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block text-[#0A0A0A] mb-0.5 uppercase tracking-tight">FREE Account Tier</strong>
                    Dark Web Monitor is currently locked. Upgrade to enable proactive leak alerts.
                  </div>
                </>
              )}
            </div>

            <div className="pt-2">
              {currentPlan === 'PRO' ? (
                <button
                  onClick={handleCancelPlan}
                  disabled={busy}
                  data-testid="cancel-subscription-button"
                  className="w-full py-2.5 bg-white hover:bg-[#FEE2E2] hover:text-[#DC2626] border border-black rounded-none text-xs font-heading font-bold transition-colors duration-100 cursor-pointer uppercase tracking-widest disabled:opacity-50"
                >
                  {busy ? 'PROCESSING…' : 'Cancel PRO Subscription'}
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={busy}
                  data-testid="upgrade-pro-button"
                  className="w-full py-3 bg-black hover:bg-[#16A34A] text-white font-heading font-bold text-xs rounded-none transition-colors duration-100 flex items-center justify-center cursor-pointer gap-2 border border-black uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  {busy ? 'PROCESSING…' : 'Upgrade to PRO ($9/month)'}
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white border border-black p-6 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h2 className="text-sm font-heading font-bold text-[#0A0A0A] mb-4 flex items-center gap-2 uppercase tracking-tight">
              <User className="w-4 h-4 text-[#0A0A0A]" />
              {'>'} SECURED PROFILE
            </h2>

            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-mono font-bold">
                  Display Alias
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  data-testid="input-profile-alias"
                  className="w-full bg-white border border-black rounded-none py-2.5 px-4 text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                data-testid="save-profile-button"
                className="w-full bg-black text-white hover:bg-[#16A34A] border border-black rounded-none font-heading font-bold py-2.5 transition-colors duration-100 cursor-pointer uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                {profileSaved ? 'Settings Saved' : 'Save Alias Details'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
