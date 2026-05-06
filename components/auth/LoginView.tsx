'use client';

import { useState } from 'react';
import { HeartHandshake, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Mode = 'signin' | 'signup';

export default function LoginView() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    const supabase = createClient();

    if (mode === 'signup') {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      // Auto sign in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      router.push('/onboarding');
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.008_85)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#1c2b22] flex items-center justify-center mb-4 shadow-lg">
            <HeartHandshake size={28} className="text-[#6aaa7e]" />
          </div>
          <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_150)] tracking-tight">
            Pastor Flow
          </h1>
          <p className="text-sm text-[oklch(0.18_0.02_150)]/50 mt-1">
            The OS for healthy pastoral leadership
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
          {/* Tabs */}
          <div className="flex rounded-lg bg-[oklch(0.97_0.008_85)] p-1 mb-5">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                mode === 'signin'
                  ? 'bg-white text-[oklch(0.18_0.02_150)] shadow-sm'
                  : 'text-[oklch(0.18_0.02_150)]/50 hover:text-[oklch(0.18_0.02_150)]/70'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                mode === 'signup'
                  ? 'bg-white text-[oklch(0.18_0.02_150)] shadow-sm'
                  : 'text-[oklch(0.18_0.02_150)]/50 hover:text-[oklch(0.18_0.02_150)]/70'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[oklch(0.18_0.02_150)]/30 pointer-events-none"
              />
              <input
                type="email"
                placeholder="pastor@yourchurch.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-black/10 bg-[oklch(0.97_0.008_85)] text-sm text-[oklch(0.18_0.02_150)] placeholder:text-[oklch(0.18_0.02_150)]/30 focus:outline-none focus:ring-2 focus:ring-[#6aaa7e]/40 transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[oklch(0.18_0.02_150)]/30 pointer-events-none"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Choose a password (8+ chars)' : 'Password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-black/10 bg-[oklch(0.97_0.008_85)] text-sm text-[oklch(0.18_0.02_150)] placeholder:text-[oklch(0.18_0.02_150)]/30 focus:outline-none focus:ring-2 focus:ring-[#6aaa7e]/40 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[oklch(0.18_0.02_150)]/30 hover:text-[oklch(0.18_0.02_150)]/50 transition"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full flex items-center justify-center gap-2 bg-[#1c2b22] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#243329] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[oklch(0.18_0.02_150)]/35 mt-6">
          {mode === 'signin'
            ? "Don't have an account? Click Create account above."
            : 'Already have an account? Click Sign in above.'}
        </p>
      </div>
    </div>
  );
}
