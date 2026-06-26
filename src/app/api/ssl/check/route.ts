import { NextRequest, NextResponse } from 'next/server';
import tls from 'tls';

function getCertificateInfo(domain: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Extract clean hostname (strip protocols, paths, ports)
    const hostname = domain
      .trim()
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .split(':')[0];

    if (!hostname) {
      reject(new Error('Invalid hostname provided.'));
      return;
    }

    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname, // Required for SNI resolution
        rejectUnauthorized: false // We still want to inspect expired or self-signed certs
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        const authorized = socket.authorized;
        const authError = socket.authorizationError;
        socket.end();

        if (!cert || Object.keys(cert).length === 0) {
          reject(new Error('Host resolved, but no SSL/TLS certificate was returned.'));
          return;
        }

        resolve({
          authorized,
          authError: authError ? authError.toString() : null,
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber,
          bits: cert.bits,
          subjectAltName: cert.subjectaltname
        });
      }
    );

    socket.on('error', (err) => {
      reject(new Error(`Network error connection failed: ${err.message}`));
    });

    socket.setTimeout(6000, () => {
      socket.destroy();
      reject(new Error('Connection timed out. Port 443 might be closed or blocked.'));
    });
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required.' },
        { status: 400 }
      );
    }

    const certInfo = await getCertificateInfo(domain);
    return NextResponse.json(certInfo);
  } catch (error: any) {
    console.error('SSL Checker API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to inspect SSL/TLS certificate.' },
      { status: 500 }
    );
  }
}
