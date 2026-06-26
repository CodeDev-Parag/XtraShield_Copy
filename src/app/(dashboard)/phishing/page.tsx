'use client';

import React, { useState } from 'react';
import { useSecurityStore } from '@/store/securityStore';
import { usePersistedStore } from '@/store/usePersistedStore';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  ExternalLink, 
  AlertTriangle, 
  Info,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface AnalysisStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
}

interface PhishResult {
  url: string;
  safe: boolean;
  stats: AnalysisStats;
  positives: number;
  total: number;
  scanDate: string;
  isMock: boolean;
  details: string;
}

export default function PhishingCheckerPage() {
  const addScan = useSecurityStore((state) => state.addScan);

  const apiKeys = usePersistedStore(
    useSecurityStore,
    (state) => state.apiKeys,
    { hibp: '', virustotal: '' }
  );

  const [urlInput, setUrlInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<PhishResult | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setIsChecking(true);
    setError('');
    setResult(null);

    try {
      const headers: HeadersInit = {};
      if (apiKeys?.virustotal) {
        headers['x-virustotal-api-key'] = apiKeys.virustotal;
      }
      const response = await fetch(`/api/phishing/check?url=${encodeURIComponent(urlInput.trim())}`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Failed to query URL threat lookup API.');
      }

      const data = await response.json();
      setResult(data);

      // Save to scan log
      addScan({
        type: 'phishing',
        target: urlInput.trim(),
        status: data.safe ? 'safe' : 'danger',
        details: data.safe
          ? 'Link scanned and marked clean. No malicious indicators.'
          : `MALICIOUS MATCH: Exposes ${data.positives} security flags. Highly suspicious.`
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while testing this URL.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-[#0A0A0A] flex items-center gap-3 uppercase">
          <Search className="w-8 h-8 text-[#0A0A0A]" />
          &gt; PHISHING &amp; URL GUARD
        
        </h1>
        <p className="mt-1 text-sm text-[#4B5563] font-mono">
          Analyze suspicious links, domains, or IP hostnames against VirusTotal threat directories to detect fraud, malware, or phishing campaigns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black p-6">
            <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 uppercase tracking-tight">&gt; SCAN URL FOR THREAT SIGNATURES</h2>
            <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-3" data-testid="phishing-form">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter link or domain (e.g. suspicious-site.com/login)"
                className="flex-1 bg-white border border-black py-2.5 px-4 text-sm text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-mono"
                required
                data-testid="phishing-url-input"
              />
              <button
                type="submit"
                disabled={isChecking}
                className="bg-black hover:bg-[#16A34A] text-white font-bold py-2.5 px-6 text-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 font-heading uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100"
                data-testid="phishing-scan-btn"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    CHECKING...
                  </>
                ) : (
                  'SCAN LINK'
                )}
              </button>
            </form>
            {error && <p className="text-xs text-[#DC2626] mt-2 font-mono font-semibold">{error}</p>}
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-6">
              {/* Threat Banner */}
              <div className={`border border-black p-6 ${
                result.safe 
                  ? 'bg-[#DCFCE7] text-[#16A34A]' 
                  : 'bg-[#FEE2E2] text-[#DC2626]'
              }`}>
                <div className="flex items-start">
                  {result.safe ? (
                    <ShieldCheck className="w-8 h-8 text-[#16A34A] mr-4 mt-1 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-8 h-8 text-[#DC2626] mr-4 mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="text-lg font-heading font-extrabold text-[#0A0A0A] uppercase tracking-tight">
                      {result.safe ? '> URL IS SAFE TO VISIT' : '> POTENTIAL MALICIOUS THREAT DETECTED'}
                    </h3>
                    <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed font-medium font-mono">
                      {result.details}
                    </p>
                    <div className="mt-4 flex items-center space-x-3">
                      <span className="text-[11px] font-mono bg-[#F8F9FA] px-2.5 py-0.5 border border-black truncate max-w-[300px] text-[#4B5563]">
                        {result.url}
                      </span>
                      {result.isMock && (
                        <span className="bg-[#F3F4F6] text-[10px] text-[#4B5563] border border-black px-2 py-0.5 font-medium font-mono uppercase tracking-widest">
                          Demo Sandbox
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Breakdown */}
              <div className="bg-white border border-black p-6">
                <h4 className="text-sm font-heading font-bold text-[#0A0A0A] mb-4 uppercase tracking-tight">&gt; SECURITY ENGINE ANALYSIS</h4>
                
                {/* Metric grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#F8F9FA] border border-black p-4 text-center">
                    <span className="text-2xl font-bold text-[#DC2626] font-mono">
                      {result.stats.malicious}
                    </span>
                    <span className="block text-[10px] text-[#4B5563] font-semibold uppercase mt-1 tracking-widest font-mono">Malicious</span>
                  </div>
                  
                  <div className="bg-[#F8F9FA] border border-black p-4 text-center">
                    <span className="text-2xl font-bold text-[#EAB308] font-mono">
                      {result.stats.suspicious}
                    </span>
                    <span className="block text-[10px] text-[#4B5563] font-semibold uppercase mt-1 tracking-widest font-mono">Suspicious</span>
                  </div>

                  <div className="bg-[#F8F9FA] border border-black p-4 text-center">
                    <span className="text-2xl font-bold text-[#0A0A0A] font-mono">
                      {result.stats.harmless}
                    </span>
                    <span className="block text-[10px] text-[#4B5563] font-semibold uppercase mt-1 tracking-widest font-mono">Harmless</span>
                  </div>

                  <div className="bg-[#F8F9FA] border border-black p-4 text-center">
                    <span className="text-2xl font-bold text-[#4B5563] font-mono">
                      {result.stats.undetected}
                    </span>
                    <span className="block text-[10px] text-[#4B5563] font-semibold uppercase mt-1 tracking-widest font-mono">Undetected</span>
                  </div>
                </div>

                {/* Progress bar ratio */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-[#4B5563] font-medium font-mono">
                    <span>THREAT DETECTION RATIO</span>
                    <span className="font-mono">{result.positives} / {result.total} engines</span>
                  </div>
                  <div className="w-full bg-[#F8F9FA] h-2 overflow-hidden flex border border-black">
                    <div 
                      className="bg-[#DC2626] h-full"
                      style={{ width: `${(result.stats.malicious / result.total) * 100}%` }}
                    />
                    <div 
                      className="bg-[#EAB308] h-full"
                      style={{ width: `${(result.stats.suspicious / result.total) * 100}%` }}
                    />
                    <div 
                      className="bg-[#16A34A] h-full"
                      style={{ width: `${((result.stats.harmless + result.stats.undetected) / result.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 text-[10px] text-[#4B5563] text-right font-mono">
                  Scan date: {new Date(result.scanDate).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Protection Guidelines Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-black p-6 space-y-4 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h3 className="text-sm font-heading font-bold text-[#0A0A0A] flex items-center gap-2 uppercase tracking-tight">
              <AlertTriangle className="w-4 h-4 text-[#EAB308]" />
              &gt; SPOTTING PHISHING LINKS
            </h3>
            
            <div className="space-y-3 text-xs text-[#4B5563] leading-relaxed font-mono">
              <div>
                <strong className="block text-[#0A0A0A]">1. LOOK FOR TYPOSQUATTING</strong>
                Attackers use domains that look extremely similar to real brands. E.g., <code>paypal-secure.com</code>, <code>netflix-verification.net</code>, or using homoglyphs (like a capital letter I or number 1 instead of lowercase L, e.g. <code>paypa1.com</code>).
              </div>
              
              <div>
                <strong className="block text-[#0A0A0A]">2. INSPECT THE SUBDOMAIN</strong>
                In a URL like <code>google.com.danger-login.xyz</code>, the actual domain is <code>danger-login.xyz</code>, not Google. Always check the words directly before the last slash (ignoring directories).
              </div>

              <div>
                <strong className="block text-[#0A0A0A]">3. GENERIC GREETING &amp; URGENCY</strong>
                Phishing emails usually tell you to act immediately (e.g. &quot;Your account is suspended in 24 hours&quot;) to trick you into entering credentials without checking.
              </div>
            </div>
          </div>

          <div className="bg-white border border-black p-6 flex items-start space-x-3 text-xs hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <HelpCircle className="w-5 h-5 text-[#0A0A0A] flex-shrink-0 mt-0.5" />
            <div className="text-[#4B5563] font-mono">
              <strong className="block text-[#0A0A0A] mb-1">$ WHAT IS VIRUSTOTAL?</strong>
              VirusTotal aggregates over 70 antivirus scanners and URL/domain blacklisting services to inspect items and discover malicious links.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
