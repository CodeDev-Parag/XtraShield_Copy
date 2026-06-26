import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate API Key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing API Key' },
        { status: 401, headers: corsHeaders }
      );
    }
    const apiKey = authHeader.substring(7);
    const keyRecord = await db.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true }
    });
    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API Key' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Update API Key last used
    await db.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() }
    });

    const body = await request.json();

    // 2. Parse and Validate Data
    const {
      platform,
      osName,
      osVersion,
      kernelVersion,
      hostname,
      cpu,
      totalMemory,
      networkInterfaces,
      openPorts = [],
      runningProcesses = [],
      installedSoftware = [],
      permissionIssues = [],
      agentVersion
    } = body;

    // 3. Scoring Algorithm
    // Open Ports (max deduction: 40)
    const criticalPorts = openPorts.filter((p: any) => p.risk === 'critical').length;
    const mediumPorts = openPorts.filter((p: any) => p.risk === 'medium').length;
    const lowPorts = openPorts.filter((p: any) => p.risk === 'low').length;
    const portDeduction = Math.min(40, criticalPorts * 15 + mediumPorts * 5 + lowPorts * 1);
    const networkScore = Math.max(0, 100 - portDeduction * 2.5);

    // Permission Issues (max deduction: 25)
    const highPerms = permissionIssues.filter((p: any) => p.severity === 'high').length;
    const medPerms = permissionIssues.filter((p: any) => p.severity === 'medium').length;
    const permDeduction = Math.min(25, highPerms * 10 + medPerms * 5);
    const permissionScore = Math.max(0, 100 - permDeduction * 4);

    // Suspicious Processes (max deduction: 20)
    const highProcs = runningProcesses.filter((p: any) => p.risk === 'high').length;
    const medProcs = runningProcesses.filter((p: any) => p.risk === 'medium').length;
    const procDeduction = Math.min(20, highProcs * 15 + medProcs * 5);
    const processScore = Math.max(0, 100 - procDeduction * 5);

    // Kernel Version (max deduction: 10)
    const kernelDeduction = !kernelVersion ? 5 : 0;
    const softwareScore = 100;

    const overallScore = Math.max(
      0,
      Math.min(100, 100 - (portDeduction + permDeduction + procDeduction + kernelDeduction))
    );

    // 4. Generate Vulnerabilities (recommendations list)
    const vulnerabilities: any[] = [];
    
    // Add port vulnerabilities
    openPorts.forEach((p: any) => {
      if (p.risk === 'critical') {
        vulnerabilities.push({
          id: `VULN-PORT-${p.port}`,
          title: `Critical Vulnerable Service Open (${p.service})`,
          severity: 'CRITICAL',
          cvss: 9.8,
          recommendation: `Port ${p.port} (${p.service}) is exposed. Stop this service or block external access via firewall.`
        });
      } else if (p.risk === 'medium') {
        vulnerabilities.push({
          id: `VULN-PORT-${p.port}`,
          title: `Exposed Service (${p.service})`,
          severity: 'MEDIUM',
          cvss: 5.3,
          recommendation: `Port ${p.port} (${p.service}) is open. Ensure strong authentication and restrict IP access.`
        });
      }
    });

    // Add process vulnerabilities
    runningProcesses.forEach((p: any) => {
      if (p.risk === 'high') {
        vulnerabilities.push({
          id: `VULN-PROC-${p.pid}`,
          title: `Malware-linked Process Running (${p.name})`,
          severity: 'CRITICAL',
          cvss: 10.0,
          recommendation: `Process '${p.name}' (PID: ${p.pid}) matches known security threats (e.g. miner/tool). Terminate this process immediately.`
        });
      } else if (p.risk === 'medium') {
        vulnerabilities.push({
          id: `VULN-PROC-${p.pid}`,
          title: `Suspicious Networking Tool Running (${p.name})`,
          severity: 'HIGH',
          cvss: 7.2,
          recommendation: `Tool '${p.name}' (PID: ${p.pid}) is often used for reverse-tunnels or proxying. Ensure this is authorized.`
        });
      }
    });

    // Add permission vulnerabilities
    permissionIssues.forEach((p: any, idx: number) => {
      if (p.severity === 'high') {
        vulnerabilities.push({
          id: `VULN-PERM-HIGH-${idx}`,
          title: `World-Writable Configuration File`,
          severity: 'HIGH',
          cvss: 7.8,
          recommendation: `File '${p.path}' is world-writable. Correct permissions using command: chmod 644 ${p.path}`
        });
      } else if (p.severity === 'medium') {
        vulnerabilities.push({
          id: `VULN-PERM-MED-${idx}`,
          title: `SUID binary — Executed with Elevated Privileges`,
          severity: 'MEDIUM',
          cvss: 4.4,
          recommendation: `File '${p.path}' has SUID permission set. Audit this binary to ensure privilege escalation is not possible.`
        });
      }
    });

    // 5. Save SystemScan
    const scan = await db.systemScan.create({
      data: {
        userId: keyRecord.userId,
        status: 'COMPLETED',
        platform,
        osName,
        osVersion,
        kernelVersion,
        hostname,
        overallScore,
        networkScore,
        processScore,
        softwareScore,
        permissionScore,
        openPorts: JSON.stringify(openPorts),
        runningProcesses: JSON.stringify(runningProcesses),
        installedSoftware: JSON.stringify(installedSoftware),
        permissionIssues: JSON.stringify(permissionIssues),
        networkInterfaces: JSON.stringify(networkInterfaces),
        vulnerabilities: JSON.stringify(vulnerabilities),
        agentVersion,
        scanDuration: 1000 // mock duration
      }
    });

    // 6. Generate Alerts
    const alertsToCreate: any[] = [];

    // Critical/Medium open ports
    openPorts.forEach((p: any) => {
      if (p.risk === 'critical') {
        alertsToCreate.push({
          userId: keyRecord.userId,
          type: 'SYSTEM_VULNERABILITY',
          severity: 'CRITICAL',
          title: `Critical Port Open: ${p.port} (${p.service})`,
          description: `Vulnerable service ${p.service} is listening publicly on port ${p.port}.`,
          metadata: JSON.stringify(p)
        });
      } else if (p.risk === 'medium') {
        alertsToCreate.push({
          userId: keyRecord.userId,
          type: 'SYSTEM_VULNERABILITY',
          severity: 'MEDIUM',
          title: `Risky Port Open: ${p.port} (${p.service})`,
          description: `Potential exposure via open port ${p.port} (${p.service}).`,
          metadata: JSON.stringify(p)
        });
      }
    });

    // High risk processes
    runningProcesses.forEach((p: any) => {
      if (p.risk === 'high') {
        alertsToCreate.push({
          userId: keyRecord.userId,
          type: 'SUSPICIOUS_PROCESS',
          severity: 'CRITICAL',
          title: `Suspicious Process Detected: ${p.name}`,
          description: `Malware-related or suspicious process '${p.name}' is running.`,
          metadata: JSON.stringify(p)
        });
      } else if (p.risk === 'medium') {
        alertsToCreate.push({
          userId: keyRecord.userId,
          type: 'SUSPICIOUS_PROCESS',
          severity: 'HIGH',
          title: `Suspicious Tool Active: ${p.name}`,
          description: `Tunneling or network proxy process '${p.name}' is running.`,
          metadata: JSON.stringify(p)
        });
      }
    });

    // High risk permissions
    permissionIssues.forEach((p: any) => {
      if (p.severity === 'high') {
        alertsToCreate.push({
          userId: keyRecord.userId,
          type: 'SYSTEM_VULNERABILITY',
          severity: 'HIGH',
          title: `World-Writable Configuration: ${p.path}`,
          description: `Security config file ${p.path} is writable by any local user.`,
          metadata: JSON.stringify(p)
        });
      }
    });

    if (alertsToCreate.length > 0) {
      await db.alert.createMany({
        data: alertsToCreate
      });
    }

    return NextResponse.json(
      { 
        success: true, 
        scanId: scan.id, 
        overallScore, 
        alertsCreated: alertsToCreate.length 
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error uploading scan:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
