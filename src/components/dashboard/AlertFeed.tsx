"use client";

import React, { useState, useEffect } from "react";
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
  status: "active" | "resolved";
  category: "Network" | "Email" | "Password" | "SSL" | "DarkWeb";
}

export default function AlertFeed() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      if (data.alerts) {
        const mappedAlerts: SecurityAlert[] = data.alerts.map((a: any) => {
          let severity: "critical" | "warning" | "info" = "info";
          const s = a.severity.toLowerCase();
          if (s === "critical" || s === "high") severity = "critical";
          else if (s === "medium" || s === "low") severity = "warning";

          let category: SecurityAlert["category"] = "Network";
          if (a.type === "NEW_BREACH" || a.type === "PASSWORD_EXPOSED") category = "Password";
          else if (a.type === "PHISHING_DETECTED") category = "Email";
          else if (a.type === "SSL_EXPIRING") category = "SSL";

          const date = new Date(a.createdAt);
          const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
          let timestamp = "Just now";
          if (diffMinutes >= 60 * 24) {
            timestamp = `${Math.floor(diffMinutes / (60 * 24))} days ago`;
          } else if (diffMinutes >= 60) {
            timestamp = `${Math.floor(diffMinutes / 60)} hours ago`;
          } else if (diffMinutes > 0) {
            timestamp = `${diffMinutes} minutes ago`;
          }

          return {
            id: a.id,
            title: a.title,
            description: a.description,
            severity,
            timestamp,
            status: a.isRead ? "resolved" : "active",
            category
          };
        });
        setAlerts(mappedAlerts);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const resolveAlert = async (id: string) => {
    try {
      const res = await fetch("/api/alerts/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: id })
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "resolved" } : a));
      }
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "all") return true;
    return alert.status === filter;
  });

  const getSeverityStyles = (severity: SecurityAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          icon: AlertOctagon,
          iconClass: "text-[#DC2626]",
          borderClass: "border-l-4 border-l-[#DC2626]",
          badgeClass: "bg-[#DC2626] text-white",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconClass: "text-[#EAB308]",
          borderClass: "border-l-4 border-l-[#EAB308]",
          badgeClass: "bg-[#EAB308] text-black",
        };
      default:
        return {
          icon: Info,
          iconClass: "text-[#4B5563]",
          borderClass: "border-l-4 border-l-[#4B5563]",
          badgeClass: "bg-[#F3F4F6] text-[#0A0A0A] border border-black",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Filter Headers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-black pb-4 gap-4">
        <h3 className="font-heading font-bold text-base tracking-tight uppercase flex items-center gap-3">
          <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
          &gt; ACTIVE INCIDENT FEED
        </h3>
        <div className="flex gap-0 border border-black">
          {(["all", "active", "resolved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              data-testid={`alert-filter-${tab}`}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest font-mono transition-all duration-100 border-r border-black last:border-r-0 ${
                filter === tab
                  ? "bg-black text-white"
                  : "bg-white text-[#4B5563] hover:bg-[#F3F4F6] hover:text-black"
              }`}
            >
              {tab} ({tab === "all" ? alerts.length : alerts.filter(a => a.status === tab).length})
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-[#4B5563] font-mono">
            <Activity className="w-6 h-6" />
            <div className="text-xs uppercase tracking-widest">Syncing threat data...</div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-black text-[#4B5563]">
            <div className="w-12 h-12 bg-[#DCFCE7] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-[#16A34A]" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0A0A0A]">&gt; SYSTEM SECURE</span>
            <span className="text-[10px] font-mono mt-2 text-[#4B5563]">No incidents reported under this filter.</span>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            const Icon = styles.icon;

            return (
              <div
                key={alert.id}
                data-testid={`alert-item-${alert.id}`}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 gap-4 ${styles.borderClass} ${
                  alert.status === "resolved" ? "opacity-60 hover:opacity-100" : ""
                }`}
              >
                <div className="flex items-start gap-4 w-full">
                  <div className={`mt-0.5 shrink-0 ${styles.iconClass}`}>
                    {alert.status === "resolved" ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-1.5 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#0A0A0A] font-mono tracking-wide uppercase">{alert.title}</span>
                      <span className={`text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 ${styles.badgeClass}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 bg-[#F3F4F6] border border-black text-[#4B5563]">
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#4B5563] leading-relaxed max-w-3xl pr-4 font-mono">{alert.description}</p>
                    <div className="text-[10px] text-[#4B5563] font-mono tracking-wider">{alert.timestamp}</div>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto flex justify-end mt-2 sm:mt-0">
                  {alert.status === "active" ? (
                    <Button
                      onClick={() => resolveAlert(alert.id)}
                      data-testid={`alert-mitigate-${alert.id}`}
                      className="h-8 px-4 bg-white border border-black hover:bg-[#16A34A] hover:text-white text-black text-xs font-bold font-mono uppercase tracking-widest transition-all duration-100 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    >
                      MITIGATE
                    </Button>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-[#16A34A] flex items-center gap-2 tracking-widest uppercase">
                      <CheckCircle2 className="w-4 h-4" /> RESOLVED
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
