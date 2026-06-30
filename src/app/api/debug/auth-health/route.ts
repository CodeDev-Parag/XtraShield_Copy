import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check env vars
  results.checks = {
    trustHost: true,
    hasSecret: !!process.env.AUTH_SECRET,
    secretLength: process.env.AUTH_SECRET?.length ?? 0,
    hasGoogle: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length ?? 0,
    googleClientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length ?? 0,
  };

  // 2. Test PrismaAdapter
  try {
    const { PrismaAdapter } = await import("@auth/prisma-adapter");
    const { db } = await import("@/lib/db");
    const adapter = PrismaAdapter(db) as any;
    const methods = adapter ? Object.keys(adapter).filter((k: string) => typeof adapter[k] === "function") : [];
    results.adapter = { created: true, methodCount: methods.length, methods };
  } catch (err: any) {
    results.adapter = { error: String(err), stack: err?.stack?.substring(0, 500) };
  }

  // 3. Test Google provider
  try {
    const mod = await import("next-auth/providers/google");
    const Google = mod.default;
    const provider = Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    });
    results.googleProvider = { id: provider.id, type: provider.type, issuer: provider.issuer };
  } catch (err: any) {
    results.googleProvider = { error: String(err), stack: err?.stack?.substring(0, 500) };
  }

  // 4. Test full auth initialization
  try {
    const { handlers } = await import("@/lib/auth");
    results.handlers = { hasGET: typeof handlers.GET === "function", hasPOST: typeof handlers.POST === "function" };
  } catch (err: any) {
    results.fullInit = { error: String(err), stack: err?.stack?.substring(0, 500) };
  }

  // 5. Simulate Google sign-in request to capture the real error
  try {
    const { NextRequest } = await import("next/server");
    const { handlers } = await import("@/lib/auth");
    const req = new NextRequest("https://xtrashield-seven.vercel.app/api/auth/signin/google", { method: "GET" });
    const response = await handlers.GET!(req);
    const location = response?.headers?.get("location") ?? "no redirect";
    results.simulatedSignIn = {
      status: response?.status,
      redirectUrl: location.substring(0, 300),
      hasError: location.includes("error="),
    };
    if (location.includes("error=")) {
      const errorParam = new URL(location).searchParams.get("error");
      const errorDescription = new URL(location).searchParams.get("error_description");
      results.simulatedSignIn.errorCode = errorParam;
      results.simulatedSignIn.errorDescription = errorDescription;
    }
  } catch (err: any) {
    results.simulatedSignIn = { error: String(err), stack: err?.stack?.substring(0, 500) };
  }

  return NextResponse.json(results);
}
