import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const { handlers, auth } = await import("@/lib/auth");

  const result: Record<string, unknown> = {};

  try {
    const config = (auth as unknown as { config?: { basePath?: string } }).config;
    result.basePathFromConfig = config?.basePath;

    // Test config dump
    const configKeys = config ? Object.keys(config) : [];
    result.configKeys = configKeys;
    if (config && "providers" in config) {
      result.providerNames = (config as { providers: Array<{ id?: string; name?: string }> })
        .providers?.map((p) => p.id || p.name || "unknown");
    }
  } catch (err) {
    result.configError = (err as Error).message;
  }

  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AUTH_URL: process.env.AUTH_URL,
      AUTH_SECRET_SET: !!process.env.AUTH_SECRET,
      NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID_SET: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET_SET: !!process.env.GOOGLE_CLIENT_SECRET,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL,
    };
    result.env = env;
  } catch (err) {
    result.envError = (err as Error).message;
  }

  return NextResponse.json(result);
}
