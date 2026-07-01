import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Properly simulate the full client-side signIn flow.
 * 1. GET csrf token
 * 2. POST /api/auth/signin/google with csrfToken + callbackUrl
 */
export async function GET() {
  const logs: string[] = [];
  const origLog = console.log;
  const origErr = console.error;

  console.log = (...args: unknown[]) => {
    logs.push("[LOG] " + args.map(String).join(" "));
  };
  console.error = (...args: unknown[]) => {
    logs.push(
      "[ERR] " +
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

  try {
    const { NextRequest } = await import("next/server");
    const authModule = await import("@/lib/auth");

    // Step 1: get CSRF token
    const csrfReq = new NextRequest("https://xtrashield-seven.vercel.app/api/auth/csrf");
    const csrfResp = await authModule.handlers.GET!(csrfReq);
    const csrfBody = await csrfResp.text();
    const csrfJson = JSON.parse(csrfBody);
    const csrfToken = csrfJson.csrfToken;

    // Step 2: simulate browser sending POST to /api/auth/signin/google
    const postReq = new NextRequest(
      "https://xtrashield-seven.vercel.app/api/auth/signin/google?callbackUrl=%2Fdashboard",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
          csrfToken,
          callbackUrl: "/dashboard",
        }).toString(),
      }
    );

    const postResp = await authModule.handlers.POST!(postReq);
    const postText = await postResp.text();
    const location = postResp.headers.get("location");

    return NextResponse.json({
      step1_csrf: { status: csrfResp.status, token: csrfToken.substring(0, 20) + "..." },
      step2_signin: {
        status: postResp.status,
        location,
        body: postText.substring(0, 500),
        set_cookie: postResp.headers.get("set-cookie")?.substring(0, 200),
      },
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
  }
}
