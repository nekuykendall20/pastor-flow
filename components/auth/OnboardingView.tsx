'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartHandshake, Building2, UserCircle, ArrowRight, Mail, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Step = 'profile' | 'org' | 'invite';

const COLORS = [
  '#6aaa7e', '#5b8fa8', '#a87e6a', '#8a6aaa', '#aa6a6a',
  '#6a8aaa', '#aa9b6a', '#6aaa98', '#aa6a8a', '#7eaa6a',
];

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
}

export default function OnboardingView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [title, setTitle] = useState('Lead Pastor');
  const [color, setColor] = useState(COLORS[0]);
  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  async function handleProfileNext(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('org');
  }

  async function handleOrgNext(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Session expired. Please sign in again.'); setLoading(false); return; }

    // Generate org ID client-side so we don't need to SELECT it back
    // (SELECT would fail because the org SELECT policy requires profile.organization_id to match,
    //  which isn't set yet at this point in the flow)
    const orgId = crypto.randomUUID();

    const { error: orgError } = await supabase
      .from('organizations')
      .insert({ id: orgId, name: orgName.trim() });

    if (orgError) {
      setError(orgError.message);
      setLoading(false);
      return;
    }

    // Upsert profile (handles case where trigger didn't create the row)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: name.trim(),
        title: title.trim() || 'Lead Pastor',
        role: 'owner',
        color,
        initials: getInitials(name),
        organization_id: orgId,
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep('invite');
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSent(true);
    // Invite functionality placeholder — will send magic link in production
    setInviteEmail('');
  }

  function handleFinish() {
    window.location.href = '/';
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
            Welcome to Pastor Flow
          </h1>
          <p className="text-sm text-[oklch(0.18_0.02_150)]/50 mt-1">
            Let's get your workspace set up
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['profile', 'org', 'invite'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  step === s
                    ? 'bg-[#6aaa7e] w-5'
                    : i < ['profile', 'org', 'invite'].indexOf(step)
                    ? 'bg-[#6aaa7e]/50'
                    : 'bg-black/10'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
          {/* Step 1: Profile */}
          {step === 'profile' && (
            <form onSubmit={handleProfileNext} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <UserCircle size={18} className="text-[#6aaa7e]" />
                <h2 className="font-semibold text-[oklch(0.18_0.02_150)]">Your profile</h2>
              </div>

              <div>
                <label className="text-xs font-medium text-[oklch(0.18_0.02_150)]/60 mb-1.5 block">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Pastor Sarah Johnson"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 bg-[oklch(0.97_0.008_85)] text-sm text-[oklch(0.18_0.02_150)] placeholder:text-[oklch(0.18_0.02_150)]/30 focus:outline-none focus:ring-2 focus:ring-[#6aaa7e]/40 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[oklch(0.18_0.02_150)]/60 mb-1.5 block">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Lead Pastor"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 bg-[oklch(0.97_0.008_85)] text-sm text-[oklch(0.18_0.02_150)] placeholder:text-[oklch(0.18_0.02_150)]/30 focus:outline-none focus:ring-2 focus:ring-[#6aaa7e]/40 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[oklch(0.18_0.02_150)]/60 mb-2 block">
                  Avatar color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-[oklch(0.18_0.02_150)]/40 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                {name && (
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(name)}
                    </div>
                    <span className="text-sm text-[oklch(0.18_0.02_150)]/60">{name || 'Your Name'}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#1c2b22] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#243329] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* Step 2: Organization */}
          {step === 'org' && (
            <form onSubmit={handleOrgNext} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-[#6aaa7e]" />
                <h2 className="font-semibold text-[oklch(0.18_0.02_150)]">Your church</h2>
              </div>

              <div>
                <label className="text-xs font-medium text-[oklch(0.18_0.02_150)]/60 mb-1.5 block">
                  Church / organization name
                </label>
                <input
                  type="text"
                  placeholder="Grace Community Church"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 bg-[oklch(0.97_0.008_85)] text-sm text-[oklch(0.18_0.02_150)] placeholder:text-[oklch(0.18_0.02_150)]/30 focus:outline-none focus:ring-2 focus:ring-[#6aaa7e]/40 transition"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !orgName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#1c2b22] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#243329] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create workspace
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 3: Invite */}
          {step === 'invite' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Mail size={18} className="text-[#6aaa7e]" />
                <h2 className="font-semibold text-[oklch(0.18_0.02_150)]">Invite your team</h2>
              </div>

              <p className="text-sm text-[oklch(0.18_0.02_150)]/55">
                Invite staff members to join your workspace. They&apos;ll receive a magic link to sign in.
              </p>

              {inviteSent && (
                <div className="flex items-center gap-2 text-xs text-[#6aaa7e] bg-[#6aaa7e]/10 rounded-lg px-3 py-2">
                  <CheckCircle size={13} />
                  Invite sent! (Feature coming soon — note their email for now.)
                </div>
              )}

              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  placeholder="staff@yourchurch.org"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-black/10 bg-[oklch(0.97_0.008_85)] text-sm text-[oklch(0.18_0.02_150)] placeholder:text-[oklch(0.18_0.02_150)]/30 focus:outline-none focus:ring-2 focus:ring-[#6aaa7e]/40 transition"
                />
                <button
                  type="submit"
                  disabled={!inviteEmail.trim()}
                  className="px-3.5 py-2.5 bg-[#6aaa7e]/15 text-[#4a8a5e] rounded-lg text-sm font-medium hover:bg-[#6aaa7e]/25 transition disabled:opacity-40"
                >
                  Invite
                </button>
              </form>

              <button
                onClick={handleFinish}
                className="w-full flex items-center justify-center gap-2 bg-[#1c2b22] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#243329] transition mt-2"
              >
                Go to my dashboard
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
