'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Shield, AlertOctagon, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col font-mono">
      {/* Header */}
      <header className="w-full h-20 px-6 md:px-12 border-b border-black bg-white flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-black border border-black flex items-center justify-center group-hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100 overflow-hidden">
            <img src="/logo.jpg" alt="XtraShield Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-heading font-extrabold tracking-widest text-lg ml-1 uppercase">
            XtraShield
          </span>
        </Link>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md border border-black bg-white p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-[#16A34A]" />
            <h1 className="text-2xl font-heading font-extrabold tracking-tight uppercase">
              &gt; SECURE LOGIN
            </h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#DC2626] text-[#DC2626] text-xs font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-bold mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-black py-2.5 px-4 text-sm text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                placeholder="admin@xtrashield.io"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-bold mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-black py-2.5 px-4 text-sm text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-black text-white hover:bg-[#16A34A] font-bold tracking-widest text-xs uppercase transition-colors duration-100 border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-black" />
            <span className="text-[10px] text-[#4B5563] uppercase tracking-widest font-bold">or</span>
            <div className="flex-1 h-px bg-black" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 bg-white border border-black hover:bg-[#F3F4F6] text-[#0A0A0A] font-bold tracking-widest text-xs uppercase transition-colors duration-100 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <div className="mt-6 pt-4 border-t border-black text-center">
            <p className="text-xs text-[#4B5563]">
              No account?{' '}
              <Link href="/register" className="text-[#0A0A0A] font-bold underline hover:text-[#16A34A]">
                Register here
              </Link>
            </p>
          </div>

          {process.env.NODE_ENV !== "production" && (
            <div className="mt-4 text-center">
              <p className="text-[10px] text-[#4B5563]">
                Demo credentials: <strong className="text-[#0A0A0A]">admin@xtrashield.io</strong> / <strong className="text-[#0A0A0A]">password123</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
