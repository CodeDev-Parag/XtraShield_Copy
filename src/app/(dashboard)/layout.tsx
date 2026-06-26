"use client";

import React from "react";
import Sidebar from "@/components/shared/Sidebar";
import { ShieldCheck, Bell, Cpu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans select-none text-[#0A0A0A]">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden bg-white">
        
        {/* Top Header */}
        <header className="flex items-center justify-between h-14 px-6 border-b border-black bg-[#F8F9FA] z-20 shrink-0">
          
          {/* Header Left: Status Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#16A34A] text-white text-xs font-bold font-mono uppercase tracking-widest" data-testid="status-badge">
              <span className="inline-flex w-2 h-2 bg-white"></span>
              SYSTEMS SECURE
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-[#4B5563] font-mono uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              Engine v1.4.2
            </div>
          </div>

          {/* Header Right: Quick Actions & Profile */}
          <div className="flex items-center gap-3">
            <button
              data-testid="header-notifications"
              className="relative w-9 h-9 border border-black bg-white hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 flex items-center justify-center"
            >
              <Bell className="w-4 h-4 text-[#0A0A0A]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626]" />
            </button>
            
            <div className="flex items-center gap-3 pl-3 border-l border-black">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold font-mono text-[#0A0A0A] leading-tight uppercase tracking-wider">Admin</span>
                <span className="text-[10px] font-mono text-[#4B5563]">SEC_OPS_ROOT</span>
              </div>
              <div className="w-9 h-9 bg-black flex items-center justify-center text-sm font-bold text-white font-mono">
                SO
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Pane */}
        <main className="flex-1 overflow-y-auto bg-white relative">
          {children}
        </main>
      </div>
    </div>
  );
}
