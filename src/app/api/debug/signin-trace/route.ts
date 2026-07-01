import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Trace next-auth internal handling of /api/auth/signin
 * This bypasses any URL prefix in the catch-all handler
 */
export async function GET() {
  const logs: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  const origWarn = console.warn;

  console.log = (...args: unknown[]) => {
    logs.push("[LOG] " + args.map((a) => (a instanceof Error ? `${a.name}:${a.message}` : String(a))).join(" "));
  };
  console.error = (...args: unknown[]) => {
    logs.push(
      "[ERROR] " +
        args
          .map((a) => {
            if (a instanceof Error) return `${a.name}: ${a.message}`;
            if (typeof a === "object") {
              try {
                return JSON.stringify(a, Object.getOwnPropertyNames(a));
              } catch {
                return String(a);
              }
            }
            return String(a);
          })
          .join(" ")
    );
  };
  console.warn = (...args: unknown[]) => {
    logs.push("[WARN] " + args.map(String).join(" "));
  };

  try {
    const { NextRequest } = await import("next/server");
    const authModule = await import("@/lib/auth");

    const testUrls = [
      "http://localhost:3000/api/auth/signin",
      "http://localhost:3000/api/auth/signin/google",
      "http://localhost:3000/api/auth/providers",
      "http://localhost:3000/api/auth/csrf",
    ];

    const results: unknown[] = [];
    for (const url of testUrls) {
      const req = new NextRequest(url, { method: "GET" });
      try {
        const response = await authModule.handlers.GET!(req);
        const body = await response.text();
        results.push({
          url,
          status: response.status,
          location: response.headers.get("location"),
          bodySnippet: body.substring(0, 200),
        });
      } catch (err) {
        results.push({
          url,
          error: (err as Error).message,
        });
      }
    }

    return NextResponse.json({
      results,
      logs,
    });
  } catch (err) {
    return NextResponse.json({
      error: (err as Error).message,
      stack: (err as Error).stack?.substring(0, 1000),
      logs,
    });
  } finally {
    console.log = origLog;
    console.error = origErr;
    console.warn = origWarn;
  }
}
