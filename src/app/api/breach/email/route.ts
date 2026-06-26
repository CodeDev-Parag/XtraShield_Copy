import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required.' },
        { status: 400 }
      );
    }

    const customApiKey = req.headers.get('x-hibp-api-key');
    const apiKey = customApiKey || process.env.HIBP_API_KEY || process.env.NEXT_PUBLIC_HIBP_API_KEY;

    if (!apiKey) {
      // Mock mode
      const lowerEmail = email.toLowerCase();

      // Return clean/no-breaches state if email contains clear safe-words
      if (
        lowerEmail.includes('clean') ||
        lowerEmail.includes('safe') ||
        lowerEmail.includes('secure') ||
        lowerEmail === 'admin@xtrashield.io'
      ) {
        return NextResponse.json({ breaches: [], isMock: true });
      }

      // Generate realistic mock breaches
      const breaches = [];
      const emailCode = lowerEmail.charCodeAt(0) + lowerEmail.length;

      if (emailCode % 2 === 0) {
        breaches.push({
          name: 'Adobe',
          domain: 'adobe.com',
          breachDate: '2013-10-04',
          description: 'In October 2013, Adobe suffered a massive security breach which compromised the email addresses, passwords hints, and password hashes of over 153 million users.',
          dataClasses: ['Email addresses', 'Password hashes', 'Usernames', 'Password hints']
        });
      }

      if (emailCode % 3 === 0 || breaches.length === 0) {
        breaches.push({
          name: 'Canva',
          domain: 'canva.com',
          breachDate: '2019-05-24',
          description: 'In May 2019, Canva had a data breach that exposed the personal information of 137 million users, including real names, usernames, email addresses, and passwords stored as bcrypt hashes.',
          dataClasses: ['Email addresses', 'Passwords', 'Names', 'Usernames']
        });
      }

      if (emailCode % 5 === 0) {
        breaches.push({
          name: 'LinkedIn',
          domain: 'linkedin.com',
          breachDate: '2016-05-17',
          description: 'In May 2016, LinkedIn experienced a mega-breach where over 164 million accounts were exposed. The leaked database contained email addresses and SHA-1 hashed passwords.',
          dataClasses: ['Email addresses', 'Password hashes']
        });
      }

      return NextResponse.json({ breaches, isMock: true });
    }

    // Real API mode
    const response = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        method: 'GET',
        headers: {
          'hibp-api-key': apiKey,
          'User-Agent': 'ExtraShield-Security-App'
        }
      }
    );

    if (response.status === 404) {
      return NextResponse.json({ breaches: [], isMock: false });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `HIBP API error. Status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const mappedBreaches = data.map((b: any) => ({
      name: b.Name,
      domain: b.Domain,
      breachDate: b.BreachDate,
      description: b.Description,
      dataClasses: b.DataClasses
    }));

    return NextResponse.json({ breaches: mappedBreaches, isMock: false });
  } catch (error: any) {
    console.error('Email Checker API route error:', error);
    return NextResponse.json(
      { error: 'Failed to process request due to a server error.' },
      { status: 500 }
    );
  }
}
