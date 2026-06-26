'use client';

import React, { useState } from 'react';
import { useSecurityStore } from '@/store/securityStore';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Globe, 
  Calendar, 
  Award, 
  FileText, 
  Info,
  RefreshCw,
  Search
} from 'lucide-react';

interface SSLResult {
  authorized: boolean;
  authError: string | null;
  subject: {
    CN?: string;
    O?: string;
    L?: string;
    ST?: string;
    C?: string;
  };
  issuer: {
    CN?: string;
    O?: string;
    C?: string;
  };
  validFrom: string;
  validTo: string;
  fingerprint: string;
  serialNumber: string;
  bits: number;
  subjectAltName?: string;
}

export default function SSLCheckerPage() {
  const addScan = useSecurityStore((state) => state.addScan);

  const [domainInput, setDomainInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<SSLResult | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput) return;

    setIsChecking(true);
    setError('');
    setResult(null);

    // Clean domain for API call
    let domain = domainInput.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];

    try {
      const response = await fetch(`/api/ssl/check?domain=${encodeURIComponent(domain)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to inspect domain SSL certificate.');
      }

      const data = await response.json();
      setResult(data);

      const expDate = new Date(data.validTo);
      const isExpired = expDate.getTime() < Date.now();
      const isTrustworthy = data.authorized && !isExpired;

      addScan({
        type: 'ssl',
        target: domain,
        status: isTrustworthy ? 'safe' : 'danger',
        details: isExpired 
          ? `WARNING: SSL Certificate for ${domain} has EXPIRED.` 
          : isTrustworthy 
            ? `SSL Certificate for ${domain} is VALID (Issued by ${data.issuer.O || data.issuer.CN}).`
            : `SSL Warning: Certificate for ${domain} has verification issue: ${data.authError || 'Untrusted Authority'}.`
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to scan target SSL certificate.');
    } finally {
      setIsChecking(false);
    }
  };

  // Helper: calculate days remaining/expired
  const getValidityDays = (validToStr: string) => {
    const toDate = new Date(validToStr);
    const diffTime = toDate.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-[#0A0A0A] flex items-center gap-3 uppercase">
          <ShieldCheck className="w-8 h-8 text-[#0A0A0A]" />
          &gt; SSL/TLS CHECKER
        
        </h1>
        <p className="mt-1 text-sm text-[#4B5563] font-mono">
          Inspect SSL certificates on external servers. Verify validation expiry dates, certificate chains, and trust authority issues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black p-6">
            <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 uppercase tracking-tight">&gt; VERIFY SSL CERTIFICATE</h2>
            <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-3" data-testid="ssl-form">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="Enter domain name (e.g. google.com)"
                className="flex-1 bg-white border border-black py-2.5 px-4 text-sm text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-mono"
                required
                data-testid="ssl-domain-input"
              />
              <button
                type="submit"
                disabled={isChecking}
                className="bg-black hover:bg-[#16A34A] text-white font-bold py-2.5 px-6 text-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 font-heading uppercase tracking-widest hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100"
                data-testid="ssl-inspect-btn"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    INSPECTING...
                  </>
                ) : (
                  'INSPECT SSL'
                )}
              </button>
            </form>
            {error && <p className="text-xs text-[#DC2626] mt-2 font-mono font-semibold">{error}</p>}
          </div>

          {/* Results Display */}
          {result && (() => {
            const daysLeft = getValidityDays(result.validTo);
            const expired = daysLeft <= 0;
            const expiringSoon = daysLeft > 0 && daysLeft <= 30;
            const valid = !expired && result.authorized;

            return (
              <div className="space-y-6">
                {/* Validity Alert Banner */}
                <div className={`border border-black p-6 ${
                  valid 
                    ? expiringSoon
                      ? 'bg-[#FEF3C7] text-[#EAB308]'
                      : 'bg-[#DCFCE7] text-[#16A34A]' 
                    : 'bg-[#FEE2E2] text-[#DC2626]'
                }`}>
                  <div className="flex items-start">
                    {valid && !expiringSoon ? (
                      <ShieldCheck className="w-8 h-8 text-[#16A34A] mr-4 mt-1 flex-shrink-0" />
                    ) : expiringSoon ? (
                      <ShieldAlert className="w-8 h-8 text-[#EAB308] mr-4 mt-1 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-8 h-8 text-[#DC2626] mr-4 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="text-lg font-heading font-extrabold text-[#0A0A0A] uppercase tracking-tight">
                        {valid 
                          ? expiringSoon
                            ? '> SSL CERTIFICATE EXPIRING SOON'
                            : '> SSL CERTIFICATE IS SECURE & VALID' 
                          : '> SSL CERTIFICATE IS INVALID OR EXPIRED'}
                      </h3>
                      <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed font-medium font-mono">
                        {valid 
                          ? expiringSoon
                            ? `This domain's SSL certificate is valid but expires in ${daysLeft} days. Be sure to renew it before expiration.`
                            : `The connection is fully encrypted. Certificate issued by a trusted authority and expires in ${daysLeft} days.`
                          : expired
                            ? `The SSL certificate for this domain expired ${Math.abs(daysLeft)} days ago. Connections are not secure.`
                            : `Certificate trust check failed: ${result.authError || 'Untrusted Certificate Authority'}.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Issuer & Subject */}
                  <div className="bg-white border border-black p-6 space-y-4">
                    <h4 className="text-sm font-heading font-bold text-[#0A0A0A] border-b border-black pb-2 uppercase tracking-tight">&gt; CERTIFICATE IDENTITY</h4>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold font-mono">Common Name (CN)</span>
                        <span className="text-[#0A0A0A] font-mono">{result.subject.CN || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold font-mono">Subject Organization (O)</span>
                        <span className="text-[#0A0A0A]">{result.subject.O || 'No Organization Listed'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold font-mono">Issued By (CA)</span>
                        <span className="text-[#0A0A0A] font-semibold">{result.issuer.O || result.issuer.CN || 'Unknown'}</span>
                      </div>
                      {result.issuer.CN && result.issuer.CN !== result.issuer.O && (
                        <div>
                          <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold font-mono">Issuer Common Name</span>
                          <span className="text-[#4B5563] font-mono">{result.issuer.CN}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Validity & Cipher strength */}
                  <div className="bg-white border border-black p-6 space-y-4">
                    <h4 className="text-sm font-heading font-bold text-[#0A0A0A] border-b border-black pb-2 uppercase tracking-tight">&gt; EXPIRATION &amp; STRENGTH</h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold font-mono">Valid From</span>
                        <span className="text-[#0A0A0A]">{new Date(result.validFrom).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold font-mono">Expires On</span>
                        <span className="text-[#0A0A0A] font-bold">{new Date(result.validTo).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold font-mono">Public Key Bit Strength</span>
                        <span className="text-[#0A0A0A] font-mono font-bold">{result.bits} bits</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Meta & Subject Alternate Names */}
                <div className="bg-white border border-black p-6 space-y-4">
                  <h4 className="text-sm font-heading font-bold text-[#0A0A0A] border-b border-black pb-2 uppercase tracking-tight">&gt; TECHNICAL DETAILS</h4>
                  
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold mb-1 font-mono">SHA-1 Fingerprint</span>
                      <span className="text-[#4B5563] font-mono select-all break-all">{result.fingerprint}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold mb-1 font-mono">Serial Number</span>
                      <span className="text-[#4B5563] font-mono select-all break-all">{result.serialNumber}</span>
                    </div>

                    {result.subjectAltName && (
                      <div>
                        <span className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold mb-1 font-mono">Subject Alternative Names (SANs)</span>
                        <div className="max-h-[120px] overflow-y-auto bg-[#F8F9FA] p-3.5 border border-black text-[11px] text-[#4B5563] font-mono whitespace-pre-wrap leading-relaxed select-all">
                          {result.subjectAltName.replace(/DNS:/g, '').split(',').join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-black p-6 space-y-4 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h3 className="text-sm font-heading font-bold text-[#0A0A0A] flex items-center gap-2 uppercase tracking-tight">
              <Lock className="w-4 h-4 text-[#0A0A0A]" />
              &gt; WHAT IS SSL/TLS?
            </h3>
            
            <p className="text-xs text-[#4B5563] leading-relaxed font-mono">
              SSL (Secure Sockets Layer) and its successor TLS (Transport Layer Security) are cryptographic protocols that establish secure, encrypted links between computers.
            </p>
            <p className="text-xs text-[#4B5563] leading-relaxed font-mono">
              If a site does not have a valid SSL certificate:
            </p>
            <ul className="list-disc pl-4 text-[11px] text-[#4B5563] space-y-1 font-mono">
              <li>Browsers display prominent &quot;Not Secure&quot; warnings to visitors.</li>
              <li>Data transmitted (like login passwords or credit cards) is visible in plaintext to passive network sniffers.</li>
              <li>Search engines lower the site ranking.</li>
            </ul>
          </div>

          <div className="bg-white border border-black p-6 flex items-start space-x-3 text-xs hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <Calendar className="w-5 h-5 text-[#0A0A0A] flex-shrink-0 mt-0.5" />
            <div className="text-[#4B5563] font-mono">
              <strong className="block text-[#0A0A0A] mb-1">$ STANDARD VALIDITY LIFESPANS</strong>
              As of late 2020, public SSL certificates are limited to a maximum lifetime of 398 days (approx. 13 months) to ensure quick rotations and modern cipher updates.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
