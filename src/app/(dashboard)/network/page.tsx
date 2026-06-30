'use client';

import React, { useState, useEffect } from 'react';
import { useSecurityStore } from '@/store/securityStore';
import { 
  Globe, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Wifi, 
  MapPin, 
  Info,
  RefreshCw,
  Play
} from 'lucide-react';

interface IPInfo {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  org: string;
  vpn: boolean;
  reputation: 'safe' | 'warning' | 'danger';
  blacklistCount: number;
  latitude?: number;
  longitude?: number;
}

interface NetworkPortResult {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
  risk: 'low' | 'medium' | 'high';
  description: string;
}

interface ApiPortResult {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
  latencyMs: number | null;
  error?: string;
}

// Helper to get risk level for a port (mirroring the server-side logic)
  const getRiskLevel = (port: number): 'low' | 'medium' | 'high' => {
    const highRisk = new Set([21, 22, 23, 25, 1433, 3306, 3389, 5900]);
    const mediumRisk = new Set([53, 110, 143, 161, 162, 389, 636, 873, 902, 993, 995, 1080, 1085, 1090, 1099, 1521, 2049, 2100, 2181, 2375, 2376, 2379, 2380, 5000, 5001, 5432, 5984, 6379, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090]);
    if (highRisk.has(port)) return 'high';
    if (mediumRisk.has(port)) return 'medium';
    return 'low';
  };

const COMMON_PORTS = [
  { port: 21, service: 'FTP', risk: 'high', description: 'File Transfer Protocol. Often unencrypted and vulnerable.' },
  { port: 22, service: 'SSH', risk: 'medium', description: 'Secure Shell. Vulnerable to brute force attacks if exposed.' },
  { port: 23, service: 'Telnet', risk: 'high', description: 'Plaintext terminal protocol. High security risk.' },
  { port: 25, service: 'SMTP', risk: 'low', description: 'Simple Mail Transfer Protocol.' },
  { port: 80, service: 'HTTP', risk: 'low', description: 'Standard unencrypted web traffic.' },
  { port: 110, service: 'POP3', risk: 'medium', description: 'Post Office Protocol. E-mail access.' },
  { port: 443, service: 'HTTPS', risk: 'low', description: 'Secure encrypted web traffic.' },
  { port: 1433, service: 'MSSQL', risk: 'high', description: 'Microsoft SQL Server Database. High target for hackers.' },
  { port: 3306, service: 'MySQL', risk: 'high', description: 'MySQL Database. Should never be publicly exposed.' },
  { port: 3389, service: 'RDP', risk: 'high', description: 'Remote Desktop Protocol. Frequently targeted for ransomware.' },
  { port: 8080, service: 'HTTP-Alt', risk: 'low', description: 'Alternative web server port.' }
];

