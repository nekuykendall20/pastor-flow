'use client';

import { useState, useRef } from 'react';
import {
  HeartHandshake, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight,
  CheckSquare, BookOpen, Flame, CalendarDays, Users2, ChevronDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Mode = 'signin' | 'signup';

const features = [
  {
    icon: CheckSquare,
    title: 'Ministry Tasks',
    desc: 'Assign, prioritize, and track every responsibility across your staff — nothing slips through the cracks.',
  },
  {
    icon: HeartHandshake,
    title: 'People Care',
    desc: 'Log visits, follow-ups, and pastoral notes so every person in your care feels remembered.',
  },
  {
    icon: BookOpen,
    title: 'Sermon Prep',
    desc: 'From first idea to final delivery — manage your entire sermon pipeline in one place.',
  },
  {
    icon: Flame,
    title: 'Prayer Board',
    desc: 'Organize requests from your congregation, staff, and personal prayer life. Pray with intention.',
  },
  {
    icon: CalendarDays,
    title: 'Weekly Rhythm',
    desc: 'Track your spiritual disciplines and protect time for rest, study, and prayer before it disappears.',
  },
  {
    icon: Users2,
    title: 'Team Workspace',
    desc: 'Invite staff, share task boards and care records, and lead your team with full shared visibility.',
  },
];

export default function LoginView() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

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
      if (authError) { setError(authError.message); setLoading(false); return; }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
      router.push('/onboarding');
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) { setError(authError.message); setLoading(false); return; }
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.008_85)]">

      {/* ── Hero ── */}
      <section className="bg-[#1c2b22] flex flex-col min-h-screen">

        {/* Nav */}
        <nav className="flex items-center justify-between px-6 md:px-10 py-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#6aaa7e]/20 flex items-center justify-center">
              <HeartHandshake size={16} className="text-[#6aaa7e]" />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">Pastor Flow</span>
          </div>
          <button
            onClick={() => { setMode('signin'); scrollToForm(); }}
            className="text-white/40 hover:text-white/70 text-sm transition"
          >
            Sign in →
          </button>
        </nav>

        {/* Headline */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-4 pb-6 max-w-2xl mx-auto w-full">
          <div className="inline-flex items-center gap-1.5 bg-[#6aaa7e]/15 text-[#6aaa7e] text-xs font-medium px-3 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6aaa7e] animate-pulse" />
            Built for pastoral leaders
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08] tracking-tight mb-5">
            Ministry clarity.<br />
            <span className="text-[#6aaa7e]">Without the chaos.</span>
          </h1>

          <p className="text-white/50 text-base md:text-lg leading-relaxed max-w-lg mb-9">
            One place to manage your team, track pastoral care, plan sermons, and
            protect your personal rhythm — built around the work of shepherding.
          </p>

          <button
            onClick={() => { setMode('signup'); scrollToForm(); }}
            className="flex items-center gap-2 bg-[#6aaa7e] hover:bg-[#5a9a6e] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-black/30 mb-3"
          >
            Get started free
            <ChevronDown size={15} />
          </button>

          <p className="text-white/25 text-xs">No credit card required</p>
        </div>

        {/* Auth form — anchored at bottom of hero */}
        <div ref={formRef} className="flex justify-center px-4 pb-16 pt-2 shrink-0">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-white/10 p-6">
            {/* Tabs — sliding pill */}
            <div className="relative grid grid-cols-2 rounded-xl bg-[oklch(0.955_0.008_85)] p-1 mb-5">
              {/* The pill slides between the two tabs */}
              <div
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm pointer-events-none transition-transform duration-200 ease-out ${
                  mode === 'signin' ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`relative z-10 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  mode === 'signup' ? 'text-[oklch(0.18_0.02_150)]' : 'text-[oklch(0.18_0.02_150)]/45 hover:text-[oklch(0.18_0.02_150)]/65'
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); }}
                className={`relative z-10 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  mode === 'signin' ? 'text-[oklch(0.18_0.02_150)]' : 'text-[oklch(0.18_0.02_150)]/45 hover:text-[oklch(0.18_0.02_150)]/65'
                }`}
              >
                Sign in
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[oklch(0.18_0.02_150)]/30 pointer-events-none" />
                <input
                  type="email"
                  placeholder="pastor@yourchurch.org"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-black/10 bg-[oklch(0.97_0.008_85)] text-sm text-[oklch(0.18_0.02_150)] placeholder:text-[oklch(0.18_0.02_150)]/30 focus:outline-none focus:ring-2 focus:ring-[#6aaa7e]/40 transition"
                />
              </div>

              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[oklch(0.18_0.02_150)]/30 pointer-events-none" />
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
                className="w-full flex items-center justify-center gap-2 bg-[#1c2b22] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#243329] transition disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'signup' ? 'Create account' : 'Sign in'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-[#6aaa7e] uppercase tracking-widest mb-3">
            Everything you need
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[oklch(0.18_0.02_150)] tracking-tight">
            The tools pastors actually use
          </h2>
          <p className="text-[oklch(0.18_0.02_150)]/45 mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Built around the rhythms of ministry — not repurposed project management software.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#6aaa7e]/10 flex items-center justify-center mb-3 group-hover:bg-[#6aaa7e]/20 transition-colors">
                <Icon size={16} className="text-[#6aaa7e]" />
              </div>
              <h3 className="font-semibold text-[oklch(0.18_0.02_150)] text-sm mb-1.5">{title}</h3>
              <p className="text-[oklch(0.18_0.02_150)]/45 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Planning Center ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left: text */}
            <div className="flex-1 p-8 md:p-10">
              <div className="inline-flex items-center gap-1.5 bg-[#6aaa7e]/10 text-[#4a8a5e] text-xs font-semibold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
                Planning Center Integration
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[oklch(0.18_0.02_150)] tracking-tight mb-3 leading-snug">
                Works alongside Planning Center,<br className="hidden md:block" /> not instead of it.
              </h2>
              <p className="text-[oklch(0.18_0.02_150)]/55 text-sm leading-relaxed mb-4">
                Planning Center is great at what it does — scheduling volunteers, managing services, and engaging your congregation. Pastor Flow fills the gap it doesn&apos;t cover: the internal leadership layer where your team plans, prays, and shepherds together.
              </p>
              <p className="text-[oklch(0.18_0.02_150)]/55 text-sm leading-relaxed">
                The Planning Center plug-in connects your two tools so you&apos;re never duplicating work. Pull in service dates for sermon prep, sync your team roster, and keep your ministry calendar aligned — all without leaving Pastor Flow.
              </p>
            </div>

            {/* Right: callout */}
            <div className="md:w-64 bg-[oklch(0.97_0.008_85)] border-t md:border-t-0 md:border-l border-black/5 p-8 flex flex-col justify-center gap-5">
              {[
                { label: 'Sermon dates', sub: 'Pulled from your PCO service schedule' },
                { label: 'Team roster', sub: 'Sync staff from your PCO people list' },
                { label: 'Ministry calendar', sub: 'Keep events aligned across both tools' },
              ].map(({ label, sub }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6aaa7e] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[oklch(0.18_0.02_150)]">{label}</p>
                    <p className="text-xs text-[oklch(0.18_0.02_150)]/45 leading-relaxed">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="bg-[#1c2b22] py-16 px-6 text-center">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
          Start today
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
          Tend your flock with clarity.
        </h2>
        <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed mb-8">
          Free to start. Built for the long work of faithful ministry.
        </p>
        <button
          onClick={() => { setMode('signup'); scrollToForm(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-flex items-center gap-2 bg-[#6aaa7e] hover:bg-[#5a9a6e] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-black/20"
        >
          Get started free
          <ArrowRight size={14} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 text-center border-t border-black/5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HeartHandshake size={13} className="text-[#6aaa7e]" />
          <span className="text-xs font-semibold text-[oklch(0.18_0.02_150)]/40">Pastor Flow</span>
        </div>
        <p className="text-[oklch(0.18_0.02_150)]/25 text-xs">
          © {new Date().getFullYear()} Pastor Flow. Built with care for ministry leaders.
        </p>
      </footer>

    </div>
  );
}
