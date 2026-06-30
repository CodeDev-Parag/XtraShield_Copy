"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  ShieldAlert, 
  Server, 
  RefreshCw, 
  Fingerprint, 
  Terminal as TerminalIcon,
  Play,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SecurityScoreRing from "@/components/dashboard/SecurityScoreRing";
import AlertFeed from "@/components/dashboard/AlertFeed";
import { toast } from "sonner";
import { useSecurityStore } from "@/store/securityStore";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanState, setScanState] = useState<"idle" | "running" | "completed">("idle");
  const [currentScore, setCurrentScore] = useState(85);
  
  const [activeAlertsCount, setActiveAlertsCount] = useState(2);
  const [scannedSocketsCount, setScannedSocketsCount] = useState(48);
  const [leaksCount, setLeaksCount] = useState(2);
  const [historyData, setHistoryData] = useState<any[]>([
    { day: "Jun 19", score: 76 },
    { day: "Jun 20", score: 78 },
    { day: "Jun 21", score: 77 },
    { day: "Jun 22", score: 81 },
    { day: "Jun 23", score: 80 },
    { day: "Jun 24", score: 84 },
    { day: "Jun 25", score: 85 },
  ]);

  const monitoredEmails = useSecurityStore(state => state.monitoredEmails);

  const loadDashboardData = async () => {
    try {
      const [scanRes, alertRes] = await Promise.all([
        fetch("/api/scan/history"),
        fetch("/api/alerts"),
      ]);
      const scanData = await scanRes.json();
      const alertData = await alertRes.json();
      if (scanData.scans && scanData.scans.length > 0) {
        const latest = scanData.scans[0];
        if (latest.overallScore !== null) setCurrentScore(latest.overallScore);
        const ports = typeof latest.openPorts === "string" ? JSON.parse(latest.openPorts) : (latest.openPorts || []);
        if (Array.isArray(ports)) setScannedSocketsCount(ports.length);

        const last7 = [...scanData.scans]
          .slice(0, 7)
          .reverse()
          .map((s: any) => {
            const date = new Date(s.createdAt);
            const formattedDate = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return { day: formattedDate, score: s.overallScore || 0 };
          });
        if (last7.length > 0) setHistoryData(last7);
      }

      if (alertData.alerts) {
        const active = alertData.alerts.filter((a: any) => !a.isRead);
        setActiveAlertsCount(active.length);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (monitoredEmails) {
      const sum = monitoredEmails.reduce((acc, item) => acc + (item.breachCount || 0), 0);
      setLeaksCount(sum);
    }
  }, [monitoredEmails]);

  const handleStartScan = () => {
    setScanState("running");
    setScanProgress(0);
    setScanLogs(["[SYSTEM] Initializing scan on void_node_omega...", "[SYSTEM] Connecting security scanner daemon..."]);
    
    const logsSequence = [
      { progress: 15, log: "[SCAN] Querying local ports (0-65535)..." },
      { progress: 30, log: "[SCAN] Evaluating active listening services..." },
      { progress: 45, log: "[ALERT] Threat Found: Port 3306 (MySQL) is public." },
      { progress: 60, log: "[SCAN] Querying Dark Web repository APIs..." },
      { progress: 75, log: "[WARN] Found 2 credential leaks for 'admin@void.io'." },
      { progress: 90, log: "[SCAN] Auditing SSL chain for domain 'void.io'..." },
      { progress: 100, log: "[SYSTEM] Hardening recommendations generated. Integrity score locked." }
    ];

    logsSequence.forEach((step, idx) => {
      setTimeout(() => {
        setScanProgress(step.progress);
        setScanLogs(prev => [...prev, step.log]);
        if (step.progress === 100) {
          setScanState("completed");
          toast.success("Security scan completed. Vulnerabilities isolated!");
        }
      }, (idx + 1) * 800);
    });
  };

  const handleCloseScan = () => {
    setIsScanOpen(false);
    setScanState("idle");
    setScanProgress(0);
    setScanLogs([]);
  };

  const stats = [
    {
      label: "Integrity",
      value: `${currentScore}%`,
      sub: "Optimal shield active",
      icon: Activity,
      subColor: "text-[#16A34A]",
    },
    {
      label: "Threats",
      value: activeAlertsCount,
      sub: "Requires immediate patching",
      icon: ShieldAlert,
      subColor: "text-[#DC2626]",
    },
    {
      label: "Sockets",
      value: scannedSocketsCount,
      sub: "Listener nodes responsive",
      icon: Server,
      subColor: "text-[#4B5563]",
    },
    {
      label: "Leaks",
      value: leaksCount,
      sub: "Dump repository hits",
      icon: Fingerprint,
      subColor: "text-[#EAB308]",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tighter uppercase">
            &gt; Command Center
          </h1>
          <p className="text-sm text-[#4B5563] mt-1 font-mono">
            Real-time threat monitoring and system orchestration.
          </p>
        </div>

        <Button
          onClick={() => {
            setIsScanOpen(true);
            setTimeout(handleStartScan, 300);
          }}
          data-testid="trigger-scan-btn"
          className="h-11 px-6 bg-black text-white hover:bg-[#16A34A] font-bold tracking-widest text-xs border border-black transition-all duration-100 flex items-center gap-2 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
        >
          <RefreshCw className="w-4 h-4" />
          TRIGGER SCAN
        </Button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-black">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              data-testid={`stat-card-${stat.label.toLowerCase()}`}
              className={`p-6 bg-white hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 ${
                idx < stats.length - 1 ? "border-r border-black" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#4B5563]">
                  {stat.label}
                </span>
                <Icon className="w-4 h-4 text-[#4B5563]" />
              </div>
              <div className="text-4xl font-bold font-heading text-[#0A0A0A] tracking-tighter">
                {stat.value}
              </div>
              <p className={`text-xs mt-2 font-mono ${stat.subColor}`}>
                {stat.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Chart & Alerts (Col span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Recharts Integrity Chart */}
          <div className="bg-white border border-black p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-black pb-4">
              <Activity className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="font-heading font-bold text-base tracking-tight uppercase">
                &gt; 7-Day Integrity History
              </h2>
            </div>
            <div className="h-72 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={historyData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="g-score" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#4B5563"
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#4B5563"
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                      domain={[50, 100]}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ stroke: '#000000', strokeWidth: 1, strokeDasharray: '4 4' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 bg-white border border-black font-mono text-sm shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                              <p className="text-[#4B5563] mb-1 text-xs uppercase tracking-widest">{payload[0].payload.day}</p>
                              <p className="text-[#0A0A0A] font-bold flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#16A34A]"></span>
                                Score: <span className="text-[#16A34A]">{payload[0].value}%</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#0A0A0A"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#g-score)"
                      dot={{ stroke: "#0A0A0A", strokeWidth: 2, fill: "#FFFFFF", r: 4 }}
                      activeDot={{ r: 6, stroke: "#0A0A0A", strokeWidth: 2, fill: "#16A34A" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-[#F3F4F6] border border-black" />
              )}
            </div>
          </div>

          {/* Active Incident Feed Card */}
          <div className="bg-white border border-black p-6">
            <AlertFeed />
          </div>

        </div>

        {/* Right Side: Score Ring & Quick Tasks (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Security Score Ring Display Card */}
          <div className="bg-white border border-black flex flex-col items-center p-8 text-center">
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[#4B5563] self-start mb-6 border-b border-black pb-3 w-full">
              &gt; LIVE THREAT GAUGE
            </h3>
            
            <div className="relative">
              <SecurityScoreRing score={currentScore} size={200} strokeWidth={12} />
            </div>
              
            <div className="mt-8 border-t border-black pt-6 w-full text-center">
              <span className="text-[10px] font-mono text-[#0A0A0A] uppercase tracking-widest font-bold">$ SHIELD HARDENING</span>
              <p className="text-sm text-[#4B5563] mt-2 font-mono leading-relaxed px-2">
                Mitigate critical alerts to upgrade your total system integrity score.
              </p>
            </div>
          </div>

          {/* Quick Actions / Suite Tools */}
          <div className="bg-white border border-black p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[#4B5563] pb-3 border-b border-black">
              &gt; ENGINE ACTIONS
            </h3>
            
            <div className="space-y-2">
              <Button
                data-testid="action-run-audit"
                className="w-full h-12 justify-between bg-white border border-black hover:bg-black hover:text-white font-mono font-bold text-sm tracking-widest uppercase transition-all duration-100 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black"
                onClick={() => {
                  setIsScanOpen(true);
                  setTimeout(handleStartScan, 300);
                }}
              >
                <span className="flex items-center gap-3">
                  <Play className="w-4 h-4" />
                  Run Audit
                </span>
                <span className="text-[9px] bg-[#F3F4F6] px-2 py-0.5 border border-black tracking-widest">PORTS</span>
              </Button>

              <Button
                data-testid="action-verify-hashes"
                className="w-full h-12 justify-between bg-white border border-black hover:bg-black hover:text-white font-mono font-bold text-sm tracking-widest uppercase transition-all duration-100 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black"
              >
                <span className="flex items-center gap-3">
                  <Fingerprint className="w-4 h-4" />
                  Verify Hashes
                </span>
                <span className="text-[9px] bg-[#F3F4F6] px-2 py-0.5 border border-black tracking-widest">CRYPTO</span>
              </Button>

              <Button
                data-testid="action-export-log"
                className="w-full h-12 justify-between bg-white border border-black hover:bg-black hover:text-white font-mono font-bold text-sm tracking-widest uppercase transition-all duration-100 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black"
              >
                <span className="flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  Export Log
                </span>
                <span className="text-[9px] bg-[#F3F4F6] px-2 py-0.5 border border-black tracking-widest">PDF</span>
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Simulated Scanner Dialog */}
      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="sm:max-w-[500px] border border-black bg-white text-[#0A0A0A] p-0 overflow-hidden font-mono shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="h-1 bg-black w-full" />
          
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold tracking-widest text-lg flex items-center gap-3 uppercase">
                <TerminalIcon className="w-5 h-5" />
                $ SCAN ENGINE RUNNING
              </DialogTitle>
              <DialogDescription className="text-xs text-[#4B5563] font-mono mt-2">
                Executing comprehensive defense checks across local networks.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 my-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-[#4B5563] uppercase tracking-widest">Diagnostic Progress</span>
                  <span className="text-[#0A0A0A]">{scanProgress}%</span>
                </div>
                <div className="h-2 bg-[#F3F4F6] border border-black">
                  <div
                    className="h-full bg-[#16A34A] transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>

              {/* Simulated Live Logs */}
              <div className="h-48 p-4 bg-[#F8F9FA] border border-black overflow-y-auto text-[11px] leading-relaxed space-y-1.5 font-mono">
                {scanLogs.map((log, idx) => {
                  let color = "text-[#0A0A0A]";
                  if (log.startsWith("[OK]")) color = "text-[#16A34A] font-bold";
                  else if (log.startsWith("[ALERT]")) color = "text-[#DC2626] font-bold";
                  else if (log.startsWith("[WARN]")) color = "text-[#EAB308] font-bold";
                  else if (log.startsWith("[SYSTEM]")) color = "text-[#0A0A0A] font-semibold";
                  else if (log.startsWith("[SCAN]")) color = "text-[#4B5563]";
                  return (
                    <div key={idx} className={color}>
                      {log}
                    </div>
                  );
                })}
                {scanState === "running" && (
                  <div className="flex items-center gap-1.5 text-[#16A34A]">
                    <span className="w-2 h-3.5 bg-[#16A34A] animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="sm:justify-between items-center gap-4 pt-4 border-t border-black mt-4">
              <span className="text-[10px] text-[#4B5563] uppercase font-bold tracking-widest flex items-center gap-2 font-mono">
                <div className="w-2 h-2 bg-[#16A34A]" />
                Target: 127.0.0.1
              </span>
              
              {scanState === "completed" ? (
                <Button
                  onClick={handleCloseScan}
                  data-testid="scan-acknowledge-btn"
                  className="bg-[#16A34A] text-white hover:bg-[#15803D] font-bold tracking-widest text-xs border border-black transition-all h-10 px-6 uppercase hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                >
                  ACKNOWLEDGE
                </Button>
              ) : (
                <Button
                  disabled
                  className="bg-[#F3F4F6] border border-black text-[#4B5563] text-xs h-10 px-6 uppercase tracking-widest font-mono"
                >
                  Processing...
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
