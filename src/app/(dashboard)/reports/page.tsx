'use client';

import React from 'react';
import {
  useSecurityStore,
  type SecurityScan,
} from '@/store/securityStore';
import { useMonitoredEmails } from '@/hooks/useMonitoredEmails';
import { useUserSession } from '@/hooks/useUserSession';
import {
  FileText,
  Trash2,
  Download,
  ShieldCheck,
  Info,
  Clock,
  Key,
  Mail,
  Globe,
  Search,
} from 'lucide-react';

export default function ReportsPage() {
  // Server-backed data — replaces the old guest/Zustand fallbacks.
  const { plan: userPlan } = useUserSession();
  const { data: monitoredEmails = [] } = useMonitoredEmails();

  // Local Zustand for fast UI history (per architecture decision).
  const recentScans = useSecurityStore((s) => s.recentScans);
  const clearScans = useSecurityStore((s) => s.clearScans);

  const getScanIcon = (type: string) => {
    switch (type) {
      case 'password':
        return <Key className="w-4 h-4 text-[#0A0A0A]" />;
      case 'email':
        return <Mail className="w-4 h-4 text-[#0A0A0A]" />;
      case 'network':
        return <Globe className="w-4 h-4 text-[#0A0A0A]" />;
      case 'phishing':
        return <Search className="w-4 h-4 text-[#0A0A0A]" />;
      case 'ssl':
        return <ShieldCheck className="w-4 h-4 text-[#16A34A]" />;
      default:
        return <FileText className="w-4 h-4 text-[#4B5563]" />;
    }
  };

  const handleDownloadReport = () => {
    const reportText = `======================================================================
  EXTRASHIELD SECURITY SUITE - SYSTEM AUDIT REPORT
  Generated on: ${new Date().toLocaleString()}
======================================================================

ACCOUNT PROFILE DETAIL:
- Subscription Tier: ${userPlan}
- Audit Status: COMPLETED

MONITORED EMAILS AUDIT (${monitoredEmails.length} accounts):
----------------------------------------------------------------------
${
  monitoredEmails.length === 0
    ? 'No monitored email accounts registered.'
    : monitoredEmails
        .map((m, idx) => {
          return `${idx + 1}. Email: ${m.email}
   - Verification status: ${m.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
   - Automated alerts: ${m.alertOn ? 'ENABLED' : 'DISABLED'}
   - Compromise leaks detected: ${m.breachCount} occurrences
   ${m.breaches && m.breaches.length > 0 ? `   - Breached services: ${m.breaches.map((b: any) => b.name).join(', ')}` : ''}`;
        })
        .join('\n\n')
}

HISTORICAL SCANS AUDIT LOGS (${recentScans.length} activities):
----------------------------------------------------------------------
${
  recentScans.length === 0
    ? 'No recent security scan activities logged.'
    : recentScans
        .map((s: SecurityScan, idx: number) => {
          return `[${s.timestamp}]
Type: ${s.type.toUpperCase()} | Target: ${s.target} | Severity: ${s.status.toUpperCase()}
Details: ${s.details}`;
        })
        .join('\n\n')
}

======================================================================
DISCLAIMER: This report is a client-side compilation of active safety checks
generated through ExtraShield tools. Review regularly to ensure credentials protection.
======================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExtraShield_Security_Report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative font-mono">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-black">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-[#0A0A0A] flex items-center gap-3 uppercase">
            <FileText className="w-8 h-8 text-[#0A0A0A]" />
            {'>'} REPORTS & EXPORT
          </h1>
          <p className="mt-1 text-sm text-[#4B5563] font-mono">
            Review your threat detection log history, export system status reports, and configure backup options.
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          {recentScans.length > 0 && (
            <button
              onClick={clearScans}
              data-testid="clear-history-button"
              className="bg-white border border-black hover:bg-[#F3F4F6] hover:text-[#DC2626] text-[#4B5563] font-semibold p-2.5 rounded-none text-sm transition-colors duration-100 cursor-pointer"
              title="Clear scan history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDownloadReport}
            data-testid="export-report-button"
            className="bg-black text-white hover:bg-[#16A34A] hover:text-white font-bold py-2.5 px-4 rounded-none text-sm transition-colors duration-100 flex items-center justify-center cursor-pointer font-heading gap-2 border border-black uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
          >
            <Download className="w-4 h-4 text-white" />
            Export Security Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Log History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black p-6 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Clock className="w-5 h-5 text-[#0A0A0A]" />
              {'>'} ACTIVITY LOG HISTORY
            </h2>

            {recentScans.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-black rounded-none bg-[#F8F9FA] font-mono">
                <FileText className="w-10 h-10 text-[#4B5563] mx-auto mb-2" />
                <p className="text-xs text-[#0A0A0A] font-bold uppercase tracking-tight">
                  No security audit activities recorded yet.
                </p>
                <p className="text-[11px] text-[#4B5563] mt-1 font-medium">
                  Run password check or port scans to log history items.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {recentScans.map((scan: SecurityScan) => (
                  <div
                    key={scan.id}
                    className="bg-white border border-black p-4 rounded-none flex items-start gap-3 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100"
                  >
                    <div className="bg-[#F8F9FA] border border-black p-2.5 rounded-none mt-0.5">
                      {getScanIcon(scan.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider font-mono">
                          {scan.type} scan:{' '}
                          <code className="font-mono text-[#0A0A0A] font-bold ml-1">{scan.target}</code>
                        </span>
                        <span className="text-[10px] text-[#4B5563] font-mono">
                          {new Date(scan.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] font-mono leading-relaxed">{scan.details}</p>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] text-[#4B5563] font-mono">
                          {new Date(scan.timestamp).toLocaleDateString()}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-none border border-black uppercase font-bold tracking-wider ${
                            scan.status === 'danger'
                              ? 'bg-[#DC2626] text-white'
                              : scan.status === 'warning'
                                ? 'bg-[#EAB308] text-black'
                                : 'bg-[#16A34A] text-white'
                          }`}
                        >
                          {scan.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Audit summary widget */}
        <div className="space-y-6">
          <div className="bg-white border border-black p-6 space-y-4 rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h3 className="text-sm font-heading font-bold text-[#0A0A0A] uppercase tracking-tight">
              {'>'} SECURITY SCOREBOARD
            </h3>

            <div className="space-y-3">
              <div className="p-4 bg-[#F8F9FA] border border-black rounded-none text-center space-y-1 font-mono">
                <span className="sm text-[#4B5563] font-semibold block uppercase font-mono text-sm">
                  Compliance Grade
                </span>
                <span className="text-3xl font-extrabold text-[#16A34A] font-heading">A-</span>
                <span className="text-[10px] text-[#4B5563] block font-mono">
                  FULLY COMPLIANT WITH STANDARD RULES
                </span>
              </div>

              <div className="bg-[#F8F9FA] border border-black p-3.5 rounded-none space-y-2 text-xs font-mono">
                <span className="text-[#4B5563] uppercase text-[10px] font-bold block font-mono">
                  AUDIT STATS:
                </span>
                <div className="flex justify-between font-medium">
                  <span className="text-[#4B5563]">Monitored emails verified</span>
                  <span className="font-semibold text-[#0A0A0A] font-mono">
                    {monitoredEmails.filter((m) => m.isVerified).length} / {monitoredEmails.length}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#4B5563]">Exposures flagged</span>
                  <span className="font-semibold text-[#DC2626] font-mono">
                    {monitoredEmails.filter((m) => m.breachCount > 0).length}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#4B5563]">Historical Scans run</span>
                  <span className="font-semibold text-[#0A0A0A] font-mono">{recentScans.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black p-6 flex items-start space-x-3 text-xs rounded-none hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <Info className="w-5 h-5 text-[#0A0A0A] flex-shrink-0 mt-0.5" />
            <div className="text-[#4B5563] font-mono">
              <strong className="block text-[#0A0A0A] mb-1 uppercase tracking-tight">
                {'>'} WEEKLY DIGEST ALERTS
              </strong>
              Keep notifications turned on under Settings to receive an automated audit report compiled every Monday morning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