export default function NetworkSecurityPage() {
  const addScan = useSecurityStore((state) => state.addScan);

  // IP Details States
  const [ipData, setIpData] = useState<IPInfo | null>(null);
  const [loadingIp, setLoadingIp] = useState(true);
  const [errorIp, setErrorIp] = useState('');

  // Port Scanner States
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPorts, setScannedPorts] = useState<NetworkPortResult[]>([]);

  // Fetch IP details
  const fetchIpDetails = async () => {
    setLoadingIp(true);
    setErrorIp('');
    try {
      const res = await fetch('/api/network/ip-check');
      if (!res.ok) throw new Error('Failed to retrieve IP metadata');
      const data = await res.json();
      setIpData(data);

      addScan({
        type: 'network',
        target: data.ip,
        status: data.vpn ? 'warning' : 'safe',
        details: `Network audit completed. IP: ${data.ip} (${data.org}). VPN Status: ${data.vpn ? 'Detected' : 'Not detected'}.`
      });
    } catch (err: any) {
      console.error(err);
      setErrorIp('Unable to fetch public IP information.');
    } finally {
      setLoadingIp(false);
    }
  };

  useEffect(() => {
    fetchIpDetails();
  }, []);

  // Port scan via API
  const startPortScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScannedPorts([]);

    try {
      // Use the client's public IP from ipData, or fallback to localhost if not available
      const targetHost = ipData?.ip || '127.0.0.1';
      const response = await fetch('/api/network/port-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ host: targetHost })
      });

      if (!response.ok) {
        throw new Error(`Port scan failed: ${response.status}`);
      }

      const data = await response.json();
      const { results, summary } = data as { results: ApiPortResult[]; summary: any };

      // Update state with results
      setScannedPorts(results.map(r => ({
        port: r.port,
        service: r.service,
        status: r.status === 'open' ? 'open' : r.status === 'closed' ? 'closed' : 'filtered',
        risk: getRiskLevel(r.port), // we'll need to define this function or import from utils
        description: `${r.service} port ${r.port} is ${r.status}.`
      })));

      // Simulate progress for UI (since we don't have granular progress from API)
      // We'll animate the progress bar to 100% over a short duration
      const progressSteps = 10;
      for (let i = 1; i <= progressSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms each step
        setScanProgress(i * 10);
      }

      setIsScanning(false);

      // Save scan to store (using the existing addScan from securityStore)
      const openCount = summary.openPorts;
      addScan({
        type: 'network',
        target: targetHost,
        status: openCount > 0 ? 'warning' : 'safe',
        details: `Port scan finished. Scanned ${summary.totalPorts} ports on ${targetHost}, ${openCount} open, ${summary.closedPorts} closed, ${summary.filteredPorts} filtered.`
      });
    } catch (err: any) {
      console.error('Port scan error:', err);
      setIsScanning(false);
      setScannedPorts([]);
      // Optionally show an error to the user
      // For now, we'll just reset and let the UI show empty results
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative font-mono">
      
      {/* Page Title */}
      <div className="flex justify-between items-center border-b border-black pb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-[#0A0A0A] flex items-center gap-3 uppercase">
            <Globe className="w-8 h-8 text-[#0A0A0A]" />
            &gt; NETWORK SECURITY
          </h1>
          <p className="mt-2 text-sm text-[#4B5563] font-mono">
            Inspect public IP address reputation, geolocation data, VPN configuration status, and run connection port scans.
          </p>
        </div>
        <button
          onClick={fetchIpDetails}
          disabled={loadingIp}
          data-testid="refresh-ip-btn"
          className="bg-white border border-black hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0A0A] font-semibold p-3 transition-shadow duration-100 cursor-pointer disabled:opacity-50 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
          title="Refresh IP details"
        >
          <RefreshCw className={`w-4 h-4 ${loadingIp ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Geolocation & ISP Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black p-6">
            <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 flex items-center gap-2.5 uppercase tracking-tight">
              <Wifi className="w-5 h-5 text-[#0A0A0A]" />
              &gt; PUBLIC NETWORK DETAILS
            </h2>

            {loadingIp ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#0A0A0A] animate-spin" />
                <span className="text-xs text-[#4B5563] font-mono uppercase tracking-widest font-bold">Querying public IP details...</span>
              </div>
            ) : errorIp ? (
              <div className="p-4 bg-white border border-[#DC2626] text-xs text-[#DC2626] font-mono font-semibold">
                {errorIp}
              </div>
            ) : ipData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-[#4B5563] font-mono font-bold">Public IP Address</span>
                    <span className="text-xl font-mono font-extrabold text-[#0A0A0A]">{ipData.ip}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-[#4B5563] font-mono font-bold">ISP / Provider</span>
                    <span className="text-sm font-semibold text-[#0A0A0A] font-mono">{ipData.org}</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-2 text-[#4B5563] font-mono">
                    <MapPin className="w-4 h-4 text-[#4B5563]" />
                    <span className="text-xs">
                      {ipData.city}, {ipData.region}, {ipData.country_name}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 border-t md:border-t-0 md:border-l border-black md:pl-6 pt-4 md:pt-0">
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-[#4B5563] font-mono font-bold">Reputation Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold mt-2 uppercase tracking-widest ${
                      ipData.reputation === 'safe' 
                        ? 'bg-[#16A34A] text-white' 
                        : 'bg-[#EAB308] text-black'
                    }`}>
                      {ipData.reputation === 'safe' ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                          EXCELLENT (NO FLAGS)
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                          SUSPICIOUS IP
                        </>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-[#4B5563] font-mono font-bold">Blacklist Occurrences</span>
                    <span className="text-xs font-semibold text-[#4B5563] mt-1 block font-mono">
                      {ipData.blacklistCount === 0 ? 'Not found on spam/malware lists' : `Flagged on ${ipData.blacklistCount} threat feeds`}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Port Scanner Widget */}
          <div className="bg-white border border-black p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-heading font-bold text-[#0A0A0A] flex items-center gap-2.5 uppercase tracking-tight">
                  <Cpu className="w-5 h-5 text-[#0A0A0A]" />
                  $ COMMON PORT AUDIT
                </h2>
                <p className="text-xs text-[#4B5563] mt-1 font-mono">
                  Scan critical TCP ports to check if they are exposed to the public internet.
                </p>
              </div>
              <button
                onClick={startPortScan}
                disabled={isScanning || loadingIp}
                data-testid="scan-ports-btn"
                className="bg-black hover:bg-[#16A34A] text-white font-bold py-2.5 px-5 text-xs uppercase tracking-widest transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 font-mono shrink-0"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                SCAN PORTS
              </button>
            </div>

            {/* Scan Progress Bar */}
            {isScanning && (
              <div className="space-y-3 mb-6 bg-[#F8F9FA] border border-black p-4">
                <div className="flex justify-between text-xs">
                  <span className="text-[#4B5563] flex items-center font-mono">
                    <Terminal className="w-3.5 h-3.5 mr-1.5 text-[#0A0A0A]" />
                    Scanning ports...
                  </span>
                  <span className="font-mono font-bold text-[#0A0A0A]">{scanProgress}%</span>
                </div>
                <div className="w-full bg-[#F3F4F6] h-2 overflow-hidden border border-black">
                  <div 
                    className="bg-black h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Port Results list */}
            {scannedPorts.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {scannedPorts.map((result) => (
                  <div key={result.port} className="bg-white border border-black p-3.5 flex justify-between items-center text-xs hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#0A0A0A] font-mono">Port {result.port} ({result.service})</span>
                        <span className={`text-[9px] px-2 py-0.5 uppercase font-mono font-bold tracking-widest ${
                          result.risk === 'high' ? 'bg-[#DC2626] text-white' :
                          result.risk === 'medium' ? 'bg-[#EAB308] text-black' :
                          'bg-[#F3F4F6] text-[#4B5563] border border-black'
                        }`}>
                          RISK: {result.risk.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] font-mono leading-relaxed pr-4">{result.description}</p>
                    </div>

                    <span className={`px-2 py-0.5 font-mono font-bold uppercase text-[9px] tracking-widest ${
                      result.status === 'open' 
                        ? 'bg-[#DC2626] text-white' 
                        : 'bg-[#16A34A] text-white'
                    }`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : !isScanning ? (
              <div className="py-12 text-center border border-dashed border-black text-[#4B5563] text-xs font-mono bg-[#F8F9FA]">
                Click &quot;Scan Ports&quot; to probe for vulnerability exposures.
              </div>
            ) : null}
          </div>
        </div>

        {/* Security / VPN Warnings Sidebar */}
        <div className="space-y-6">
          {/* VPN Detection Box */}
          <div className="bg-white border border-black p-6 space-y-4">
            <h3 className="text-sm font-heading font-bold text-[#0A0A0A] uppercase tracking-tight">&gt; VPN &amp; NETWORK SHIELD</h3>
            
            {!loadingIp && ipData ? (
              <div className={`p-4 border border-black flex items-start space-x-3 text-xs leading-relaxed font-mono ${
                ipData.vpn 
                  ? 'bg-[#F8F9FA] text-[#16A34A]' 
                  : 'bg-[#F8F9FA] text-[#EAB308]'
              }`}>
                {ipData.vpn ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#0A0A0A] mb-0.5 font-bold font-heading uppercase">VPN ACTIVE</strong>
                      <span className="font-mono text-[#4B5563] text-[11px]">Your traffic is encrypted and your real IP is masked. High privacy.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-[#EAB308] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#0A0A0A] mb-0.5 font-bold font-heading uppercase">UNPROTECTED CONNECTION</strong>
                      <span className="font-mono text-[#4B5563] text-[11px]">No active commercial VPN/proxy was detected. Your public IP is fully visible.</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-16 bg-[#F8F9FA] border border-black" />
            )}

            <div className="text-[11px] text-[#4B5563] space-y-2 leading-relaxed font-mono">
              <div className="flex items-start">
                <Info className="w-3.5 h-3.5 text-[#4B5563] mr-2 mt-0.5 flex-shrink-0" />
                <span>If you aren&apos;t using a VPN, websites can track your approximate physical location, city, and ISP network route.</span>
              </div>
            </div>
          </div>

          {/* DNS Leak / Port security tips */}
          <div className="bg-white border border-black p-6 space-y-4">
            <h3 className="text-sm font-heading font-bold text-[#0A0A0A] uppercase tracking-tight">&gt; SECURING OPEN PORTS</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed font-mono">
              An &quot;open&quot; port is a gateway where a service (like a database or file server) is listening for connections. If exposed to the public internet, hackers can exploit weaknesses or execute brute-force password login scripts to hack your computer.
            </p>
            <div className="pt-3 border-t border-black">
              <strong className="text-[9px] uppercase font-mono font-bold text-[#4B5563] tracking-widest block mb-2">DEFENSE ACTIONS:</strong>
              <ul className="list-disc pl-4 text-[11px] text-[#4B5563] space-y-1.5 font-mono">
                <li>Configure router firewalls to block incoming external ports.</li>
                <li>Disable Universal Plug and Play (UPnP) on routers.</li>
                <li>Close unused local databases when not active.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
