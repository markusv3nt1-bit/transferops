'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050b18]">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full relative overflow-hidden text-white">
      {/* FULL-SCREEN BACKGROUND IMAGE */}
      <img
        src="/assets/images/b94-1777620448532.png"
        alt="Kos Island night background"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* DARK OVERLAY for readability */}
      <div className="absolute inset-0 bg-[#050b18]/55" />

      {/* RIGHT-SIDE LOGIN CARD */}
      <div className="absolute inset-0 flex items-center justify-end pr-[8%] sm:pr-[10%] lg:pr-[12%] xl:pr-[15%] px-4">

        <div className="relative w-full max-w-[420px] rounded-[20px] border border-white/18 bg-[#0b1728]/85 backdrop-blur-xl px-6 sm:px-8 py-7 shadow-[0_40px_120px_rgba(0,0,0,.65)]">
          <div className="flex flex-col items-center justify-center mb-6">
            <span className="text-[22px] font-extrabold tracking-tight text-white">CERBOTOURS</span>
            <span className="text-[22px] font-extrabold tracking-tight text-[#3b82f6]">Kos Island</span>
          </div>

          <h2 className="text-[22px] font-extrabold tracking-tight">Welcome back</h2>
          <p className="mt-1 mb-5 text-[13px] text-white/48">
            Secure access to your operations dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldLabel label="Email address">
              <InputShell icon={<MailIcon />}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@transferops.com"
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/25 text-[14px]"
                />
              </InputShell>
            </FieldLabel>

            <FieldLabel label="Password">
              <InputShell icon={<LockIcon />}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/30 text-[14px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/40 hover:text-white/75 transition"
                >
                  <EyeIcon />
                </button>
              </InputShell>
            </FieldLabel>

            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 text-[13px] text-white/72"
              >
                <span className="w-[16px] h-[16px] rounded-[4px] bg-[#2f7dff] flex items-center justify-center">
                  {rememberMe && <CheckIcon />}
                </span>
                Remember me
              </button>

              <button type="button" className="text-[13px] text-[#3b82f6] hover:text-[#60a5fa]">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1572f6] text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_16px_40px_rgba(37,99,235,.28)] hover:brightness-110 disabled:opacity-60 transition"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              {!isSubmitting && <ArrowRightIcon />}
            </button>
          </form>

          <div className="flex items-center gap-4 my-5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-white/35 text-xs">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button className="w-full h-[46px] rounded-xl border border-white/15 text-white/82 text-[14px] font-semibold flex items-center justify-center gap-2 hover:border-white/30 hover:bg-white/[0.03] transition">
            <ShieldIcon className="w-4 h-4" />
            Sign in with SSO
          </button>

          <div className="mt-5 flex items-center justify-center gap-2 text-white/32 text-[12px]">
            <LockMiniIcon />
            All connections are secure and encrypted
          </div>
        </div>
      </div>
    </main>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-2 text-[13px] font-semibold text-white/78">{label}</span>
      {children}
    </label>
  );
}

function InputShell({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="h-[46px] rounded-xl border border-white/12 bg-white/[0.055] flex items-center px-3 gap-3 focus-within:border-[#3b82f6]/80 focus-within:ring-2 focus-within:ring-[#3b82f6]/20 transition">
      <div className="text-white/48">{icon}</div>
      <div className="h-7 w-px bg-white/10" />
      <div className="flex-1 flex items-center gap-3">{children}</div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
      <path d="M2 6.2l2.4 2.4L10 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3l7 3v5c0 4.8-3 8.7-7 10-4-1.3-7-5.2-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LockMiniIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 7V5.4a2.5 2.5 0 015 0V7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}