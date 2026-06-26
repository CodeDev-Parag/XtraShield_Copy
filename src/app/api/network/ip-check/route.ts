import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    let clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

    if (clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    // Heuristics for private/local IP fallback
    const isLocal =
      !clientIp ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp.startsWith('10.') ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('172.16.') ||
      clientIp.startsWith('fe80');

    // Use a representative public IP for local testing
    if (isLocal) {
      clientIp = '185.190.140.1'; // Mullvad VPN IP (Sweden/US endpoints)
    }

    // Call free public geo IP api
    const apiRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ExtraShield-Security-App'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!apiRes.ok) {
      return NextResponse.json({
        ip: clientIp,
        city: 'Stockholm',
        region: 'Stockholm County',
        country_name: 'Sweden',
        org: 'Mullvad VPN',
        vpn: true,
        reputation: 'suspicious',
        blacklistCount: 1,
        latitude: 59.3293,
        longitude: 18.0686,
        isMock: true
      });
    }

    const data = await apiRes.json();

    if (data.error) {
      // Fallback on error response (e.g. rate limit)
      return NextResponse.json({
        ip: clientIp,
        city: 'Silicon Valley',
        region: 'California',
        country_name: 'United States',
        org: 'Cloudflare Inc.',
        vpn: true,
        reputation: 'safe',
        blacklistCount: 0,
        latitude: 37.7749,
        longitude: -122.4194,
        isMock: true
      });
    }

    // Check organization and ASN metadata for VPN indicators
    const orgLower = (data.org || '').toLowerCase();
    const isVpn =
      orgLower.includes('vpn') ||
      orgLower.includes('mullvad') ||
      orgLower.includes('nordvpn') ||
      orgLower.includes('expressvpn') ||
      orgLower.includes('tor exit') ||
      orgLower.includes('hosting') ||
      orgLower.includes('digitalocean') ||
      orgLower.includes('cloudflare') ||
      orgLower.includes('amazon') ||
      orgLower.includes('google') ||
      orgLower.includes('linode') ||
      orgLower.includes('ovh');

    // Determine reputation: VPN/hosting IPs are sometimes flagged as 'suspicious' or 'danger' on forums
    let reputation: 'safe' | 'warning' | 'danger' = 'safe';
    let blacklistCount = 0;

    if (isVpn) {
      reputation = 'warning';
      blacklistCount = orgLower.includes('hosting') || orgLower.includes('tor') ? 2 : 1;
    }

    return NextResponse.json({
      ip: data.ip || clientIp,
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country_name: data.country_name || 'Unknown',
      org: data.org || 'Unknown Provider',
      vpn: isVpn,
      reputation,
      blacklistCount,
      latitude: data.latitude,
      longitude: data.longitude,
      isMock: false
    });
  } catch (error: any) {
    console.error('IP check API route error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve public IP information.' },
      { status: 500 }
    );
  }
}
