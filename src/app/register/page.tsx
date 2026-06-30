'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col font-mono">
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

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md border border-black bg-white p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-[#16A34A]" />
            <h1 className="text-2xl font-heading font-extrabold tracking-tight uppercase">
              &gt; REGISTER ACCOUNT
            </h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#DC2626] text-[#DC2626] text-xs font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-[#DCFCE7] border border-[#16A34A] text-[#16A34A] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Account created! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-[#4B5563] uppercase tracking-widest font-bold mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white border border-black py-2.5 px-4 text-sm text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                placeholder="Secured User"
              />
            </div>

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
                placeholder="you@example.com"
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
                minLength={6}
                className="w-full bg-white border border-black py-2.5 px-4 text-sm text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                placeholder="Min 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full h-12 bg-black text-white hover:bg-[#16A34A] font-bold tracking-widest text-xs uppercase transition-colors duration-100 border border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-black text-center">
            <p className="text-xs text-[#4B5563]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#0A0A0A] font-bold underline hover:text-[#16A34A]">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
