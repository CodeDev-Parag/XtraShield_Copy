import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

/**
 * POST /api/proxy/phishing/check
 *
 * Proxied URL threat check with rate limiting.
 * Server's API key is used — users don't need their own.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetUrl = typeof body.url === "string" ? body.url.trim() : "";

    if (!targetUrl) {
      return NextResponse.json(
        { error: "URL parameter is required." },
        { status: 400 }
      );
    }

    // Rate limit check
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    const plan = user?.plan || "FREE";
    const rateLimit = checkRateLimit(session.user.id, "phishing/check", plan);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Upgrade your plan for higher limits.",
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    let urlToCheck = targetUrl;
    if (!/^https?:\/\//i.test(urlToCheck)) {
      urlToCheck = "https://" + urlToCheck;
    }

    const apiKey = process.env.VIRUSTOTAL_API_KEY;

    if (!apiKey) {
      // Mock mode
      const urlLower = urlToCheck.toLowerCase();
      const isMalicious =
        urlLower.includes("phish") ||
        urlLower.includes("malware") ||
        urlLower.includes("scam") ||
        urlLower.includes("free-robux") ||
        urlLower.includes("paypa1");

      const stats = isMalicious
        ? { malicious: 14, suspicious: 2, harmless: 60, undetected: 14 }
        : { malicious: 0, suspicious: 0, harmless: 78, undetected: 12 };

      const positives = stats.malicious + stats.suspicious;
      const total = Object.values(stats).reduce((a, b) => a + b, 0);

      return NextResponse.json(
        {
          url: urlToCheck,
          safe: !isMalicious,
          stats,
          positives,
          total,
          scanDate: new Date().toISOString(),
          isMock: true,
          details: isMalicious
            ? `WARNING: Flagged by ${positives} security engines.`
            : "Safe link. No malicious indicators found.",
        },
        { headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Real VirusTotal API
    const base64Url = Buffer.from(urlToCheck).toString("base64").replace(/=/g, "");
    const vtUrl = `https://www.virustotal.com/api/v3/urls/${base64Url}`;

    const response = await fetch(vtUrl, {
      method: "GET",
      headers: {
        "x-apikey": apiKey,
        "User-Agent": "XtraShield-Security-App",
      },
    });

    if (response.status === 404) {
      return NextResponse.json(
        {
          url: urlToCheck,
          safe: true,
          stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 1 },
          positives: 0,
          total: 1,
          scanDate: new Date().toISOString(),
          isMock: false,
          details: "URL not indexed in threat database. No immediate threat detected.",
        },
        { headers: getRateLimitHeaders(rateLimit) }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Threat lookup error: ${response.status}` },
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

    return NextResponse.json(
      {
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
          ? "Clean URL. Zero malicious matches."
          : `Flagged by ${malicious} malicious + ${suspicious} suspicious vendors.`,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: any) {
    console.error("Proxy phishing check error:", error);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
