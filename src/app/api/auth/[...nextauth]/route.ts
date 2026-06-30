import { handlers } from "@/lib/auth"

async function safeHandler(request: Request) {
  try {
    const method = request.method as "GET" | "POST";
    const handler = handlers[method];
    if (!handler) {
      return new Response("Method not allowed", { status: 405 });
    }
    return await handler(request);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[AUTH ERROR]", err.message);
    console.error("[AUTH ERROR STACK]", err.stack);
    if ("type" in (error as Record<string, unknown>)) {
      console.error("[AUTH ERROR TYPE]", (error as { type: string }).type);
    }
    throw error;
  }
}

export const GET = safeHandler;
export const POST = safeHandler;
