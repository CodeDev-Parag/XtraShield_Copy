import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Test assertConfig conditions manually
  const trustHost = true;
  const secret = process.env.AUTH_SECRET;
  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  results.checks = {
    trustHost,
    hasSecret: !!secret,
    secretLength: secret?.length ?? 0,
    hasGoogle,
    googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length ?? 0,
    googleClientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length ?? 0,
  };

  // 2. Test PrismaAdapter creation
  try {
    const { PrismaAdapter } = await import("@auth/prisma-adapter");
    const { db } = await import("@/lib/db");
    const adapter = PrismaAdapter(db as any) as any;

    results.adapter = {
      created: true,
      methods: adapter ? Object.keys(adapter).filter(k => typeof adapter[k] === 'function') : [],
    };

    // Check required methods for JWT strategy with adapter
    const sessionMethods = [
      "createUser", "getUser", "getUserByEmail", "getUserByAccount",
      "updateUser", "linkAccount", "createSession", "getSessionAndUser",
      "updateSession", "deleteSession",
    ];
    const missingMethods = sessionMethods.filter(m => !(m in adapter));
    results.adapter.missingMethods = missingMethods;
    results.adapter.hasAllRequired = missingMethods.length === 0;
  } catch (err) {
    results.adapter = { error: String(err) };
  }

  // 3. Test Google provider creation
  try {
    const Google = (await import("next-auth/providers/google")).default;
    const provider = Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    });
    results.googleProvider = {
      id: provider.id,
      type: provider.type,
      issuer: provider.issuer,
    };
  } catch (err) {
    results.googleProvider = { error: String(err) };
  }

  // 4. Test Credentials provider creation
  try {
    const Credentials = (await import("next-auth/providers/credentials")).default;
    const provider = Credentials({
      authorize: () => null,
    });
    results.credentialsProvider = {
      id: provider.id,
      type: provider.type,
      hasAuthorize: typeof (provider as any).authorize === "function",
    };
  } catch (err) {
    results.credentialsProvider = { error: String(err) };
  }

  // 5. Test full auth initialization
  try {
    const { handlers } = await import("@/lib/auth");
    results.handlers = {
      hasGET: typeof handlers.GET === "function",
      hasPOST: typeof handlers.POST === "function",
    };
  } catch (err) {
    results.fullInit = { error: String(err) };
  }

  // 6. Test a simulated sign-in GET request to capture the real error
  try {
    const { handlers } = await import("@/lib/auth");
    const testUrl = "https://xtrashield-seven.vercel.app/api/auth/signin/google";
    const req = new Request(testUrl, { method: "GET" });
    const response = await handlers.GET!(req);
    const url = response?.headers?.get("location") ?? "no redirect";
    results.simulatedSignIn = {
      status: response?.status,
      redirectUrl: url?.substring(0, 200),
      hasError: url?.includes("error="),
    };
    if (url?.includes("error=")) {
      const errorParam = new URL(url).searchParams.get("error");
      results.simulatedSignIn.errorCode = errorParam;
    }
  } catch (err) {
    results.simulatedSignIn = { error: String(err) };
  }

  return NextResponse.json(results, { space: 2 });
}
