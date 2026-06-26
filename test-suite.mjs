import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('\n===== Starting XtraShield API Test Suite =====\n');
  let passedCount = 0;
  let failedCount = 0;

  // Helper to log test outcomes
  const logResult = (name, success, info = '') => {
    if (success) {
      console.log(`[PASS] ${name} ${info ? `(${info})` : ''}`);
      passedCount++;
    } else {
      console.log(`[FAIL] ${name} ${info ? `- ${info}` : ''}`);
      failedCount++;
    }
  };

  // Test 1: Password Breach Checker (k-anonymity API Proxy)
  try {
    // 21BD1 is the prefix of 'P@ssw0rd' SHA-1 hash (which is 21BD12DC183F740EE76F27B78EB39C8AD972A757)
    const res = await axios.get(`${BASE_URL}/api/breach/password?hashPrefix=21BD1`);
    const isPwned = res.data.includes('2DC183F740EE76F27B78EB39C8AD972A757');
    logResult('Password Breach Checker API Proxy', res.status === 200 && isPwned, `Status: ${res.status}, Hash found: ${isPwned}`);
  } catch (err) {
    logResult('Password Breach Checker API Proxy', false, err.message);
  }

  // Test 2: SSL Domain Inspector (tls.connect validation)
  try {
    const res = await axios.get(`${BASE_URL}/api/ssl/check?domain=google.com`);
    logResult(
      'SSL Certificate Inspector API',
      res.status === 200 && res.data.authorized === true,
      `Issuer: ${res.data.issuer?.O || 'unknown'}, Expires: ${res.data.validTo}`
    );
  } catch (err) {
    logResult('SSL Certificate Inspector API', false, err.message);
  }

  // Test 3: Network IP Reputation Check
  try {
    const res = await axios.get(`${BASE_URL}/api/network/ip-check`);
    logResult(
      'Network IP Check API',
      res.status === 200 && res.data.ip !== undefined,
      `IP: ${res.data.ip}, Country: ${res.data.country_name || 'N/A'}, VPN: ${res.data.vpn}`
    );
  } catch (err) {
    logResult('Network IP Check API', false, err.message);
  }

  // Test 4: Phishing URL Scan Check
  try {
    const res = await axios.get(`${BASE_URL}/api/phishing/check?url=https://github.com`);
    logResult(
      'Phishing URL Scan API',
      res.status === 200 && res.data.safe !== undefined,
      `Safe: ${res.data.safe}, Details: ${res.data.details || 'harmless'}`
    );
  } catch (err) {
    logResult('Phishing URL Scan API', false, err.message);
  }

  // Test 5: Scan Upload and Scoring API (using seeded API Key)
  try {
    const scanPayload = {
      platform: 'win32',
      osName: 'Windows 11 Home',
      osVersion: '10.0.22631',
      kernelVersion: '10.0.22631',
      hostname: 'test-development-box',
      cpu: 'Intel Core i7',
      totalMemory: 16000000000,
      networkInterfaces: [
        { name: 'Ethernet', address: '192.168.1.50', type: 'wired', internal: false }
      ],
      openPorts: [
        { port: 80, service: 'HTTP', state: 'OPEN', risk: 'medium' },
        { port: 23, service: 'Telnet', state: 'OPEN', risk: 'critical' }
      ],
      runningProcesses: [
        { pid: 1044, name: 'xmrig.exe', cpu: 98, memory: 12, path: 'C:\\Users\\Miner\\xmrig.exe', risk: 'high' }
      ],
      installedSoftware: [
        { name: 'Node.js', version: '22.19.0' }
      ],
      permissionIssues: [
        { path: 'C:\\Windows\\system32', issue: 'SUID equivalent settings found', severity: 'high' }
      ],
      agentVersion: '1.0.0'
    };

    const res = await axios.post(`${BASE_URL}/api/scan/upload`, scanPayload, {
      headers: {
        'Authorization': 'Bearer test-agent-key-123456',
        'Content-Type': 'application/json'
      }
    });

    logResult(
      'Scan Upload & Security Scoring API',
      res.status === 200 && res.data.overallScore !== undefined,
      `Status: ${res.status}, Uploaded Score: ${res.data.overallScore}/100`
    );
  } catch (err) {
    logResult('Scan Upload & Security Scoring API', false, err.response?.data?.error || err.message);
  }

  console.log('\n===== API Test Suite Complete =====');
  console.log(`Passed: ${passedCount} | Failed: ${failedCount}\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
