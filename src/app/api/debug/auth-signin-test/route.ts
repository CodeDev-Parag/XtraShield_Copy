import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(request: Request) {
  const logs: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  const origWarn = console.warn;
  
  console.log = (...args: any[]) => logs.push("[LOG] " + args.map(String).join(" "));
  console.error = (...args: any[]) => logs.push("[ERROR] " + args.map(String).join(" "));
  console.warn = (...args: any[]) => logs.push("[WARN] " + args.map(String).join(" "));

  try {
    const authModule = await import("@/lib/auth");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      "https://xtrashield-seven.vercel.app/api/auth/signin/google",
      { method: "GET" }
    );

    const response = await authModule.handlers.GET!(req);
    const location = response?.headers?.get("location") ?? "none";

    return NextResponse.json({
      status: response?.status,
      location: location.substring(0, 400),
      capturedLogs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message,
      stack: err?.stack?.substring(0, 800),
      capturedLogs: logs,
    });
  } finally {
    console.log = origLog;
    console.error = origErr;
    console.warn = origWarn;
  }
}
