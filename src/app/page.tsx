"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Shield, 
  Terminal as TerminalIcon, 
  ArrowRight, 
  Lock, 
  Cpu, 
  Database, 
  Mail, 
  Globe, 
  Search, 
  Fingerprint, 
  AlertOctagon,
  ChevronRight
} from "lucide-react";

const scanLogs = [
  "xtrashield --scan all --host void_node_omega",
  "[SYSTEM] Initializing defense protocols...",
  "[OK] Kernel modules integrity verified.",
  "[SCANNING] Memory buffer audit in progress...",
  "[OK] 0 active rootkits detected in RAM.",
  "[SCANNING] Evaluating host firewall rules...",
  "[ALERT] High-risk rule: Port 3306 (MySQL) open to public.",
  "[SCANNING] Crawling credential dump APIs...",
  "[WARN] Found 2 leaked passwords linked to admin@void.io",
  "[SCANNING] Analyzing local SSL/TLS certificate chains...",
  "[OK] Certificate expires in 282 days. Algorithm: SHA-256.",
  "[SYSTEM] Threat mitigation sequence activated.",
  "[OK] Firewall rule patched. Port 3306 isolated.",
  "[SYSTEM] Scan complete. Security score computed: 85.",
];

export default function LandingPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  // Simulated Terminal Log Streamer
  useEffect(() => {
    if (currentLogIndex >= scanLogs.length) {
      const resetTimeout = setTimeout(() => {
        setLogs([]);
        setCurrentLogIndex(0);
      }, 5000);
      return () => clearTimeout(resetTimeout);
    }

    const logTimeout = setTimeout(() => {
      setLogs((prev) => [...prev, scanLogs[currentLogIndex]]);
      setCurrentLogIndex((prev) => prev + 1);
    }, currentLogIndex === 0 ? 1000 : 800 + Math.random() * 800);

    return () => clearTimeout(logTimeout);
  }, [currentLogIndex]);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] overflow-x-hidden relative flex flex-col font-mono select-none">
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-60" />
      </div>

      {/* Header Nav */}
      <header className="w-full h-20 px-6 md:px-12 border-b border-black bg-white flex items-center justify-between z-50 sticky top-0">
        <Link href="/" className="flex items-center gap-2 group" data-testid="logo-link">
          <div className="w-10 h-10 bg-black border border-black flex items-center justify-center group-hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 overflow-hidden">
            <img src="/logo.jpg" alt="XtraShield Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-heading font-extrabold tracking-widest text-lg ml-1 uppercase">
            XtraShield
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-xs font-bold tracking-widest uppercase text-[#4B5563]">
          <a href="#features" className="hover:text-[#0A0A0A] transition-colors duration-100" data-testid="nav-modules">$ MODULES</a>
          <a href="#terminal-demo" className="hover:text-[#0A0A0A] transition-colors duration-100" data-testid="nav-engine">&gt; ENGINE</a>
          <a href="#specs" className="hover:text-[#0A0A0A] transition-colors duration-100" data-testid="nav-arch">&gt; ARCH</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" data-testid="dashboard-link">
            <button className="h-10 px-6 bg-black text-white hover:bg-[#16A34A] font-bold tracking-widest text-xs uppercase transition-colors duration-100 border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow" data-testid="dashboard-btn">
              DASHBOARD
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center z-10 w-full">
        
        {/* Hero Info (Left) */}
        <div className="lg:col-span-6 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F8F9FA] border border-black text-xs font-mono font-bold text-[#0A0A0A] uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 bg-[#16A34A]"></span>
            </span>
            SYSTEM ONLINE &middot; V. 1.4.2
          </div>

          <h1 className="text-5xl lg:text-7xl font-heading font-extrabold tracking-tighter leading-[1.1] uppercase">
            ERADICATE<br />
            THREATS.<br />
            <span className="text-[#16A34A]">SECURE THE VOID.</span>
          </h1>

          <p className="text-[#4B5563] text-lg lg:text-xl max-w-xl font-mono font-normal leading-relaxed">
            Continuous system audits, real-time vulnerability scanning, and automated defense orchestration consolidated in a high-performance command center.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link 
              href="/dashboard" 
              className="h-14 px-8 bg-black text-white hover:bg-[#16A34A] font-bold tracking-widest text-sm uppercase transition-all duration-100 flex items-center justify-center gap-2 border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] group"
              data-testid="hero-launch-btn"
            >
              $ LAUNCH SUITE 
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features" 
              className="h-14 px-8 bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] font-bold tracking-widest text-sm uppercase transition-all duration-100 flex items-center justify-center border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              data-testid="hero-explore-btn"
            >
              &gt; EXPLORE MODULES
            </a>
          </div>
        </div>

        {/* Hero Graphics (Right) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative w-full h-[500px]">
          {/* Interactive Scanning Terminal */}
          <div 
            id="terminal-demo" 
            className="w-full max-w-lg bg-white border border-black overflow-hidden font-mono text-left z-10 relative shadow-[8px_8px_0px_rgba(0,0,0,1)]"
          >
            {/* Terminal Window Header */}
            <div className="h-12 px-4 bg-[#F8F9FA] border-b border-black flex items-center justify-between select-none relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#DC2626] border border-black" />
                <div className="w-3 h-3 bg-[#EAB308] border border-black" />
                <div className="w-3 h-3 bg-[#16A34A] border border-black" />
              </div>
              <div className="text-xs font-bold text-[#4B5563] flex items-center gap-2 bg-white px-3 py-1 border border-black">
                <TerminalIcon className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>engine@xtrashield:~</span>
              </div>
              <div className="w-10" />
            </div>

            {/* Terminal Body */}
            <div ref={terminalBodyRef} className="p-5 h-72 overflow-y-auto space-y-2.5 text-[11px] sm:text-xs relative select-text scroll-smooth z-10 bg-white">
              {logs.map((log, index) => {
                let colorClass = "text-[#0A0A0A]";
                let bgHighlight = "";
                
                if (log.startsWith("[OK]")) colorClass = "text-[#16A34A] font-bold";
                else if (log.startsWith("[ALERT]")) {
                  colorClass = "text-[#DC2626] font-bold";
                  bgHighlight = "bg-[#FEE2E2] border-l-2 border-[#DC2626] pl-2 py-0.5 -ml-2";
                }
                else if (log.startsWith("[WARN]")) colorClass = "text-[#EAB308] font-bold";
                else if (log.startsWith("[SYSTEM]") || log.startsWith("[SCANNING]")) colorClass = "text-[#4B5563] font-bold";
                else if (log.startsWith("xtrashield")) colorClass = "text-[#0A0A0A] font-bold";

                return (
                  <div 
                    key={index} 
                    className={`${colorClass} ${bgHighlight} leading-relaxed`}
                  >
                    {log.startsWith("xtrashield") && <span className="text-[#16A34A] mr-2 font-normal">$</span>}
                    {log}
                  </div>
                );
              })}
              
              {currentLogIndex < scanLogs.length && (
                <div className="flex items-center gap-1.5 text-[#0A0A0A] font-bold pt-1">
                  <span>$</span>
                  <span className="w-2 h-4 bg-[#0A0A0A] animate-pulse" />
                </div>
              )}
            </div>

            {/* Terminal Footer */}
            <div className="h-8 px-5 bg-[#F8F9FA] border-t border-black flex items-center justify-between text-[9px] text-[#4B5563] font-bold tracking-widest uppercase select-none z-10 relative">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#16A34A]" />
                CORE CONNECTED
              </span>
              <span>LATENCY: 12MS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-12 py-24 w-full z-10 relative">
        <div className="text-center space-y-6 max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight uppercase">
            &gt; DEFENSE ARSENAL
          </h2>
          <p className="text-[#4B5563] text-sm md:text-base leading-relaxed font-mono">
            XtraShield orchestrates multiple scanning vectors into a single, unified high-performance dashboard, providing complete visibility over your attack surface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
          
          {/* Card 1: Multi-Vector (Spans 2 cols) */}
          <div className="md:col-span-2 p-8 bg-white border border-black space-y-5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 group overflow-hidden relative">
            <div className="w-14 h-14 bg-[#F8F9FA] border border-black flex items-center justify-center text-[#0A0A0A] group-hover:bg-black group-hover:text-white transition-colors duration-100">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-heading uppercase tracking-tight">&gt; MULTI-VECTOR SCANNER</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed max-w-md font-mono">
              Audits open communication ports, discovers system services, and verifies network firewalls to ensure maximum exposure blockages across your entire infrastructure.
            </p>
          </div>

          {/* Card 2: Email Leak */}
          <div className="p-8 bg-white border border-black space-y-5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 group overflow-hidden relative">
            <div className="w-14 h-14 bg-[#F8F9FA] border border-black flex items-center justify-center text-[#16A34A] group-hover:bg-[#16A34A] group-hover:text-white transition-colors duration-100">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-heading uppercase tracking-tight">&gt; LEAK AUDIT</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed font-mono">
              Scans known credential breach repositories and dark web archives in real-time.
            </p>
          </div>

          {/* Card 3: Password Audit */}
          <div className="p-8 bg-white border border-black space-y-5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 group overflow-hidden relative">
            <div className="w-14 h-14 bg-[#F8F9FA] border border-black flex items-center justify-center text-[#EAB308] group-hover:bg-[#EAB308] group-hover:text-black transition-colors duration-100">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-heading uppercase tracking-tight">&gt; CRYPTO STRENGTH</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed font-mono">
              Audits critical security passwords against high-throughput dictionary attacks.
            </p>
          </div>

          {/* Card 4: Dark Web (Spans 2 cols) */}
          <div className="md:col-span-2 p-8 bg-white border border-black space-y-5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 group overflow-hidden relative">
            <div className="w-14 h-14 bg-[#F8F9FA] border border-black flex items-center justify-center text-[#DC2626] group-hover:bg-[#DC2626] group-hover:text-white transition-colors duration-100">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-heading uppercase tracking-tight">&gt; DARK WEB CRAWLING</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed max-w-md font-mono">
              Continuously crawls encrypted onion routers and hacker forums to notify you before leaked data is weaponized. Employs advanced heuristics to map threat actor discussions to your digital assets.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-black bg-[#F8F9FA] py-10 px-6 md:px-12 text-center text-xs text-[#4B5563] flex flex-col md:flex-row items-center justify-between gap-6 mt-auto z-10 relative font-mono">
        <div className="flex items-center gap-2 font-bold font-heading text-[#0A0A0A] tracking-widest uppercase">
          <div className="w-5 h-5 bg-black border border-black overflow-hidden flex items-center justify-center">
            <img src="/logo.jpg" alt="XtraShield Logo" className="w-full h-full object-cover" />
          </div>
          XtraShield
        </div>
        <span className="font-mono">&copy; {new Date().getFullYear()} XTRASHIELD SYSTEM CORE. ALL RIGHTS RESERVED.</span>
        <div className="flex items-center gap-6 font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-[#0A0A0A] transition-colors flex items-center gap-1.5" data-testid="github-link">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GITHUB
          </a>
          <a href="#" className="hover:text-[#0A0A0A] transition-colors" data-testid="privacy-link">PRIVACY</a>
        </div>
      </footer>
    </div>
  );
}
