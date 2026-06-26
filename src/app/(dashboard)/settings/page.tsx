'use client';

import React, { useState } from 'react';
import { useSecurityStore } from '@/store/securityStore';
import { usePersistedStore } from '@/store/usePersistedStore';
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
  ShieldAlert,
  Info
} from 'lucide-react';

export default function SettingsPage() {
  const storePlan = usePersistedStore(
    useSecurityStore,
    (state) => state.userPlan,
    'FREE'
  );
  
  const storeKeys = usePersistedStore(
    useSecurityStore,
    (state) => state.apiKeys,
    { hibp: '', virustotal: '' }
  );

  const storeNotifications = usePersistedStore(
    useSecurityStore,
    (state) => state.notifications,
    { emailAlerts: true, weeklyDigest: false, browserNotifications: true }
  );

  const { setPlan, updateApiKeys, updateNotifications, addScan } = useSecurityStore();

  // Component local states for inputs
  const [hibpKey, setHibpKey] = useState(storeKeys.hibp);
  const [vtKey, setVtKey] = useState(storeKeys.virustotal);
  const [keysSaved, setKeysSaved] = useState(false);

  // Profile mock states
  const [profileName, setProfileName] = useState('Secured User');
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiKeys({
      hibp: hibpKey.trim(),
      virustotal: vtKey.trim()
    });
    setKeysSaved(true);
    setTimeout(() => setKeysSaved(false), 2000);

    addScan({
      type: 'ssl',
      target: 'API Configuration',
      status: 'info',
      details: 'API credentials settings successfully updated.'
    });
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleUpgrade = () => {
    setPlan('PRO');
    addScan({
      type: 'ssl',
      target: 'Billing System',
      status: 'safe',
      details: 'Stripe webhook received: User upgraded to PRO plan successfully.'
    });
  };

  const handleCancelPlan = () => {
    setPlan('FREE');
    addScan({
      type: 'ssl',
      target: 'Billing System',
      status: 'warning',
      details: 'Subscription downgraded to FREE plan. Dark Web monitors suspended.'
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative font-mono">
      {/* Title */}
      <div className="border-b border-black pb-6">
        <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-[#0A0A0A] flex items-center gap-3 uppercase">
          <Settings className="w-8 h-8 text-[#0A0A0A]" />
          &gt; SYSTEM CONFIGURATION
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
              &gt; DEVELOPER API CREDENTIALS
            </h2>
            <p className="text-xs text-[#4B5563] mb-6 font-mono leading-relaxed">
              Enter your own Have I Been Pwned or VirusTotal API credentials. If left blank, ExtraShield falls back to realistic simulation sandboxes.
            </p>
            
            <form onSubmit={handleSaveKeys} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-widest font-mono">
                  Have I Been Pwned API Key
                </label>
                <input
                  type="password"
                  value={hibpKey}
                  onChange={(e) => setHibpKey(e.target.value)}
                  placeholder="Enter HIBP api-key..."
                  data-testid="input-hibp-key"
                  className="w-full bg-white border border-black rounded-none py-2.5 px-4 text-xs text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-widest font-mono">
                  VirusTotal v3 API Key
                </label>
                <input
                  type="password"
                  value={vtKey}
                  onChange={(e) => setVtKey(e.target.value)}
                  placeholder="Enter VirusTotal api-key..."
                  data-testid="input-virustotal-key"
                  className="w-full bg-white border border-black rounded-none py-2.5 px-4 text-xs text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                />
              </div>

              <button
                type="submit"
                data-testid="save-keys-button"
                className="w-full md:w-auto bg-black text-white hover:bg-[#16A34A] border border-black rounded-none font-heading font-bold py-2.5 px-6 text-xs transition-colors duration-100 flex items-center justify-center cursor-pointer uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                {keysSaved ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-[#16A34A]" />
                    Keys Configured
                  </>
                ) : (
                  'Save Key Configuration'
                )}
              </button>
            </form>
          </div>

          {/* Notifications Toggles */}
          <div className="bg-white border border-black p-6 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Bell className="w-5 h-5 text-[#0A0A0A]" />
              &gt; NOTIFICATION PREFERENCES
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={storeNotifications.emailAlerts}
                  onChange={() => updateNotifications({ emailAlerts: !storeNotifications.emailAlerts })}
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
                  checked={storeNotifications.weeklyDigest}
                  onChange={() => updateNotifications({ weeklyDigest: !storeNotifications.weeklyDigest })}
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
                  checked={storeNotifications.browserNotifications}
                  onChange={() => updateNotifications({ browserNotifications: !storeNotifications.browserNotifications })}
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
              &gt; SUBSCRIPTION STATUS
            </h2>
            
            <div className={`p-4 rounded-none border text-xs flex items-start space-x-3 font-mono ${
              storePlan === 'PRO' 
                ? 'bg-[#DCFCE7] border-black text-[#16A34A]'
                : 'bg-[#F8F9FA] border-black text-[#4B5563]'
            }`}>
              {storePlan === 'PRO' ? (
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
              {storePlan === 'PRO' ? (
                <button
                  onClick={handleCancelPlan}
                  data-testid="cancel-subscription-button"
                  className="w-full py-2.5 bg-white hover:bg-[#FEE2E2] hover:text-[#DC2626] border border-black rounded-none text-xs font-heading font-bold transition-colors duration-100 cursor-pointer uppercase tracking-widest"
                >
                  Cancel PRO Subscription
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  data-testid="upgrade-pro-button"
                  className="w-full py-3 bg-black hover:bg-[#16A34A] text-white font-heading font-bold text-xs rounded-none transition-colors duration-100 flex items-center justify-center cursor-pointer gap-2 border border-black uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  Upgrade to PRO ($9/month)
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white border border-black p-6 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h2 className="text-sm font-heading font-bold text-[#0A0A0A] mb-4 flex items-center gap-2 uppercase tracking-tight">
              <User className="w-4 h-4 text-[#0A0A0A]" />
              &gt; SECURED PROFILE
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

              <div className="space-y-2">
                <label className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-mono font-bold">
                  Secured Email Alias
                </label>
                <input
                  type="email"
                  value="demo@xtrashield.io"
                  disabled
                  className="w-full bg-[#F3F4F6] border border-black rounded-none py-2.5 px-4 text-xs text-[#4B5563] cursor-not-allowed font-mono"
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
