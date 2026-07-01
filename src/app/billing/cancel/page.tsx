import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex items-center justify-center px-6 font-mono">
      <div className="max-w-md w-full border border-black p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-6">
          <XCircle className="w-8 h-8 text-[#4B5563]" />
          <h1 className="text-2xl font-heading font-extrabold uppercase tracking-tight">
            {">"} CHECKOUT CANCELED
          </h1>
        </div>

        <p className="text-sm text-[#4B5563] leading-relaxed">
          Your payment wasn't completed. No charges were made and your account
          is still on the FREE plan. You can try again whenever you're ready.
        </p>

        <div className="mt-8">
          <Link
            href="/settings"
            className="bg-black hover:bg-[#16A34A] text-white font-bold tracking-widest text-xs uppercase py-3 px-6 text-center transition-colors flex items-center justify-center gap-2 border border-black"
          >
            <ArrowLeft className="w-4 h-4" /> BACK TO SETTINGS
          </Link>
        </div>
      </div>
    </div>
  );
}
