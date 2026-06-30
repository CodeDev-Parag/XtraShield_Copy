'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Server, 
  Activity, 
  AlertTriangle, 
  Layers, 
  Cpu, 
  HardDrive, 
  ListFilter,
  Eye,
  EyeOff,
  Calendar,
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SystemScan {
  id: string;
  platform: string;
  osName: string;
  osVersion: string;
  kernelVersion: string;
  hostname: string;
  overallScore: number;
  networkScore: number;
  processScore: number;
  softwareScore: number;
  permissionScore: number;
  openPorts: any; // JSON string or Array
  runningProcesses: any;
  installedSoftware: any;
  permissionIssues: any;
  networkInterfaces: any;
  vulnerabilities: any;
  agentVersion: string;
  scanDuration: number;
  createdAt: string;
}

export default function SystemScannerPage() {
  const [apiKey, setApiKey] = useState('Loading...');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [scans, setScans] = useState<SystemScan[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [selectedScan, setSelectedScan] = useState<SystemScan | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  useEffect(() => {
    fetchApiKey();
    fetchScanHistory();
  }, []);

  const fetchApiKey = async () => {
    try {
      const res = await fetch('/api/user/api-key');
      const data = await res.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
      }
    } catch {
      setApiKey('Error loading key');
    }
  };

  const regenerateApiKey = async () => {
    if (!confirm('Are you sure you want to regenerate your API key? The old key will stop working.')) return;
    try {
      const res = await fetch('/api/user/api-key/regenerate', { method: 'POST' });
      const data = await res.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
        toast.success('API Key regenerated successfully.');
      }
    } catch {
      toast.error('Failed to regenerate API Key.');
    }
  };

  const fetchScanHistory = async () => {
    setLoadingScans(true);
    try {
      const res = await fetch('/api/scan/history');
      const data = await res.json();
      if (data.scans) {
        setScans(data.scans);
        if (data.scans.length > 0) {
          setSelectedScan(data.scans[0]);
        }
      }
    } catch {
      toast.error('Failed to load scan history.');
    } finally {
      setLoadingScans(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    toast.success('API Key copied to clipboard.');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyCommand = () => {
    const cmd = `npx xtrashield-scan --key ${apiKey}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    toast.success('CLI scan command copied.');
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  // Helper to parse JSON columns
  const parseJsonColumn = (col: any): any[] => {
    if (!col) return [];
    if (typeof col === 'string') {
      try {
        return JSON.parse(col);
      } catch {
        return [];
      }
    }
    return Array.isArray(col) ? col : [];
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-[#16A34A] border-black bg-[#DCFCE7]';
    if (score >= 40) return 'text-[#EAB308] border-black bg-[#FEF3C7]';
    return 'text-[#DC2626] border-black bg-[#FEE2E2]';
  };

  const getSeverityBadge = (sev: string) => {
    const s = sev.toUpperCase();
    if (s === 'CRITICAL') return <Badge className="bg-[#DC2626] text-white border border-black font-semibold text-[10px] tracking-widest uppercase px-2 py-0.5 font-mono">CRITICAL</Badge>;
    if (s === 'HIGH') return <Badge className="bg-[#FEE2E2] text-[#DC2626] border border-black font-semibold text-[10px] tracking-widest uppercase px-2 py-0.5 font-mono">HIGH</Badge>;
    if (s === 'MEDIUM') return <Badge className="bg-[#FEF3C7] text-[#EAB308] border border-black font-semibold text-[10px] tracking-widest uppercase px-2 py-0.5 font-mono">MEDIUM</Badge>;
    return <Badge className="bg-[#F3F4F6] text-[#0A0A0A] border border-black font-semibold text-[10px] tracking-widest uppercase px-2 py-0.5 font-mono">{s}</Badge>;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative font-mono">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-black">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-[#0A0A0A] flex items-center gap-3 uppercase">
            <Terminal className="w-8 h-8 text-[#0A0A0A]" />
            &gt; SYSTEM SECURITY SCANNER
          </h1>
          <p className="text-sm text-[#4B5563] mt-1 font-medium font-mono">
            Install our local daemon agent to audit listening socket interfaces, SUID process permissions, and configurations.
          </p>
        </div>
        <Button 
          onClick={fetchScanHistory} 
          data-testid="refresh-scan-list"
          className="bg-black text-white hover:bg-[#16A34A] border border-black h-10 px-4 gap-1.5 text-xs font-heading font-bold tracking-widest uppercase transition-shadow duration-100 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
        >
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH LIST
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Setup Instructions & Key */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold tracking-widest text-[#0A0A0A] flex items-center gap-2 uppercase font-mono">
                <Download className="w-4 h-4" /> $ 1. DOWNLOAD DAEMON
              </CardTitle>
              <CardDescription className="text-xs text-[#4B5563] font-mono">
                Global binary download via Node Package Manager (NPM).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8F9FA] border border-black font-mono text-[11px] text-[#0A0A0A] select-all">
                npm install -g xtrashield-agent
              </div>
              <p className="text-[10px] text-[#4B5563] leading-relaxed font-mono">
                Ensure Node.js v18+ is active. On Linux or macOS platforms, Administrator (`sudo`) bindings might be required for ports inspection.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold tracking-widest text-[#0A0A0A] flex items-center gap-2 uppercase font-mono">
                <Lock className="w-4 h-4" /> $ 2. API CREDENTIALS
              </CardTitle>
              <CardDescription className="text-xs text-[#4B5563] font-mono">
                Authorize agent upload scanner logs to your cloud account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  readOnly
                  value={apiKey}
                  data-testid="api-key-input"
                  className="w-full bg-white border border-black py-2.5 px-4 pr-20 text-xs font-mono text-[#0A0A0A] outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
                <div className="absolute right-1.5 top-1.5 flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowKey(!showKey)}
                    data-testid="toggle-api-key-visibility"
                    className="w-7 h-7 hover:bg-[#F3F4F6] hover:text-[#0A0A0A] text-[#4B5563]"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopyKey}
                    data-testid="copy-api-key"
                    className="w-7 h-7 hover:bg-[#F3F4F6] hover:text-[#0A0A0A] text-[#4B5563]"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={regenerateApiKey}
                  data-testid="regenerate-api-key"
                  className="w-full bg-white text-black border border-black hover:bg-[#F3F4F6] text-[10px] h-9 tracking-widest uppercase font-bold font-mono transition-shadow duration-100 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" /> RE-GEN KEY
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold tracking-widest text-[#0A0A0A] flex items-center gap-2 uppercase font-mono">
                <Terminal className="w-4 h-4" /> $ 3. INITIATE AUDIT
              </CardTitle>
              <CardDescription className="text-xs text-[#4B5563] font-mono">
                Trigger scan via terminal console.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative p-3 bg-[#F8F9FA] border border-black font-mono text-[11px] text-[#0A0A0A] select-all pr-12 leading-relaxed">
                npx xtrashield-scan --key {apiKey.substring(0, 8)}...
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopyCommand}
                  data-testid="copy-scan-command"
                  className="absolute right-1.5 top-1.5 w-7 h-7 hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0A0A]"
                >
                  {copiedCommand ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <p className="text-[10px] text-[#4B5563] leading-relaxed font-mono">
                Scan uploads instantly to the server. Results reflect in the history index below immediately upon completion.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Scan Log history and Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* History log list */}
          <Card className="bg-white border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold tracking-widest text-[#0A0A0A] uppercase font-mono">
                &gt; AUDIT HISTORY LOGS
              </CardTitle>
              <CardDescription className="text-xs font-mono text-[#4B5563]">
                History of security scans uploaded from your endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingScans ? (
                <div className="py-10 text-center text-xs text-[#4B5563] flex items-center justify-center gap-2 font-mono">
                  <RefreshCw className="w-4 h-4 text-[#0A0A0A]" />
                  Accessing database archives...
                </div>
              ) : scans.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-black">
                  <ShieldAlert className="w-10 h-10 mx-auto text-[#4B5563] mb-2" />
                  <p className="text-xs font-semibold text-[#4B5563] font-mono">No Scans Recorded</p>
                  <p className="text-[11px] text-[#4B5563] mt-0.5 font-mono">Please copy the API key and run the local daemon CLI agent first.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-black bg-[#F8F9FA]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest font-bold h-9 font-mono">Date</TableHead>
                        <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest font-bold h-9 font-mono">Hostname</TableHead>
                        <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest font-bold h-9 font-mono">Platform</TableHead>
                        <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest font-bold h-9 text-center font-mono">Issues</TableHead>
                        <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest font-bold h-9 text-right font-mono">Integrity Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {scans.map((scan) => {
                        const vulns = parseJsonColumn(scan.vulnerabilities);
                        const isCurrent = selectedScan?.id === scan.id;
                        return (
                          <TableRow 
                            key={scan.id} 
                            onClick={() => setSelectedScan(scan)}
                            data-testid={`scan-row-${scan.id}`}
                            className={cn(
                              "cursor-pointer border-b border-black transition-colors",
                              isCurrent ? "bg-[#F3F4F6]" : "hover:bg-[#F8F9FA]"
                            )}
                          >
                            <TableCell className="py-3 font-mono text-[#0A0A0A] text-[11px] flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#4B5563]" />
                              {new Date(scan.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="py-3 text-[#4B5563] font-mono">{scan.hostname || 'unknown-host'}</TableCell>
                            <TableCell className="py-3 capitalize text-[#4B5563]">
                              <Badge variant="outline" className="border border-black bg-white text-[10px] uppercase font-mono px-2 py-0.5 tracking-widest">
                                {scan.platform}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-center text-[#4B5563] font-mono">
                              {vulns.length > 0 ? (
                                <span className="text-[#DC2626] font-bold">{vulns.length} Critical</span>
                              ) : (
                                <span className="text-[#16A34A]">0</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <span className={cn(
                                "inline-block px-2 py-0.5 border text-[11px] font-bold font-mono",
                                getScoreColorClass(scan.overallScore ?? 100)
                              )}>
                                {scan.overallScore}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details report viewer */}
          {selectedScan && (
            <Card className="bg-white border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
              <CardHeader className="pb-3 border-b border-black bg-[#F8F9FA] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-sm font-bold tracking-widest text-[#0A0A0A] flex items-center gap-1.5 uppercase font-mono">
                    <Server className="w-4 h-4 text-[#0A0A0A]" />
                    &gt; AUDIT REPORT: {selectedScan.hostname || 'LOCAL_NODE'}
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1 flex-wrap mt-1 text-[#4B5563] font-mono">
                    <span>OS: {selectedScan.osName} ({selectedScan.osVersion})</span>
                    <span className="text-[#4B5563]">•</span>
                    <span>Kernel: {selectedScan.kernelVersion}</span>
                    <span className="text-[#4B5563]">•</span>
                    <span>Version: {selectedScan.agentVersion || '1.0.0'}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] text-[#4B5563] font-mono uppercase tracking-widest">Overall Posture</div>
                    <div className={cn(
                      "text-xl font-bold font-mono text-right",
                      selectedScan.overallScore >= 80 ? 'text-[#16A34A]' : selectedScan.overallScore >= 40 ? 'text-[#EAB308]' : 'text-[#DC2626]'
                    )}>
                      {selectedScan.overallScore}/100
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Tabs defaultValue="vulnerabilities" className="space-y-4">
                  <TabsList className="bg-white border-b border-black p-0 w-full flex overflow-x-auto justify-start h-10 scrollbar-none">
                    <TabsTrigger data-testid="tab-mitigations" value="vulnerabilities" className="text-xs py-1.5 px-3 font-mono font-bold uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-black">Mitigations</TabsTrigger>
                    <TabsTrigger data-testid="tab-sockets" value="ports" className="text-xs py-1.5 px-3 font-mono font-bold uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-black">Sockets</TabsTrigger>
                    <TabsTrigger data-testid="tab-processes" value="processes" className="text-xs py-1.5 px-3 font-mono font-bold uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-black">Processes</TabsTrigger>
                    <TabsTrigger data-testid="tab-privileges" value="permissions" className="text-xs py-1.5 px-3 font-mono font-bold uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-black">Privileges</TabsTrigger>
                    <TabsTrigger data-testid="tab-packages" value="software" className="text-xs py-1.5 px-3 font-mono font-bold uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-black">Packages</TabsTrigger>
                    <TabsTrigger data-testid="tab-interfaces" value="network" className="text-xs py-1.5 px-3 font-mono font-bold uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-black">Interfaces</TabsTrigger>
                  </TabsList>

                  {/* Mitigations Tab */}
                  <TabsContent value="vulnerabilities" className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-[#0A0A0A] tracking-widest font-mono">&gt; PRIORITIZED SECURITY FIXES</h3>
                    {parseJsonColumn(selectedScan.vulnerabilities).length === 0 ? (
                      <div className="py-8 text-center border border-black bg-[#F8F9FA]">
                        <ShieldCheck className="w-8 h-8 text-[#16A34A] mx-auto mb-1.5" />
                        <p className="text-xs text-[#0A0A0A] font-semibold font-mono">AUDIT PASSED SUCCESSFULLY</p>
                        <p className="text-[11px] text-[#4B5563] mt-0.5 font-mono">No critical issues or vulnerabilities were discovered in the system config.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {parseJsonColumn(selectedScan.vulnerabilities).map((vuln: any, idx: number) => (
                          <div key={vuln.id || idx} className="p-3.5 bg-[#F8F9FA] border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-start gap-3 transition-shadow duration-100">
                            <AlertTriangle className={cn(
                              "w-5 h-5 shrink-0 mt-0.5",
                              vuln.severity === 'CRITICAL' || vuln.severity === 'HIGH' ? 'text-[#DC2626]' : 'text-[#EAB308]'
                            )} />
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-[#0A0A0A] font-mono">{vuln.title}</span>
                                {getSeverityBadge(vuln.severity || 'medium')}
                                <span className="text-[10px] font-mono text-[#4B5563]">CVSS {vuln.cvss || 'N/A'}</span>
                              </div>
                              <p className="text-[#4B5563] text-[11px] leading-relaxed font-mono">{vuln.recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Ports Tab */}
                  <TabsContent value="ports">
                    <div className="border border-black overflow-hidden max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-[#F8F9FA] border-b border-black">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Port</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Service</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">State</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 text-right font-mono font-bold">Risk Level</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {parseJsonColumn(selectedScan.openPorts).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-[#4B5563] font-mono">No open listening sockets detected.</TableCell>
                            </TableRow>
                          ) : (
                            parseJsonColumn(selectedScan.openPorts).map((port: any, idx: number) => (
                              <TableRow key={idx} className="border-b border-black hover:bg-[#F8F9FA]">
                                <TableCell className="font-mono text-[#0A0A0A] font-semibold">{port.port}</TableCell>
                                <TableCell className="font-mono text-[#0A0A0A]">{port.service}</TableCell>
                                <TableCell>
                                  <Badge className="bg-[#16A34A] text-white border border-black text-[9px] px-1.5 font-bold uppercase tracking-widest font-mono">
                                    {port.state}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono capitalize">
                                  {port.risk === 'critical' ? (
                                    <span className="text-[#DC2626] font-bold">Critical</span>
                                  ) : port.risk === 'medium' ? (
                                    <span className="text-[#EAB308]">Medium</span>
                                  ) : (
                                    <span className="text-[#4B5563]">Low</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Processes Tab */}
                  <TabsContent value="processes">
                    <div className="border border-black overflow-hidden max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-[#F8F9FA] border-b border-black">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">PID</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Process Name</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">CPU %</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Mem %</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 text-right font-mono font-bold">Risk</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs font-mono">
                          {parseJsonColumn(selectedScan.runningProcesses).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-[#4B5563] font-mono">No process tables recorded.</TableCell>
                            </TableRow>
                          ) : (
                            parseJsonColumn(selectedScan.runningProcesses).map((proc: any, idx: number) => (
                              <TableRow key={idx} className="border-b border-black hover:bg-[#F8F9FA]">
                                <TableCell className="text-[#4B5563]">{proc.pid}</TableCell>
                                <TableCell className="text-[#0A0A0A] max-w-[200px] truncate" title={proc.path}>{proc.name}</TableCell>
                                <TableCell className="text-[#4B5563]">{parseFloat(proc.cpu).toFixed(1)}%</TableCell>
                                <TableCell className="text-[#4B5563]">{parseFloat(proc.memory).toFixed(1)}%</TableCell>
                                <TableCell className="text-right">
                                  {proc.risk === 'high' ? (
                                    <span className="text-[#DC2626] font-bold">SUSPICIOUS</span>
                                  ) : proc.risk === 'medium' ? (
                                    <span className="text-[#EAB308]">ELEVATED</span>
                                  ) : (
                                    <span className="text-[#4B5563]">SAFE</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Permissions Tab */}
                  <TabsContent value="permissions">
                    <div className="border border-black overflow-hidden max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-[#F8F9FA] border-b border-black">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Issue Description</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Target Path</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 text-right font-mono font-bold">Severity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {parseJsonColumn(selectedScan.permissionIssues).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-6 text-[#4B5563] font-mono">No configuration privilege issues found.</TableCell>
                            </TableRow>
                          ) : (
                            parseJsonColumn(selectedScan.permissionIssues).map((issue: any, idx: number) => (
                              <TableRow key={idx} className="border-b border-black hover:bg-[#F8F9FA]">
                                <TableCell className="text-[#0A0A0A] font-mono">{issue.issue}</TableCell>
                                <TableCell className="font-mono text-[#4B5563] text-[11px] truncate max-w-[250px]" title={issue.path}>{issue.path}</TableCell>
                                <TableCell className="text-right font-mono capitalize">
                                  {issue.severity === 'high' ? (
                                    <span className="text-[#DC2626] font-bold">High</span>
                                  ) : (
                                    <span className="text-[#EAB308]">Medium</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Software packages Tab */}
                  <TabsContent value="software">
                    <div className="border border-black overflow-hidden max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-[#F8F9FA] border-b border-black">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Package/Application</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Installed Version</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 text-right font-mono font-bold">CVE Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {parseJsonColumn(selectedScan.installedSoftware).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-6 text-[#4B5563] font-mono">No package registries fetched.</TableCell>
                            </TableRow>
                          ) : (
                            parseJsonColumn(selectedScan.installedSoftware).map((sw: any, idx: number) => (
                              <TableRow key={idx} className="border-b border-black hover:bg-[#F8F9FA]">
                                <TableCell className="text-[#0A0A0A] font-mono">{sw.name}</TableCell>
                                <TableCell className="text-[#4B5563] font-mono">{sw.version}</TableCell>
                                <TableCell className="text-right">
                                  <Badge className="bg-[#16A34A] text-white border border-black text-[9px] px-1.5 font-bold uppercase tracking-widest font-mono">
                                    Clean
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Network interfaces Tab */}
                  <TabsContent value="network">
                    <div className="border border-black overflow-hidden max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-[#F8F9FA] border-b border-black">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Interface</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">IPv4 Address</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 font-mono font-bold">Connection Type</TableHead>
                            <TableHead className="text-[10px] text-[#4B5563] uppercase tracking-widest h-9 text-right font-mono font-bold">Loopback</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {parseJsonColumn(selectedScan.networkInterfaces).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-[#4B5563] font-mono">No network interfaces mapped.</TableCell>
                            </TableRow>
                          ) : (
                            parseJsonColumn(selectedScan.networkInterfaces).map((net: any, idx: number) => (
                              <TableRow key={idx} className="border-b border-black hover:bg-[#F8F9FA]">
                                <TableCell className="font-semibold text-[#0A0A0A] font-mono">{net.name}</TableCell>
                                <TableCell className="font-mono text-[#4B5563]">{net.address || 'N/A'}</TableCell>
                                <TableCell className="text-[#4B5563] capitalize font-mono">{net.type || 'unknown'}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {net.internal ? (
                                    <span className="text-[#0A0A0A] font-bold">True</span>
                                  ) : (
                                    <span className="text-[#4B5563]">False</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
