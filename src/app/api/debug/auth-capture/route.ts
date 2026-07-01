import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET() {
  const logs: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  const origWarn = console.warn;

  const capture = (level: string) => (...args: any[]) => {
    try {
      const serialized = args.map((a) => {
        if (a instanceof Error) {
          return `${a.name}: ${a.message}`;
        }
        if (typeof a === "object") {
          try {
            return JSON.stringify(a, Object.getOwnPropertyNames(a));
          } catch {
            return String(a);
          }
        }
        return String(a);
      });
      logs.push(`[${level}] ${serialized.join(" ")}`);
    } catch {
      logs.push(`[${level}] (could not serialize)`);
    }
  };

  console.log = capture("LOG") as any;
  console.error = capture("ERROR") as any;
  console.warn = capture("WARN") as any;

  try {
    const { handlers } = await import("@/lib/auth");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      "https://xtrashield-seven.vercel.app/api/auth/signin/google",
      { method: "GET" }
    );

    const response = await handlers.GET!(req);
    const location = response?.headers.get("location") ?? "none";

    return NextResponse.json({
      status: response?.status,
      location,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json({
      thrown: {
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.substring(0, 1500),
      },
      logs,
    });
  } finally {
    console.log = origLog;
    console.error = origErr;
    console.warn = origWarn;
  }
}
