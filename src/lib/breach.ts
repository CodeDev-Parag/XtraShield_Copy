export interface BreachResult {
  name: string;
  domain: string;
  breachDate: string;
  description: string;
  dataClasses: string[];
}

export interface EmailBreachResult {
  breaches: BreachResult[];
  isMock: boolean;
  configured: boolean;
  message?: string;
}

/**
 * Scan a single email address against the breach intelligence API.
 *
 * - Uses HIBP_API_KEY env var (real mode) — see https://haveibeenpwned.com/API/v3
 *   Note: HIBP v3 requires a paid subscription (min ~$3.50/mo). Without a key
 *   configured, this returns an empty result with configured=false so the UI
 *   surfaces a clear admin notice instead of fake data.
 * - Email is lowercased and trimmed before lookup.
 */
export async function scanEmailBreaches(
  email: string,
  customApiKey?: string
): Promise<EmailBreachResult> {
  const normalised = email.toLowerCase().trim();
  const apiKey = customApiKey || process.env.HIBP_API_KEY;

  if (!apiKey) {
    return {
      breaches: [],
      isMock: false,
      configured: false,
      message:
        "Email breach lookup is not configured on this server. Add HIBP_API_KEY to enable real results.",
    };
  }

  const response = await fetch(
    `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(
      normalised
    )}?truncateResponse=false`,
    {
      method: "GET",
      headers: {
        "hibp-api-key": apiKey,
        "User-Agent": "XtraShield-Security-App",
      },
    }
  );

  if (response.status === 404) {
    return { breaches: [], isMock: false, configured: true };
  }

  if (!response.ok) {
    console.error(`Breach API error ${response.status} for ${normalised}`);
    return {
      breaches: [],
      isMock: false,
      configured: true,
      message: `Upstream breach lookup returned ${response.status}.`,
    };
  }

  const data: any[] = await response.json();
  const mapped = data.map((b) => ({
    name: b.Name,
    domain: b.Domain,
    breachDate: b.BreachDate,
    description: b.Description,
    dataClasses: b.DataClasses,
  }));
  return { breaches: mapped, isMock: false, configured: true };
}
