'use client';

import { useState } from 'react';
import { useApp } from '@/lib/supabase-context';
import { Building2, User, Shield, Download, Plug, RefreshCw, Info, Link2, Users, BookOpen, CalendarDays, UsersRound, ClipboardCheck, CheckCircle2, Tag, Plus, X } from 'lucide-react';
import { DEFAULT_TASK_CATEGORIES } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100">
        <Icon size={15} className="text-[#6aaa7e]" />
        <h2 className="font-semibold text-stone-700 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
        enabled ? 'bg-[#6aaa7e]' : 'bg-stone-200'
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
        enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
      )} />
    </button>
  );
}

const SYNC_OPTIONS = [
  { id: 'people',   icon: Users,         label: 'Sync People into People Care',     description: 'Import contacts and member records from PCO People.' },
  { id: 'services', icon: BookOpen,       label: 'Sync Services into Sermon Workflow', description: 'Pull scheduled service plans into your Sermon workspace.' },
  { id: 'calendar', icon: CalendarDays,   label: 'Sync Calendar Events',             description: 'Show PCO calendar events alongside your ministry calendar.' },
  { id: 'groups',   icon: UsersRound,     label: 'Sync Groups & Teams',              description: 'Import groups and teams for staff task assignment.' },
  { id: 'checkin',  icon: ClipboardCheck, label: 'Sync Check-In Attendance Trends',  description: 'View attendance patterns to inform pastoral care priorities.' },
];

