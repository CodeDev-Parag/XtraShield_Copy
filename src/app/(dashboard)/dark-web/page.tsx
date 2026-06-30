'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMonitoredEmails, type MonitoredEmailDTO } from '@/hooks/useMonitoredEmails';
import {
  Lock,
  Sparkles,
  Eye,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Clock,
  RefreshCw,
  Server,
  Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';

export default function DarkWebMonitorPage() {
  const { data: session, update: updateSession } = useSession();
  const userPlan: 'FREE' | 'PRO' = session?.user?.plan === 'PRO' ? 'PRO' : 'FREE';

  const { data: monitoredEmails = [], refetch: refetchEmails, isFetching } = useMonitoredEmails();

  const handleUpgrade = async () => {
    // Phase 1: directly flip plan in DB via /api/user/upgrade (free, no Stripe).
    // Phase 6 will swap this for Stripe Checkout.
    try {
      const res = await fetch('/api/user/upgrade', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to upgrade (${res.status})`);
      }
      await updateSession();
      toast.success('Upgraded to PRO. Dark Web Monitor unlocked.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to upgrade.');
    }
  };

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  // Trigger dark web scan — re-runs breach check on every monitored email.
  const handleScanDarkWeb = async () => {
    if (isScanning) return;
    if (monitoredEmails.length === 0) {
      toast.warning('Add at least one email to your Watch List first.');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    const steps = [
      'Connecting to breach intelligence network...',
      'Re-checking monitored emails against latest breach corpus...',
      'Cross-referencing new leaks with your watch list...',
      'Generating incident report...',
    ];

    for (let i = 0; i < steps.length - 1; i++) {
      setScanMessage(steps[i]);
      setScanProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setScanMessage('Re-scanning monitored emails...');
    setScanProgress(80);

    const ids = monitoredEmails.map((m) => m.id);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/monitored-emails/${id}`, { method: 'PUT' }).then((r) =>
          r.ok ? r.json() : null
        )
      )
    );

    let newAlerts = 0;
    for (const r of results) {
      if (
        r.status === 'fulfilled' &&
        r.value &&
        typeof r.value.previousCount === 'number'
      ) {
        const next = r.value.email?.breachCount ?? r.value.previousCount;
        if (next > r.value.previousCount) newAlerts++;
      }
    }

    await refetchEmails();
    setScanProgress(100);
    setScanMessage(
      newAlerts > 0
        ? `Done. ${newAlerts} new breach(es) detected — see Alerts.`
        : 'Done. No new breaches detected.'
    );

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage('');
    }, 1500);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative font-mono">
      {/* Title */}
      <div className="border-b border-black pb-6">
        <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-[#0A0A0A] flex items-center gap-3 uppercase">
          <Eye className="w-8 h-8 text-[#0A0A0A]" />
          &gt; DARK WEB MONITOR
        </h1>
        <p className="mt-2 text-sm text-[#4B5563] font-medium font-mono">
          Proactive monitoring of credentials, passwords, and identity records leaked on onion network black markets and paste sites.
        </p>
      </div>

      {/* Plan Gate Overlay */}
      {userPlan === 'FREE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 border border-black p-8 text-center min-h-[500px] rounded-none">
          <div className="bg-white border border-black p-6 rounded-none max-w-md w-full space-y-6">
            <div className="w-16 h-16 bg-[#FEF3C7] border border-black rounded-none flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-[#0A0A0A]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-heading font-extrabold text-[#0A0A0A] tracking-tighter uppercase flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-[#EAB308]" />
                PRO FEATURE LOCK
              </h2>
              <p className="text-xs text-[#4B5563] leading-relaxed font-mono">
                The Dark Web Monitor scans hacker directories, pastebins, and illicit marketplaces 24/7. This advanced tool requires a PRO subscription.
              </p>
            </div>

            <div className="bg-[#F8F9FA] border border-black rounded-none p-4 text-left space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#4B5563] block font-mono">WHAT IS INCLUDED:</span>
              <div className="flex items-center text-xs text-[#0A0A0A] font-mono">
                <ShieldCheck className="w-4 h-4 text-[#16A34A] mr-2 flex-shrink-0" />
                <span>Continuous Onion Market Scraping</span>
              </div>
              <div className="flex items-center text-xs text-[#0A0A0A] font-mono">
                <ShieldCheck className="w-4 h-4 text-[#16A34A] mr-2 flex-shrink-0" />
                <span>Real-time email leak push notifications</span>
              </div>
              <div className="flex items-center text-xs text-[#0A0A0A] font-mono">
                <ShieldCheck className="w-4 h-4 text-[#16A34A] mr-2 flex-shrink-0" />
                <span>Full compromise payload logs</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleUpgrade}
                data-testid="upgrade-pro-button"
                className="w-full py-3 text-sm font-heading font-bold bg-black text-white hover:bg-[#16A34A] hover:text-white uppercase tracking-widest border border-black rounded-none transition-colors duration-100 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-white" />
                Upgrade to PRO (Simulated Checkout)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actual Content (Blurred if FREE plan) */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-500 ${
        userPlan === 'FREE' ? 'filter blur-md pointer-events-none select-none opacity-40' : ''
      }`}>
        
        {/* Risk Assessment Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Search & Monitoring Controls */}
          <div className="bg-white border border-black p-6 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-heading font-bold text-[#0A0A0A] uppercase tracking-tight">&gt; DARK WEB GUARD</h2>
                <p className="text-xs text-[#4B5563] mt-0.5 font-mono">
                  Scan nodes for private data exposures. Last scan completed 1 hour ago.
                </p>
              </div>
              <button
                onClick={handleScanDarkWeb}
                disabled={isScanning}
                data-testid="scan-dark-web-button"
                className="bg-black text-white hover:bg-[#16A34A] border border-black font-bold py-2.5 px-6 rounded-none text-xs transition-colors duration-100 flex items-center justify-center cursor-pointer disabled:opacity-50 self-start sm:self-center font-heading tracking-widest uppercase hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Scanning darknets...
                  </>
                ) : (
                  'Scan Dark Web Now'
                )}
              </button>
            </div>

            {isScanning && (
              <div className="mt-4 p-4 bg-[#F8F9FA] border border-black rounded-none space-y-2 font-mono text-sm">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#16A34A]">$ {scanMessage}</span>
                  <span className="text-[#4B5563]">{scanProgress}%</span>
                </div>
                <div className="w-full bg-[#F3F4F6] h-2 rounded-none overflow-hidden border border-black">
                  <div 
                    className="bg-[#16A34A] h-full transition-all duration-300 rounded-none"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Monitored Accounts List */}
          <div className="bg-white border border-black p-6 space-y-4 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h3 className="text-sm font-heading font-bold text-[#0A0A0A] border-b border-black pb-2 uppercase tracking-tight">&gt; ACTIVE TRACKING DIRECTORY</h3>
            
            {monitoredEmails.length === 0 ? (
              <div className="py-12 text-center text-[#4B5563] text-xs font-mono">
                No emails registered. Head to the Email Checker page to add accounts to your watch list.
              </div>
            ) : (
              <div className="space-y-4">
                {monitoredEmails.map((item) => {
                  const riskLevel = item.breachCount >= 3 ? 'High' : item.breachCount > 0 ? 'Medium' : 'Low';
                  return (
                    <div key={item.id} className="bg-white border border-black p-4 rounded-none space-y-3 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#0A0A0A] text-sm font-mono">{item.email}</span>
                          <span className="block text-[10px] text-[#4B5563] font-mono">
                            REGISTERED: {new Date(item.addedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase border border-black font-mono ${
                            riskLevel === 'High' 
                              ? 'bg-[#DC2626] text-white' 
                              : riskLevel === 'Medium'
                                ? 'bg-[#EAB308] text-black'
                                : 'bg-[#16A34A] text-white'
                          }`}>
                            Risk: {riskLevel}
                          </span>
                          <span className="text-[10px] text-[#0A0A0A] font-mono bg-[#F3F4F6] border border-black px-2 py-0.5 rounded-none">
                            {item.breachCount} Leaks
                          </span>
                        </div>
                      </div>

                      {/* Breach list if any */}
                      {item.breaches && item.breaches.length > 0 ? (
                        <div className="pt-2 border-t border-black space-y-2.5">
                          <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest block font-mono">LEAKED LOCATIONS:</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {item.breaches.map((b: any, idx: number) => (
                              <div key={idx} className="bg-[#F8F9FA] border border-black p-2.5 rounded-none text-xs flex justify-between items-center font-mono">
                                <div>
                                  <span className="font-bold text-[#0A0A0A] block">{b.name}</span>
                                  <span className="text-[10px] text-[#4B5563]">{b.date || b.breachDate}</span>
                                </div>
                                <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#16A34A] font-medium flex items-center gap-1.5 font-mono">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          No active threat alerts detected. Email has clean dark web history.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Info & Threat Intelligence Sidebar */}
        <div className="space-y-6">
          {/* Threats Tracker */}
          <div className="bg-white border border-black p-6 space-y-4 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h3 className="text-sm font-heading font-bold text-[#0A0A0A] uppercase tracking-tight">&gt; THREAT INTELLIGENCE</h3>
            
            <div className="space-y-3">
              <div className="bg-[#F8F9FA] border border-black p-3 rounded-none flex items-center justify-between text-xs font-mono">
                <span className="text-[#4B5563] font-medium">Total Monitored Emails</span>
                <span className="font-bold text-[#0A0A0A] font-mono">{monitoredEmails.length}</span>
              </div>
              <div className="bg-[#F8F9FA] border border-black p-3 rounded-none flex items-center justify-between text-xs font-mono">
                <span className="text-[#4B5563] font-medium">Total Leak Matches</span>
                <span className="font-bold text-[#DC2626] font-mono">
                  {monitoredEmails.reduce((acc, curr) => acc + curr.breachCount, 0)}
                </span>
              </div>
              <div className="bg-[#F8F9FA] border border-black p-3 rounded-none flex items-center justify-between text-xs font-mono">
                <span className="text-[#4B5563] font-medium">Threat Monitoring Status</span>
                <span className="font-bold text-[#16A34A] flex items-center font-mono">
                  <span className="h-2.5 w-2.5 rounded-none bg-[#16A34A] mr-1.5"></span>
                  ACTIVE (24/7)
                </span>
              </div>
            </div>
          </div>

          {/* Onion Network Scraping Explainer */}
          <div className="bg-white border border-black p-6 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h3 className="text-sm font-heading font-bold text-[#0A0A0A] mb-2 flex items-center gap-2 uppercase tracking-tight">
              <Fingerprint className="w-4 h-4 text-[#0A0A0A]" />
              &gt; ONION SCRAPING
            </h3>
            <p className="text-xs text-[#4B5563] leading-relaxed font-mono">
              Cybersecurity specialists scrape Tor Onion networks and secure chat rooms (like Telegram, Discord, and IRC channels) where hackers sell compromised databases.
            </p>
            <p className="text-xs text-[#4B5563] leading-relaxed mt-2 font-mono">
              If an email you own appears in a thread, ExtraShield instantly alerts you so you can reset passwords before malicious access occurs.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

