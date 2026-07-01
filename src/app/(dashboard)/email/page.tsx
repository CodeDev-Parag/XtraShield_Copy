'use client';

import React, { useState } from 'react';
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
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddMonitoredEmail,
  useDeleteMonitoredEmail,
  useMonitoredEmails,
  usePatchMonitoredEmail,
  useRescanMonitoredEmail,
  type MonitoredEmailDTO,
} from '@/hooks/useMonitoredEmails';

export default function EmailCheckerPage() {
  const {
    data: monitoredEmails = [],
    isLoading: loadingList,
    isFetching,
    refetch,
  } = useMonitoredEmails();

  const addMutation = useAddMonitoredEmail();
  const patchMutation = usePatchMonitoredEmail();
  const deleteMutation = useDeleteMonitoredEmail();
  const rescanMutation = useRescanMonitoredEmail();

  const [emailInput, setEmailInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    searched: boolean;
    email: string;
    breached: boolean;
    breaches: any[];
    isMock: boolean;
    configured: boolean;
    message?: string;
  } | null>(null);
  const [error, setError] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    setIsScanning(true);
    setError('');
    setScanResult(null);

    try {
      const response = await fetch('/api/proxy/breach/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() })
      });
      if (!response.ok) {
        throw new Error('Failed to query email breach database.');
      }

      const data = await response.json();
      const hasBreaches = Array.isArray(data.breaches) && data.breaches.length > 0;

      setScanResult({
        searched: true,
        email: emailInput.trim(),
        breached: hasBreaches,
        breaches: data.breaches ?? [],
        isMock: !!data.isMock,
        configured: data.configured !== false,
        message: data.message,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddToMonitor = async (email: string, _breaches: any[]) => {
    try {
      await addMutation.mutateAsync(email);
      toast.success(`${email} added to your Watch List.`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to add email to watch list.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative font-mono">
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SCANNING...
                  </>
                ) : (
                  'SCAN EMAIL'
                )}
              </button>
            </form>
            {error && <p className="text-xs text-[#DC2626] mt-2 font-mono font-semibold">{error}</p>}
          </div>

          {scanResult && (
            <div className="space-y-6">
              {!scanResult.configured ? (
                <div className="border border-[#EAB308] bg-[#FEFCE8] p-6">
                  <div className="flex items-start">
                    <AlertTriangle className="w-7 h-7 text-[#EAB308] mr-4 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-base font-heading font-extrabold uppercase tracking-tight text-[#0A0A0A]">
                        EMAIL LOOKUP NOT CONFIGURED
                      </h3>
                      <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed font-mono">
                        {scanResult.message ||
                          "Email breach data is not available on this server."}
                      </p>
                      <p className="text-[11px] text-[#4B5563] mt-3 font-mono">
                        Add a <code className="bg-white border border-black px-1">HIBP_API_KEY</code>{" "}
                        environment variable (server-side) to enable real breach lookups.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`border p-6 ${
                    scanResult.breached
                      ? 'bg-white border-[#DC2626]'
                      : 'bg-white border-[#16A34A]'
                  }`}
                >
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
                            ? 'This email was found in the data leaks detailed below. We recommend changing passwords immediately.'
                            : 'No known data breaches found. Secure your account by turning on active monitoring.'}
                        </p>
                      </div>
                    </div>

                    {!monitoredEmails.some(
                      (m) => m.email.toLowerCase() === scanResult.email.toLowerCase()
                    ) && (
                      <button
                        onClick={() => handleAddToMonitor(scanResult.email, scanResult.breaches)}
                        disabled={addMutation.isPending}
                        className="bg-white hover:bg-gray-100 text-[#0A0A0A] border border-black font-bold py-2 px-4 text-xs transition-colors self-start md:self-center cursor-pointer font-heading uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 disabled:opacity-50"
                        data-testid="add-to-watchlist-button"
                      >
                        {addMutation.isPending ? 'ADDING...' : 'ADD TO WATCH LIST'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {scanResult.breached && scanResult.configured && (
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-[#4B5563] uppercase tracking-widest">BREACH DETAILS</h4>
                  {scanResult.breaches.map((breach: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white border border-black p-5 space-y-3 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-sm font-heading font-bold text-[#0A0A0A] uppercase tracking-tight">
                            {breach.name}
                          </h5>
                          <span className="text-[11px] font-mono text-[#4B5563]">{breach.domain}</span>
                        </div>
                        <span className="text-[10px] bg-[#DC2626] text-white px-2 py-0.5 font-mono font-semibold uppercase tracking-widest">
                          Date: {breach.breachDate}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed font-medium font-mono">
                        {(breach.description ?? '').toString().replace(/<\/?[^>]+(>|$)/g, '')}
                      </p>
                      <div className="pt-2 border-t border-black">
                        <span className="text-[9px] text-[#4B5563] uppercase tracking-widest font-mono font-bold block mb-2">
                          EXPOSED DATA TYPES:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(breach.dataClasses ?? []).map((cls: string) => (
                            <span
                              key={cls}
                              className="text-[9px] font-mono bg-[#F8F9FA] text-[#4B5563] px-2.5 py-0.5 border border-black"
                            >
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
            {loadingList ? (
              <div className="text-center py-10 text-[#4B5563] text-xs font-mono flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading watch list...
              </div>
            ) : monitoredEmails.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-black bg-[#F8F9FA]">
                <Mail className="w-8 h-8 text-[#4B5563] mx-auto mb-2" />
                <p className="text-xs font-medium text-[#4B5563] font-mono">Your watch list is empty.</p>
                <p className="text-[10px] text-[#4B5563] mt-1 font-mono">
                  Scan an email above and click “Add to Watch List”.
                </p>
              </div>
            ) : (
              monitoredEmails.map((m: MonitoredEmailDTO) => (
                <div key={m.id} className="bg-[#F8F9FA] border border-black p-3.5 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#0A0A0A] truncate pr-2 max-w-[160px] font-mono">
                      {m.email}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => rescanMutation.mutate(m.id)}
                        disabled={rescanMutation.isPending && rescanMutation.variables === m.id}
                        className="p-1.5 text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#0A0A0A] disabled:opacity-50"
                        title="Re-scan now"
                        data-testid={`rescan-email-${m.id}`}
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            rescanMutation.isPending && rescanMutation.variables === m.id
                              ? 'animate-spin'
                              : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={() =>
                          patchMutation.mutate({ id: m.id, alertOn: !m.alertOn })
                        }
                        className={`p-1.5 ${
                          m.alertOn
                            ? 'text-[#0A0A0A] hover:bg-[#F3F4F6]'
                            : 'text-[#4B5563] hover:bg-[#F3F4F6]'
                        }`}
                        title={m.alertOn ? 'Mute alert notifications' : 'Enable alert notifications'}
                        data-testid={`toggle-alerts-${m.id}`}
                      >
                        {m.alertOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(m.id)}
                        className="p-1.5 text-[#4B5563] hover:text-[#DC2626] hover:bg-[#F3F4F6]"
                        title="Remove email"
                        data-testid={`remove-email-${m.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-black">
                    <div className="flex items-center text-[10px] font-medium font-mono">
                      {m.isVerified ? (
                        <span className="flex items-center text-[#16A34A]">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          VERIFIED
                        </span>
                      ) : (
                        <div className="flex items-center text-[#EAB308]">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          <span>UNVERIFIED</span>
                          <button
                            onClick={() => patchMutation.mutate({ id: m.id, isVerified: true })}
                            className="ml-2 underline text-[#4B5563] hover:text-[#0A0A0A] cursor-pointer font-bold font-mono"
                            data-testid={`verify-email-${m.id}`}
                          >
                            Verify
                          </button>
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 font-bold uppercase tracking-widest ${
                        m.breachCount > 0
                          ? 'bg-[#DC2626] text-white'
                          : 'bg-[#16A34A] text-white'
                      }`}
                    >
                      {m.breachCount} {m.breachCount === 1 ? 'BREACH' : 'BREACHES'}
                    </span>
                  </div>

                  {m.lastChecked && (
                    <p className="text-[10px] text-[#4B5563] font-mono">
                      Last scanned: {new Date(m.lastChecked).toLocaleString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <p className="text-[10px] text-[#4B5563] font-mono italic pt-2 border-t border-black">
            {isFetching && !loadingList ? 'Refreshing…' : ' '}
          </p>
        </div>
      </div>
    </div>
  );
}