function PlanningCenterCard() {
  const [connected, setConnected] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    people: false, services: false, calendar: false, groups: false, checkin: false,
  });

  const handleConnect = () => {
    // Placeholder — no real OAuth yet
    setConnected(true);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setToggles({ people: false, services: false, calendar: false, groups: false, checkin: false });
  };

  return (
    <div className="rounded-2xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-stone-50 border-b border-stone-200">
        <div className="flex items-center gap-3">
          {/* PCO logo placeholder */}
          <div className="w-9 h-9 rounded-xl bg-[#e8f0eb] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#3d7a53"/>
              <path d="M12 20a8 8 0 1 1 16 0 8 8 0 0 1-16 0z" fill="white" fillOpacity="0.25"/>
              <path d="M20 13v7l4 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-stone-800 text-sm">Planning Center</p>
            <p className="text-[11px] text-stone-500">pco.church</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={11} /> Connected
              </span>
              <button
                onClick={handleDisconnect}
                className="text-[11px] text-stone-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full font-medium">
                Not connected
              </span>
              <Button
                size="sm"
                onClick={handleConnect}
                className="bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white text-xs h-8 px-3 gap-1.5"
              >
                <Link2 size={12} /> Connect Planning Center
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-stone-600 leading-relaxed">
          Future integration will sync <span className="font-medium text-stone-700">People, Calendar, Services, Groups,</span> and <span className="font-medium text-stone-700">Check-Ins</span> from Planning Center directly into Pastor Flow — keeping your pastoral care, sermon prep, and team management in one place.
        </p>

        {/* Sync toggles */}
        <div className={cn("space-y-1 transition-opacity", !connected && "opacity-40 pointer-events-none")}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">Sync Options</p>
          {SYNC_OPTIONS.map(({ id, icon: Icon, label, description }) => (
            <div
              key={id}
              className="flex items-center justify-between gap-4 py-3 border-b border-stone-100 last:border-0"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Icon size={14} className="text-stone-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-700">{label}</p>
                  <p className="text-xs text-stone-400 mt-0.5 leading-snug">{description}</p>
                </div>
              </div>
              <Toggle
                enabled={toggles[id]}
                onChange={v => setToggles(t => ({ ...t, [id]: v }))}
              />
            </div>
          ))}
        </div>

        {!connected && (
          <p className="text-xs text-stone-400 italic">Connect Planning Center to enable sync options.</p>
        )}

        {/* Note */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mt-2">
          <span className="text-amber-500 text-base leading-none mt-0.5">💡</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">Pastor Flow is designed to complement Planning Center, not replace it.</span>{' '}
            PCO handles scheduling, giving, and forms. Pastor Flow handles the relational, spiritual, and team rhythms that happen around and between those systems.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SettingsView() {
  const { state, saveSettings, currentUser, users, signOut } = useApp();
  const [orgName, setOrgName] = useState(state.settings.organizationName);
  const [saved, setSaved] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [catSaved, setCatSaved] = useState(false);

  const currentCategories = state.settings.taskCategories?.length
    ? state.settings.taskCategories
    : DEFAULT_TASK_CATEGORIES;

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || currentCategories.includes(trimmed)) return;
    saveSettings({ taskCategories: [...currentCategories, trimmed] });
    setNewCategory('');
    setCatSaved(true);
    setTimeout(() => setCatSaved(false), 1500);
  };

  const removeCategory = (cat: string) => {
    saveSettings({ taskCategories: currentCategories.filter(c => c !== cat) });
  };

  const resetCategories = () => {
    saveSettings({ taskCategories: DEFAULT_TASK_CATEGORIES });
  };

  const handleSave = () => {
    saveSettings({ organizationName: orgName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      organization: state.settings.organizationName,
      tasks: state.tasks,
      people: state.people,
      sermons: state.sermons,
      prayerRequests: state.prayerRequests,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pastor-flow-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    if (window.confirm('Sign out and clear your session? Your cloud data will remain.')) {
      await signOut();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Settings</h1>
        <p className="text-stone-500 text-sm mt-0.5">Organization and account settings</p>
      </div>

      <div className="space-y-5">
        {/* Organization */}
        <Section title="Organization" icon={Building2}>
          <div className="space-y-4">
            <div>
              <Label className="text-stone-600 text-xs">Organization Name</Label>
              <Input value={orgName} onChange={e => setOrgName(e.target.value)} className="mt-1 max-w-sm" />
            </div>
            <Button onClick={handleSave} className={cn("bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white", saved && 'bg-green-600')}>
              {saved ? '✓ Saved' : 'Save Changes'}
            </Button>
          </div>
        </Section>

        {/* Task Categories */}
        <Section title="Task Categories" icon={Tag}>
          <div className="space-y-4">
            <p className="text-sm text-stone-500 leading-relaxed">
              Customize the categories available when creating tasks. Changes apply to your whole organization — build a list that fits your ministry context.
            </p>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {currentCategories.map(cat => (
                <div
                  key={cat}
                  className="flex items-center gap-1.5 bg-stone-100 text-stone-700 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium group"
                >
                  <span>{cat}</span>
                  <button
                    onClick={() => removeCategory(cat)}
                    className="w-4 h-4 rounded-full bg-stone-300 hover:bg-red-400 text-white flex items-center justify-center transition-colors text-xs leading-none"
                    title={`Remove ${cat}`}
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new category */}
            <div className="flex gap-2 items-center">
              <Input
                placeholder="New category name..."
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                className="max-w-xs h-9"
              />
              <Button
                onClick={addCategory}
                disabled={!newCategory.trim() || currentCategories.includes(newCategory.trim())}
                className="bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white h-9 gap-1.5"
              >
                <Plus size={14} /> Add
              </Button>
              {catSaved && (
                <span className="text-xs text-green-600 font-medium">✓ Saved</span>
              )}
            </div>

            <button
              onClick={resetCategories}
              className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </Section>

        {/* Current User */}
        <Section title="Current User" icon={User}>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.initials}
            </div>
            <div>
              <p className="font-semibold text-stone-800">{currentUser.name}</p>
              <p className="text-sm text-stone-500">{currentUser.title} · {currentUser.role}</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-3">Switch users in the sidebar to view the app as different team members.</p>
        </Section>

        {/* Team */}
        <Section title="Team Members" icon={Shield}>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: user.color }}
                >
                  {user.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-700">{user.name}</p>
                  <p className="text-xs text-stone-400">{user.title}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  user.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                  user.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'
                )}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-3 italic">Team management will be available in a future version.</p>
        </Section>

        {/* Integrations */}
        <Section title="Integrations" icon={Plug}>
          <div className="space-y-4">
            <PlanningCenterCard />

            {/* Other future integrations */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">More Coming Soon</p>
              {['Church Community Builder', 'Google Calendar', 'Slack'].map(name => (
                <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-sm text-stone-500 font-medium">{name}</span>
                  <span className="text-[10px] bg-stone-200 text-stone-400 px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Data */}
        <Section title="Data & Export" icon={Download}>
          <div className="space-y-3">
            <p className="text-sm text-stone-600">Your data is stored locally in your browser. Export a JSON backup at any time.</p>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download size={14} /> Export Data (JSON)
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2 text-red-500 border-red-200 hover:bg-red-50">
                <RefreshCw size={14} /> Reset to Sample Data
              </Button>
            </div>
          </div>
        </Section>

        {/* About */}
        <Section title="About" icon={Info}>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Version</span>
              <span className="text-stone-700 font-medium">1.0.0 MVP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Tagline</span>
              <span className="text-stone-700 italic">Organize the work of shepherding.</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Storage</span>
              <span className="text-stone-700">Local (browser)</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
