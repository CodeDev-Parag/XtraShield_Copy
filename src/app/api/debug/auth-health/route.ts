import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET() {
  const results: Record<string, any> = {};

  try {
    // 1. Direct test of the full auth flow with error capture
    const authModule = await import("@/lib/auth");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      "https://xtrashield-seven.vercel.app/api/auth/signin/google",
      { method: "GET" }
    );

    const response = await authModule.handlers.GET!(req);
    const location = response?.headers?.get("location") ?? "none";

    results.signin = {
      status: response?.status,
      location: location.substring(0, 400),
    };

    // 2. Also try the POST handler to see if it gives different errors
    const postReq = new NextRequest(
      "https://xtrashield-seven.vercel.app/api/auth/signin/google",
      { method: "POST", body: new URLSearchParams({}) }
    );

    try {
      const postResponse = await authModule.handlers.POST!(postReq);
      const postLocation = postResponse?.headers?.get("location") ?? "none";
      results.signinPost = {
        status: postResponse?.status,
        location: postLocation.substring(0, 400),
      };
    } catch (err: any) {
      results.signinPost = { error: err?.message, stack: err?.stack?.substring(0, 500) };
    }

    // 3. Try the CSRF endpoint (usually the first thing auth does)
    const csrfReq = new NextRequest(
      "https://xtrashield-seven.vercel.app/api/auth/csrf",
      { method: "GET" }
    );
    try {
      const csrfResp = await authModule.handlers.GET!(csrfReq);
      const csrfBody = await csrfResp?.text();
      results.csrf = { status: csrfResp?.status, body: csrfBody?.substring(0, 200) };
    } catch (err: any) {
      results.csrf = { error: err?.message, stack: err?.stack?.substring(0, 500) };
    }

    // 4. Check session
    const sessionReq = new NextRequest(
      "https://xtrashield-seven.vercel.app/api/auth/session",
      { method: "GET" }
    );
    try {
      const sessionResp = await authModule.handlers.GET!(sessionReq);
      const sessionBody = await sessionResp?.text();
      results.session = { status: sessionResp?.status, body: sessionBody?.substring(0, 200) };
    } catch (err: any) {
      results.session = { error: err?.message, stack: err?.stack?.substring(0, 500) };
    }

  } catch (err: any) {
    results.fatalError = {
      error: err?.message,
      name: err?.name,
      stack: err?.stack?.substring(0, 800),
    };
  }

  return NextResponse.json(results);
}
