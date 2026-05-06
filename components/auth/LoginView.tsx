'use client';

import { useState } from 'react';
import { HeartHandshake, Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
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
          {sent ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-[#6aaa7e]/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-[#6aaa7e]" />
              </div>
              <h2 className="font-semibold text-[oklch(0.18_0.02_150)] mb-2">Check your email</h2>
              <p className="text-sm text-[oklch(0.18_0.02_150)]/55 leading-relaxed">
                We sent a magic link to <span className="font-medium text-[oklch(0.18_0.02_150)]/80">{email}</span>.
                Click it to sign in — no password needed.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-5 text-xs text-[#6aaa7e] hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-[oklch(0.18_0.02_150)] mb-1">Sign in</h2>
              <p className="text-sm text-[oklch(0.18_0.02_150)]/50 mb-5">
                Enter your email to receive a magic link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
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

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle size={13} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#1c2b22] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#243329] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send magic link
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[oklch(0.18_0.02_150)]/35 mt-6">
          New to Pastor Flow? Sign in with your email to get started.
        </p>
      </div>
    </div>
  );
}
