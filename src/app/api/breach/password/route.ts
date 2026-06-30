import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hashPrefix = searchParams.get('hashPrefix');

    if (!hashPrefix || hashPrefix.length !== 5) {
      return NextResponse.json(
        { error: 'Prefix must be exactly 5 characters of a SHA-1 hash.' },
        { status: 400 }
      );
    }

    // k-anonymity query
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix.toUpperCase()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ExtraShield-Security-App'
      },
      next: { revalidate: 3600 } // Cache range responses for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to query breach password API' },
        { status: response.status }
      );
    }

    const textData = await response.text();

    return new NextResponse(textData, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    });
  } catch (error: any) {
    console.error('Password breach API route error:', error);
    return NextResponse.json(
      { error: 'Failed to process request due to a server error.' },
      { status: 500 }
    );
  }
}
