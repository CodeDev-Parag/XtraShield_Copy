"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Mail,
  KeyRound,
  Network,
  Search,
  Lock,
  ChevronLeft,
  ChevronRight,
  Settings,
  Shield,
  FileText,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Scanner",
    href: "/scanner",
    icon: ShieldAlert,
  },
  {
    name: "Email Scan",
    href: "/email",
    icon: Mail,
  },
  {
    name: "Password Scan",
    href: "/password",
    icon: KeyRound,
  },
  {
    name: "Network Scan",
    href: "/network",
    icon: Network,
  },
  {
    name: "Phishing Scan",
    href: "/phishing",
    icon: AlertTriangle,
  },
  {
    name: "SSL Checker",
    href: "/ssl",
    icon: Lock,
  },
  {
    name: "Dark Web Scan",
    href: "/dark-web",
    icon: Search,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        "relative flex flex-col h-screen border-r border-black bg-[#F8F9FA] transition-all duration-200 z-30 shrink-0",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-black">
        <Link
          href="/"
          data-testid="sidebar-logo"
          className={cn(
            "flex items-center gap-2 font-heading font-bold text-lg select-none transition-opacity uppercase tracking-tighter",
            isCollapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100"
          )}
        >
          <div className="relative flex items-center justify-center w-8 h-8 bg-black overflow-hidden border border-black">
            <img src="/logo.jpg" alt="XtraShield Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-black">
            XTRASHIELD
          </span>
        </Link>
        {isCollapsed && (
          <div className="w-8 h-8 flex items-center justify-center mx-auto bg-black overflow-hidden border border-black">
            <img src="/logo.jpg" alt="XtraShield Logo" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`sidebar-link-${item.href.replace("/", "")}`}
              className={cn(
                "group flex items-center h-10 px-3 text-sm font-mono font-medium transition-all duration-100 relative",
                isActive
                  ? "bg-black text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isCollapsed ? "mx-auto" : "mr-3",
                  isActive ? "text-white" : "text-[#4B5563] group-hover:text-black"
                )}
              />
              <span
                className={cn(
                  "transition-all duration-200 whitespace-nowrap uppercase tracking-widest text-xs",
                  isCollapsed ? "opacity-0 w-0 overflow-hidden pointer-events-none" : "opacity-100"
                )}
              >
                {item.name}
              </span>

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-14 scale-0 group-hover:scale-100 transition-all duration-100 bg-black text-white text-xs px-2.5 py-1.5 pointer-events-none z-50 whitespace-nowrap font-mono uppercase tracking-widest">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer with Toggle Button */}
      <div className="p-2 border-t border-black flex items-center justify-center">
        <button
          onClick={toggleSidebar}
          data-testid="sidebar-toggle"
          className="w-full flex items-center justify-center h-9 hover:bg-[#F3F4F6] text-[#4B5563] hover:text-black transition-colors duration-100 font-mono"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
