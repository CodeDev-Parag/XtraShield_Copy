import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required.' },
        { status: 400 }
      );
    }

    let urlToCheck = targetUrl.trim();
    if (!/^https?:\/\//i.test(urlToCheck)) {
      urlToCheck = 'https://' + urlToCheck;
    }

    const customApiKey = req.headers.get('x-virustotal-api-key');
    const apiKey = customApiKey || process.env.VIRUSTOTAL_API_KEY || process.env.NEXT_PUBLIC_VIRUSTOTAL_API_KEY;

    if (!apiKey) {
      // Mock mode
      const urlLower = urlToCheck.toLowerCase();
      const isMalicious =
        urlLower.includes('phish') ||
        urlLower.includes('malware') ||
        urlLower.includes('scam') ||
        urlLower.includes('free-robux') ||
        urlLower.includes('support-verify') ||
        urlLower.includes('paypa1') ||
        urlLower.includes('secure-login-account') ||
        urlLower.includes('cryptogiveaway');

      const stats = isMalicious
        ? { malicious: 14, suspicious: 2, harmless: 60, undetected: 14 }
        : { malicious: 0, suspicious: 0, harmless: 78, undetected: 12 };

      const positives = stats.malicious + stats.suspicious;
      const total = Object.values(stats).reduce((a, b) => a + b, 0);

      return NextResponse.json({
        url: urlToCheck,
        safe: !isMalicious,
        stats,
        positives,
        total,
        scanDate: new Date().toISOString(),
        isMock: true,
        details: isMalicious
          ? `WARNING: This URL matches signatures of known phishing/malicious web resources and has been flagged by ${positives} security engines.`
          : 'Safe link. No malicious indicators or phishing patterns found by major web crawlers.'
      });
    }

    // Real VirusTotal API (v3)
    // VirusTotal requires URL identifiers to be base64 without padding (=)
    const base64Url = Buffer.from(urlToCheck).toString('base64').replace(/=/g, '');
    const vtUrl = `https://www.virustotal.com/api/v3/urls/${base64Url}`;

    const response = await fetch(vtUrl, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey,
        'User-Agent': 'ExtraShield-Security-App'
      }
    });

    if (response.status === 404) {
      // Clean fallback if never scanned
      return NextResponse.json({
        url: urlToCheck,
        safe: true,
        stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 1 },
        positives: 0,
        total: 1,
        scanDate: new Date().toISOString(),
        isMock: false,
        details: 'This URL has not been indexed in the VirusTotal database yet. No immediate threat detected.'
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `VirusTotal error status ${response.status}` },
        { status: response.status }
      );
    }

    const resBody = await response.json();
    const stats = resBody.data?.attributes?.last_analysis_stats || {};
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const positives = malicious + suspicious;
    const total = Object.values(stats).reduce((a: any, b: any) => a + b, 0);
    const safe = positives === 0;

    return NextResponse.json({
      url: urlToCheck,
      safe,
      stats,
      positives,
      total,
      scanDate: resBody.data?.attributes?.last_analysis_date
        ? new Date(resBody.data.attributes.last_analysis_date * 1000).toISOString()
        : new Date().toISOString(),
      isMock: false,
      details: safe
        ? 'Clean URL. Threat scanning vendors scanned this link and found zero malicious matches.'
        : `Malicious threat detected. Flagged by ${malicious} vendors as malicious and ${suspicious} vendors as suspicious.`
    });
  } catch (error: any) {
    console.error('Phishing Checker API route error:', error);
    return NextResponse.json(
      { error: 'Failed to process request due to a server error.' },
      { status: 500 }
    );
  }
}
