'use client';

import React, { useState } from 'react';
import { useSecurityStore, MonitoredEmail } from '@/store/securityStore';
import { usePersistedStore } from '@/store/usePersistedStore';
import { 
  Mail, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Bell, 
  BellOff, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function EmailCheckerPage() {
  const monitoredEmails = usePersistedStore(
    useSecurityStore,
    (state) => state.monitoredEmails,
    [] as MonitoredEmail[]
  );

  const apiKeys = usePersistedStore(
    useSecurityStore,
    (state) => state.apiKeys,
    { hibp: '', virustotal: '' }
  );

  const { addMonitoredEmail, verifyEmail, removeMonitoredEmail, toggleEmailAlerts, addScan } = useSecurityStore();

  // Search states
  const [emailInput, setEmailInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    searched: boolean;
    email: string;
    breached: boolean;
    breaches: any[];
    isMock: boolean;
  } | null>(null);
  const [error, setError] = useState('');

  // Handle email search scan
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    setIsScanning(true);
    setError('');
    setScanResult(null);

    try {
      const headers: HeadersInit = {};
      if (apiKeys?.hibp) {
        headers['x-hibp-api-key'] = apiKeys.hibp;
      }
      const response = await fetch(`/api/breach/email?email=${encodeURIComponent(emailInput.trim())}`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Failed to query email breach database.');
      }

      const data = await response.json();
      const hasBreaches = data.breaches && data.breaches.length > 0;

      setScanResult({
        searched: true,
        email: emailInput.trim(),
        breached: hasBreaches,
        breaches: data.breaches || [],
        isMock: data.isMock
      });

      // Add to store's scan history
      addScan({
        type: 'email',
        target: emailInput.trim(),
        status: hasBreaches ? 'danger' : 'safe',
        details: hasBreaches
          ? `Found ${data.breaches.length} data breaches exposing this email address.`
          : 'Safe. No known database breaches found for this email.'
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddToMonitor = (email: string, breaches: any[]) => {
    addMonitoredEmail(email, breaches.length, breaches);
    alert(`${email} added to your Watch List! You can verify it below.`);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative font-mono">
      
      {/* Title */}
      <div className="border-b border-black pb-6">
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-[#0A0A0A] flex items-center gap-3 uppercase">
          <Mail className="w-8 h-8 text-[#0A0A0A]" />
          {'>'} EMAIL CHECKER
        </h1>
        <p className="mt-2 text-sm text-[#4B5563] font-medium font-mono">
          Check if your email address has been exposed in public data leaks, and register it for automated monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Scanner Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black p-6 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 uppercase tracking-tight">$ RUN BREACH SCAN</h2>
            <form onSubmit={handleScan} className="flex flex-col md:flex-row gap-3" data-testid="email-scan-form">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter email address (e.g. yourname@example.com)"
                className="flex-1 bg-white border border-black py-2.5 px-4 text-sm text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                required
                data-testid="email-input"
              />
              <button
                type="submit"
                disabled={isScanning}
                className="bg-black hover:bg-[#16A34A] text-white font-bold py-2.5 px-6 text-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 font-heading uppercase tracking-widest"
                data-testid="email-scan-button"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" style={{ animation: 'spin 1s linear infinite' }} />
                    SCANNING...
                  </>
                ) : (
                  'SCAN EMAIL'
                )}
              </button>
            </form>
            {error && <p className="text-xs text-[#DC2626] mt-2 font-mono font-semibold">{error}</p>}
          </div>

          {/* Scan Results */}
          {scanResult && (
            <div className="space-y-6">
              <div className={`border p-6 ${
                scanResult.breached 
                  ? 'bg-white border-[#DC2626]' 
                  : 'bg-white border-[#16A34A]'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start">
                    {scanResult.breached ? (
                      <ShieldAlert className="w-8 h-8 text-[#DC2626] mr-4 mt-1 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 text-[#16A34A] mr-4 mt-1 shrink-0" />
                    )}
                    <div>
                      <h3 className="text-lg font-heading font-extrabold text-[#0A0A0A] uppercase tracking-tight">
                        {scanResult.breached 
                          ? `EXPOSURE DETECTED: ${scanResult.breaches.length} BREACHES` 
                          : 'EMAIL IS SECURE'}
                      </h3>
                      <p className="text-xs text-[#4B5563] mt-1.5 font-medium leading-relaxed font-mono">
                        {scanResult.breached 
                          ? `This email was found in the data leaks detailed below. We recommend changing passwords immediately.` 
                          : 'No known data breaches found. Secure your account by turning on active monitoring.'}
                      </p>
                      {scanResult.isMock && (
                        <span className="inline-block mt-3 bg-[#F3F4F6] text-[9px] font-mono text-[#4B5563] px-2 py-0.5 border border-black">
                          Demo Data (No API Key Configured)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to watch list button */}
                  {!monitoredEmails.some(m => m.email.toLowerCase() === scanResult.email.toLowerCase()) && (
                    <button
                      onClick={() => handleAddToMonitor(scanResult.email, scanResult.breaches)}
                      className="bg-white hover:bg-gray-100 text-[#0A0A0A] border border-black font-bold py-2 px-4 text-xs transition-colors self-start md:self-center cursor-pointer font-heading uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100"
                      data-testid="add-to-watchlist-button"
                    >
                      ADD TO WATCH LIST
                    </button>
                  )}
                </div>
              </div>

              {/* List of Breaches */}
              {scanResult.breached && (
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-[#4B5563] uppercase tracking-widest">BREACH DETAILS</h4>
                  {scanResult.breaches.map((breach: any, idx: number) => (
                    <div key={idx} className="bg-white border border-black p-5 space-y-3 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-sm font-heading font-bold text-[#0A0A0A] uppercase tracking-tight">{breach.name}</h5>
                          <span className="text-[11px] font-mono text-[#4B5563]">{breach.domain}</span>
                        </div>
                        <span className="text-[10px] bg-[#DC2626] text-white px-2 py-0.5 font-mono font-semibold uppercase tracking-widest">
                          Date: {breach.breachDate}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed font-medium font-mono">
                        {breach.description.replace(/<\/?[^>]+(>|$)/g, "")}
                      </p>
                      <div className="pt-2 border-t border-black">
                        <span className="text-[9px] text-[#4B5563] uppercase tracking-widest font-mono font-bold block mb-2">EXPOSED DATA TYPES:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {breach.dataClasses.map((cls: string) => (
                            <span key={cls} className="text-[9px] font-mono bg-[#F8F9FA] text-[#4B5563] px-2.5 py-0.5 border border-black">
                              {cls}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Watch List Card (Sidebar) */}
        <div className="bg-white border border-black p-6 h-fit space-y-6 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
          <div>
            <h3 className="text-base font-heading font-bold text-[#0A0A0A] flex items-center gap-2.5 uppercase tracking-tight">
              <Bell className="w-5 h-5 text-[#0A0A0A]" />
              {'>'} EMAIL WATCH LIST
            </h3>
            <p className="text-xs text-[#4B5563] mt-1 font-medium leading-relaxed font-mono">
              Active tracking for compromises on the dark web.
            </p>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {monitoredEmails.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-black bg-[#F8F9FA]">
                <Mail className="w-8 h-8 text-[#4B5563] mx-auto mb-2" />
                <p className="text-xs font-medium text-[#4B5563] font-mono">Your watch list is empty.</p>
              </div>
            ) : (
              monitoredEmails.map((monitored) => (
                <div key={monitored.id} className="bg-[#F8F9FA] border border-black p-3.5 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#0A0A0A] truncate pr-2 max-w-[150px] font-mono">{monitored.email}</span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => toggleEmailAlerts(monitored.id)}
                        className={`p-1.5 transition-colors ${
                          monitored.alertsEnabled 
                            ? 'text-[#0A0A0A] hover:bg-[#F3F4F6]' 
                            : 'text-[#4B5563] hover:bg-[#F3F4F6]'
                        }`}
                        title={monitored.alertsEnabled ? 'Mute alert notifications' : 'Enable alert notifications'}
                        data-testid={`toggle-alerts-${monitored.id}`}
                      >
                        {monitored.alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => removeMonitoredEmail(monitored.id)}
                        className="p-1.5 text-[#4B5563] hover:text-[#DC2626] hover:bg-[#F3F4F6] transition-colors"
                        title="Remove email"
                        data-testid={`remove-email-${monitored.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-black">
                    <div className="flex items-center text-[10px] font-medium font-mono">
                      {monitored.isVerified ? (
                        <span className="flex items-center text-[#16A34A]">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          VERIFIED
                        </span>
                      ) : (
                        <div className="flex items-center text-[#EAB308]">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          <span>UNVERIFIED</span>
                          <button
                            onClick={() => verifyEmail(monitored.id)}
                            className="ml-2 underline text-[#4B5563] hover:text-[#0A0A0A] cursor-pointer font-bold font-mono"
                            data-testid={`verify-email-${monitored.id}`}
                          >
                            Verify
                          </button>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 font-bold uppercase tracking-widest ${
                      monitored.breachCount > 0 
                        ? 'bg-[#DC2626] text-white' 
                        : 'bg-[#16A34A] text-white'
                    }`}>
                      {monitored.breachCount} {monitored.breachCount === 1 ? 'BREACH' : 'BREACHES'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
