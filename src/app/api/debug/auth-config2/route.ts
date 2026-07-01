import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const logs: string[] = [];
  const origLog = console.log;
  const origErr = console.error;

  const capture = (level: string) => (...args: unknown[]) => {
    try {
      logs.push(
        `[${level}] ` +
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
            .join(" | ")
      );
    } catch {
      logs.push(`[${level}] unserializable`);
    }
  };

  console.log = capture("LOG") as typeof console.log;
  console.error = capture("ERR") as typeof console.error;

  try {
    const setEnvDefaultsMod = await import("next-auth/lib/env.js");
    const coreEnvMod = await import("@auth/core/lib/utils/env.js");
    return NextResponse.json({
      hasNextAuthEnv: typeof setEnvDefaultsMod.setEnvDefaults,
      hasCoreEnv: typeof coreEnvMod.setEnvDefaults,
      logs,
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    });
  } catch (err) {
    return NextResponse.json({
      error: (err as Error).message,
      stack: (err as Error).stack?.substring(0, 800),
      logs,
    });
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
}
