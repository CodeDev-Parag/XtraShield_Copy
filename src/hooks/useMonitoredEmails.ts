"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface MonitoredEmailDTO {
  id: string;
  email: string;
  isVerified: boolean;
  alertOn: boolean;
  breachCount: number;
  breaches: any[];
  lastChecked: string | null;
  addedAt: string;
}

const ENDPOINT = "/api/monitored-emails";

async function listMonitoredEmails(): Promise<MonitoredEmailDTO[]> {
  const res = await fetch(ENDPOINT, { credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error(`Failed to load watch list (${res.status})`);
  }
  const data = await res.json();
  return (data.emails ?? []) as MonitoredEmailDTO[];
}

async function addMonitoredEmail(email: string): Promise<MonitoredEmailDTO> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to add email (${res.status})`);
  }
  const data = await res.json();
  return data.email as MonitoredEmailDTO;
}

async function patchMonitoredEmail(args: {
  id: string;
  alertOn?: boolean;
  isVerified?: boolean;
}): Promise<MonitoredEmailDTO> {
  const res = await fetch(`${ENDPOINT}/${args.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ alertOn: args.alertOn, isVerified: args.isVerified }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to update email (${res.status})`);
  }
  const data = await res.json();
  return data.email as MonitoredEmailDTO;
}

async function deleteMonitoredEmail(id: string): Promise<void> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to remove email (${res.status})`);
  }
}

async function rescanMonitoredEmail(id: string): Promise<MonitoredEmailDTO> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method: "PUT",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to re-scan email (${res.status})`);
  }
  const data = await res.json();
  return data.email as MonitoredEmailDTO;
}

export function useMonitoredEmails() {
  return useQuery({
    queryKey: ["monitored-emails"],
    queryFn: listMonitoredEmails,
  });
}

export function useAddMonitoredEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addMonitoredEmail,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitored-emails"] }),
  });
}

export function usePatchMonitoredEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchMonitoredEmail,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitored-emails"] }),
  });
}

export function useDeleteMonitoredEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMonitoredEmail,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitored-emails"] }),
  });
}

export function useRescanMonitoredEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rescanMonitoredEmail,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitored-emails"] }),
  });
}