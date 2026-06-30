import { NextRequest } from "next/server";

export interface BreachResult {
  name: string;
  domain: string;
  breachDate: string;
  description: string;
  dataClasses: string[];
}

/**
 * Scan a single email address against the breach intelligence API.
 *
 * - Uses HIBP_API_KEY env var if set (real mode), otherwise falls back to a
 *   deterministic mock dataset that includes well-known historical breaches.
 * - Email is lowercased and trimmed before lookup.
 */
export async function scanEmailBreaches(email: string, customApiKey?: string): Promise<{
  breaches: BreachResult[];
  isMock: boolean;
}> {
  const normalised = email.toLowerCase().trim();
  const apiKey = customApiKey || process.env.HIBP_API_KEY;

  if (!apiKey) {
    return { breaches: mockBreaches(normalised), isMock: true };
  }

  const response = await fetch(
    `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(
      normalised
    )}?truncateResponse=false`,
    {
      method: "GET",
      headers: {
        "hibp-api-key": apiKey,
        "User-Agent": "ExtraShield-Security-App",
      },
      // No Next.js cache — results are user-specific.
    }
  );

  if (response.status === 404) {
    return { breaches: [], isMock: false };
  }

  if (!response.ok) {
    // Don't crash on upstream errors — degrade to empty list so the UI still works.
    console.error(`Breach API error ${response.status} for ${normalised}`);
    return { breaches: [], isMock: false };
  }

  const data: any[] = await response.json();
  const mapped = data.map((b) => ({
    name: b.Name,
    domain: b.Domain,
    breachDate: b.BreachDate,
    description: b.Description,
    dataClasses: b.DataClasses,
  }));
  return { breaches: mapped, isMock: false };
}

/**
 * Deterministic mock so the same email always produces the same demo data.
 * `admin@xtrashield.io` and any email containing "clean"/"safe"/"secure" always
 * returns no breaches — useful for screenshots and demos.
 */
function mockBreaches(email: string): BreachResult[] {
  if (
    email.includes("clean") ||
    email.includes("safe") ||
    email.includes("secure") ||
    email === "admin@xtrashield.io"
  ) {
    return [];
  }

  const out: BreachResult[] = [];
  const code = email.charCodeAt(0) + email.length;

  if (code % 2 === 0) {
    out.push({
      name: "Adobe",
      domain: "adobe.com",
      breachDate: "2013-10-04",
      description:
        "In October 2013, Adobe suffered a massive security breach which compromised the email addresses, password hints, and password hashes of over 153 million users.",
      dataClasses: ["Email addresses", "Password hashes", "Usernames", "Password hints"],
    });
  }

  if (code % 3 === 0 || out.length === 0) {
    out.push({
      name: "Canva",
      domain: "canva.com",
      breachDate: "2019-05-24",
      description:
        "In May 2019, Canva had a data breach that exposed the personal information of 137 million users, including real names, usernames, email addresses, and passwords stored as bcrypt hashes.",
      dataClasses: ["Email addresses", "Passwords", "Names", "Usernames"],
    });
  }

  if (code % 5 === 0) {
    out.push({
      name: "LinkedIn",
      domain: "linkedin.com",
      breachDate: "2016-05-17",
      description:
        "In May 2016, LinkedIn experienced a mega-breach where over 164 million accounts were exposed. The leaked database contained email addresses and SHA-1 hashed passwords.",
      dataClasses: ["Email addresses", "Password hashes"],
    });
  }

  return out;
}