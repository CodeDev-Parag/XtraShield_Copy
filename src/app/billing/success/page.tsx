import Link from "next/link";
import { CheckCircle2, ArrowRight, Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const session = await auth();
  const { session_id } = await searchParams;

  let plan: string | null = null;
  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    plan = user?.plan ?? null;
  }

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex items-center justify-center px-6 font-mono">
      <div className="max-w-md w-full border border-black p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
          <h1 className="text-2xl font-heading font-extrabold uppercase tracking-tight">
            {">"} PAYMENT SUCCESSFUL
          </h1>
        </div>

        <p className="text-sm text-[#4B5563] leading-relaxed">
          Thanks for upgrading to <strong className="text-[#0A0A0A]">PRO</strong>.
          Your plan is active and rate limits have been updated. The webhook may
          take a few seconds to confirm, so refresh this page if your account
          still shows FREE.
        </p>

        {plan && (
          <div className="mt-5 bg-[#F8F9FA] border border-black p-3 text-xs">
            <span className="font-bold uppercase tracking-widest text-[#4B5563] mr-2">
              Current Plan:
            </span>
            <span className="font-extrabold uppercase">{plan}</span>
          </div>
        )}

        {session_id && (
          <p className="mt-4 text-[10px] text-[#4B5563] break-all">
            Reference: <code>{session_id}</code>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="bg-black hover:bg-[#16A34A] text-white font-bold tracking-widest text-xs uppercase py-3 px-6 text-center transition-colors flex items-center justify-center gap-2 border border-black"
          >
            GO TO DASHBOARD <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/settings"
            className="bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] border border-black font-bold tracking-widest text-xs uppercase py-3 px-6 text-center transition-colors flex items-center justify-center gap-2"
          >
            MANAGE SUBSCRIPTION <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
