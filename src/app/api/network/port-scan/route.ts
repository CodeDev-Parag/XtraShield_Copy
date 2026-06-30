import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import dns from 'dns/promises';
import net from 'net';

type PortStatus = 'open' | 'closed' | 'filtered';

interface PortScanRequestBody {
  host?: unknown;
  ports?: unknown;
  timeoutMs?: unknown;
}

interface PortScanResult {
  port: number;
  service: string;
  status: PortStatus;
  latencyMs: number | null;
  error?: string;
}

interface OpenPortRecord {
  port: number;
  service: string;
  state: 'open';
  risk: string;
}

interface VulnerabilityRecord {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cvss: number;
  recommendation: string;
}

const DEFAULT_PORTS = [21, 22, 23, 25, 80, 110, 443, 1433, 3306, 3389, 8080];
const MAX_PORTS_PER_SCAN = 32;

/**
 * POST /api/network/port-scan
 * Performs a bounded TCP port scan on a user-provided public host.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as PortScanRequestBody;
    let targetHost = typeof body.host === 'string' ? body.host.trim() : '';

    if (!targetHost) {
      const forwarded = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      targetHost = forwarded?.split(',')[0]?.trim() || realIp?.trim() || '';
    }

    if (!targetHost) {
      return NextResponse.json(
        { error: 'Unable to determine target host for port scan' },
        { status: 400 }
      );
    }

    const host = cleanHost(targetHost);
    if (!host) {
      return NextResponse.json({ error: 'Invalid target host' }, { status: 400 });
    }

    const blockedReason = await getBlockedTargetReason(host);
    if (blockedReason) {
      return NextResponse.json(
        { error: `Target blocked: ${blockedReason}` },
        { status: 400 }
      );
    }

    const requestedPorts = Array.isArray(body.ports) && body.ports.length > 0
      ? body.ports
      : DEFAULT_PORTS;
    const validPorts = requestedPorts
      .map((port: unknown) => Number(port))
      .filter((port: number) => Number.isInteger(port) && port >= 1 && port <= 65535)
      .slice(0, MAX_PORTS_PER_SCAN);

    if (validPorts.length === 0) {
      return NextResponse.json(
        { error: 'No valid ports specified' },
        { status: 400 }
      );
    }

    const timeoutMs = clampTimeout(body.timeoutMs);
    const results: PortScanResult[] = [];
    const openPorts: OpenPortRecord[] = [];
    const deadline = Date.now() + 8000;
    const maxConcurrent = 5;

    for (let i = 0; i < validPorts.length && Date.now() < deadline; i += maxConcurrent) {
      const batch = validPorts.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map((port: number) => probePort(host, port, timeoutMs))
      );
      results.push(...batchResults);

      for (const result of batchResults) {
        if (result.status === 'open') {
          openPorts.push({
            port: result.port,
            service: result.service,
            state: 'open',
            risk: getRiskLevel(result.port),
          });
        }
      }
    }

    const vulnerabilities = buildVulnerabilities(openPorts);
    const score = openPorts.length === 0 ? 100 : Math.max(0, 100 - openPorts.length * 10);

    try {
      await db.systemScan.create({
        data: {
          userId: session.user.id,
          status: 'COMPLETED',
          platform: 'unknown',
          osName: null,
          osVersion: null,
          kernelVersion: null,
          hostname: host,
          overallScore: score,
          networkScore: score,
          processScore: null,
          softwareScore: null,
          permissionScore: null,
          openPorts: openPorts as unknown as Prisma.InputJsonValue,
          runningProcesses: [] as Prisma.InputJsonValue,
          installedSoftware: [] as Prisma.InputJsonValue,
          permissionIssues: [] as Prisma.InputJsonValue,
          networkInterfaces: [] as Prisma.InputJsonValue,
          vulnerabilities: vulnerabilities as unknown as Prisma.InputJsonValue,
          agentVersion: null,
        },
      });
    } catch (dbError) {
      console.error('Failed to persist network scan results:', dbError);
    }

    const openCount = openPorts.length;
    const filteredCount = results.filter((result) => result.status === 'filtered').length;
    const closedCount = results.filter((result) => result.status === 'closed').length;

    return NextResponse.json({
      results,
      summary: {
        host,
        totalPorts: validPorts.length,
        scannedPorts: results.length,
        openPorts: openCount,
        closedPorts: closedCount,
        filteredPorts: filteredCount,
      },
    });
  } catch (error) {
    console.error('Port scan API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function cleanHost(input: string) {
  try {
    const withProtocol = /^https?:\/\//i.test(input) ? input : `http://${input}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.toLowerCase();
  } catch {
    return input
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .split(':')[0]
      .trim()
      .toLowerCase();
  }
}

async function getBlockedTargetReason(host: string): Promise<string | null> {
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return 'localhost targets are not allowed from the server scanner';
  }

  if (net.isIP(host)) {
    return getBlockedIpReason(host);
  }

  try {
    const addresses = await dns.lookup(host, { all: true, verbatim: true });
    for (const address of addresses) {
      const reason = getBlockedIpReason(address.address);
      if (reason) return reason;
    }
  } catch {
    return null;
  }

  return null;
}

function getBlockedIpReason(ip: string): string | null {
  if (ip === '127.0.0.1' || ip === '::1') return 'loopback IPs are not allowed';
  if (ip === '169.254.169.254') return 'cloud metadata endpoints are not allowed';

  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return 'private IP ranges are not allowed';
    if (a === 172 && b >= 16 && b <= 31) return 'private IP ranges are not allowed';
    if (a === 192 && b === 168) return 'private IP ranges are not allowed';
    if (a === 169 && b === 254) return 'link-local IP ranges are not allowed';
    if (a === 0 || a >= 224) return 'reserved IP ranges are not allowed';
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return 'private IPv6 ranges are not allowed';
    }
    if (normalized.startsWith('fe80')) {
      return 'link-local IPv6 ranges are not allowed';
    }
  }

  return null;
}

function clampTimeout(input: unknown) {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 1500;
  return Math.max(250, Math.min(5000, Math.floor(parsed)));
}

function probePort(host: string, port: number, timeoutMs: number): Promise<PortScanResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (result: Omit<PortScanResult, 'port' | 'service' | 'latencyMs'>) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        port,
        service: getServiceName(port),
        latencyMs: Date.now() - startTime,
        ...result,
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish({ status: 'open' }));
    socket.once('timeout', () =>
      finish({ status: 'filtered', error: `Connection timeout after ${timeoutMs}ms` })
    );
    socket.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ECONNREFUSED') {
        finish({ status: 'closed', error: 'Connection refused' });
      } else {
        finish({ status: 'filtered', error: error.message });
      }
    });
    socket.connect({ host, port });
  });
}

function buildVulnerabilities(openPorts: OpenPortRecord[]): VulnerabilityRecord[] {
  return openPorts
    .filter((port) => port.risk === 'high' || port.risk === 'medium')
    .map((port) => ({
      id: `VULN-PORT-${port.port}`,
      title: `${port.risk === 'high' ? 'High-risk' : 'Exposed'} service open (${port.service})`,
      severity: port.risk === 'high' ? 'HIGH' : 'MEDIUM',
      cvss: port.risk === 'high' ? 7.5 : 5.3,
      recommendation: `Port ${port.port} (${port.service}) is reachable. Restrict access with firewall rules or disable the service if unused.`,
    }));
}

function getServiceName(port: number): string {
  const services: Record<number, string> = {
    20: 'FTP-DATA',
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    465: 'SMTPS',
    587: 'SMTP Submission',
    993: 'IMAPS',
    995: 'POP3S',
    1433: 'MSSQL',
    3306: 'MySQL',
    3389: 'RDP',
    5900: 'VNC',
    8080: 'HTTP-Alt',
    8443: 'HTTPS-Alt',
  };
  return services[port] || 'unknown';
}

function getRiskLevel(port: number): string {
  const highPort = new Set([21, 22, 23, 25, 1433, 3306, 3389, 5900]);
  const mediumPort = new Set([
    53, 110, 143, 161, 162, 389, 636, 873, 902, 993, 995, 1080, 1085, 1090,
    1099, 1521, 2049, 2100, 2181, 2375, 2376, 2379, 2380, 5000, 5001, 5432,
    5984, 6379, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089,
    8090,
  ]);

  if (highPort.has(port)) return 'high';
  if (mediumPort.has(port)) return 'medium';
  return 'low';
}
