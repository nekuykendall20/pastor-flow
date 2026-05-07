'use client';

import { useState } from 'react';
import { useApp } from '@/lib/supabase-context';
import { Sparkles, FileText, MessageSquare, BookOpen, Copy, Check, ChevronDown, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  generateWeeklyBrief,
  extractTasksFromNotes,
  generateFollowUpMessage,
  generateSermonHelper,
  type ExtractedTask,
  type SermonHelperOutput,
  type FollowUpSource,
} from '@/lib/ai/mock-ai';
import { Task } from '@/lib/types';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
      <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-500" />
      <span><strong>AI suggestions are drafts. Review before using.</strong> Generated from your live data using template-based simulation. Real AI integration coming soon.</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors px-2 py-1 rounded-lg hover:bg-stone-100">
      {copied ? <><Check size={12} className="text-green-500" /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

function OutputBox({ label, content }: { label: string; content: string }) {
  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-200">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</span>
        <CopyButton text={content} />
      </div>
      <pre className="p-4 text-sm text-stone-700 whitespace-pre-wrap font-sans leading-relaxed max-h-80 overflow-y-auto">
        {content}
      </pre>
    </div>
  );
}

function GenerateButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <Button onClick={onClick} disabled={loading} className="bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white gap-2">
      {loading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} /> {label}</>}
    </Button>
  );
}

// ─── Tab 1: Weekly Brief ──────────────────────────────────────────────────────

function WeeklyBriefTab() {
  const { state, currentUser } = useApp();
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    setOutput('');
    const result = await generateWeeklyBrief({ state, currentUserId: currentUser.id });
    setOutput(result.text);
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-stone-800">Weekly Ministry Brief</h2>
        <p className="text-sm text-stone-500 mt-0.5">
          A snapshot of your ministry week — drawn from your live tasks, people care, sermons, prayer, and rhythm data.
        </p>
      </div>
      <Disclaimer />
      <GenerateButton onClick={handle} loading={loading} label="Generate This Week's Brief" />
      {output && <OutputBox label="Weekly Brief" content={output} />}
      {!output && !loading && (
        <div className="text-center py-10 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
          <Sparkles size={22} className="mx-auto mb-2 text-stone-300" />
          <p className="text-sm">Click generate to build your ministry brief from live data.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Notes → Tasks ────────────────────────────────────────────────────

function NotesToTasksTab() {
  const { addTask, currentUser } = useApp();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedTask[]>([]);
  const [summary, setSummary] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [added, setAdded] = useState(false);

  const handle = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    setExtracted([]);
    setSummary('');
    setSelected(new Set());
    setAdded(false);
    const result = await extractTasksFromNotes({ notes });
    setExtracted(result.tasks);
    setSummary(result.summary);
    setSelected(new Set(result.tasks.map((_, i) => i)));
    setLoading(false);
  };

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleAdd = () => {
    selected.forEach(i => {
      const t = extracted[i];
      if (!t) return;
      addTask({
        title: t.title,
        category: t.category,
        priority: t.priority,
        notes: t.notes,
        status: 'Todo',
        visibility: 'Private',
        createdBy: currentUser.id,
      });
    });
    setAdded(true);
  };

  const PLACEHOLDER = `Staff meeting notes, May 6

- Follow up with James Henderson family re: bereavement meal schedule
- Need to finalize Sunday sermon outline by Thursday
- Schedule hospital visit for Robert Keller this week
- Review summer internship program goals with Tyler
- Order communion supplies for the rest of May
- Reach out to Tom Whitfield — hasn't been in 8 weeks
- Prepare agenda for next staff meeting`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-stone-800">Notes to Tasks</h2>
        <p className="text-sm text-stone-500 mt-0.5">
          Paste meeting notes, sermon notes, or journal entries. The assistant will extract action items and suggest tasks.
        </p>
      </div>
      <Disclaimer />
      <Textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={8}
        className="resize-none text-sm font-mono"
      />
      <GenerateButton onClick={handle} loading={loading} label="Extract Tasks" />

      {summary && (
        <div className={cn(
          "flex items-center gap-2 text-sm px-4 py-3 rounded-xl border",
          extracted.length > 0 ? "bg-green-50 border-green-100 text-green-700" : "bg-stone-50 border-stone-200 text-stone-500"
        )}>
          <Sparkles size={13} />
          {summary}
        </div>
      )}

      {extracted.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Suggested Tasks — select to add</p>
          <div className="space-y-2">
            {extracted.map((task, i) => (
              <label
                key={i}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                  selected.has(i)
                    ? "bg-[#6aaa7e]/8 border-[#6aaa7e]/30"
                    : "bg-white border-stone-100 opacity-60"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  className="mt-0.5 accent-[#4f7c5f]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">{task.title}</p>
                  <div className="flex gap-1.5 mt-1">
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      task.priority === 'High' ? 'bg-red-100 text-red-600' :
                      task.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'
                    )}>{task.priority}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">{task.category}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {added ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
              <Check size={14} /> {selected.size} task{selected.size !== 1 ? 's' : ''} added to your board.
            </div>
          ) : (
            <Button
              onClick={handleAdd}
              disabled={selected.size === 0}
              className="bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white gap-2"
            >
              <Plus size={14} />
              Add {selected.size} Selected Task{selected.size !== 1 ? 's' : ''} to Board
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Follow-Up Draft ───────────────────────────────────────────────────

function FollowUpTab() {
  const { state, currentUser } = useApp();
  const [sourceType, setSourceType] = useState<'person' | 'prayer'>('person');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<{ subject: string; body: string } | null>(null);

  const people = state.people.filter(p =>
    p.status !== 'Archived' &&
    (p.createdBy === currentUser.id || p.visibility === 'Organization')
  );
  const prayers = state.prayerRequests.filter(p =>
    p.status === 'Active' &&
    (p.createdBy === currentUser.id || p.visibility === 'Organization')
  );

  const handle = async () => {
    if (!selectedId) return;
    setLoading(true);
    setOutput(null);

    let source: FollowUpSource;
    if (sourceType === 'person') {
      const person = people.find(p => p.id === selectedId);
      if (!person) { setLoading(false); return; }
      source = { type: 'person', data: person };
    } else {
      const prayer = prayers.find(p => p.id === selectedId);
      if (!prayer) { setLoading(false); return; }
      source = { type: 'prayer', data: prayer };
    }

    const result = await generateFollowUpMessage({
      source,
      senderName: currentUser.name,
      organization: state.settings.organizationName,
    });
    setOutput(result);
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-stone-800">Follow-Up Message Draft</h2>
        <p className="text-sm text-stone-500 mt-0.5">
          Select a person from People Care or a prayer request. The assistant will draft a warm, pastoral message you can send as-is or edit.
        </p>
      </div>
      <Disclaimer />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-1.5">Source</p>
          <div className="flex gap-2">
            {(['person', 'prayer'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setSourceType(t); setSelectedId(''); setOutput(null); }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                  sourceType === t
                    ? "bg-[#6aaa7e]/15 border-[#6aaa7e]/30 text-[#3d7a53]"
                    : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                )}
              >
                {t === 'person' ? '🤝 Person' : '🙏 Prayer Request'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-1.5">
            Select {sourceType === 'person' ? 'Person' : 'Prayer Request'}
          </p>
          <Select value={selectedId} onValueChange={v => { setSelectedId(v ?? ''); setOutput(null); }}>
            <SelectTrigger>
              <SelectValue placeholder={`Choose a ${sourceType === 'person' ? 'person' : 'request'}…`} />
            </SelectTrigger>
            <SelectContent>
              {(sourceType === 'person' ? people : prayers).map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {'name' in item ? item.name : item.personName}
                  {sourceType === 'person' && 'careCategory' in item ? ` — ${item.careCategory}` : ''}
                  {sourceType === 'prayer' && 'category' in item ? ` — ${item.category}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <GenerateButton onClick={handle} loading={loading} label="Draft Follow-Up Message" />

      {output && (
        <div className="space-y-3">
          <OutputBox label="Subject Line" content={output.subject} />
          <OutputBox label="Message Body" content={output.body} />
          <p className="text-xs text-stone-400 italic pl-1">
            This is a starting draft. Edit freely to match your voice and specific context before sending.
          </p>
        </div>
      )}

      {!output && !loading && (
        <div className="text-center py-10 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
          <MessageSquare size={22} className="mx-auto mb-2 text-stone-300" />
          <p className="text-sm">Select someone and generate a pastoral follow-up draft.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: Sermon Helper ─────────────────────────────────────────────────────

function SermonHelperTab() {
  const { state } = useApp();
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<SermonHelperOutput | null>(null);
  const [activeSection, setActiveSection] = useState<keyof SermonHelperOutput>('outline');

  const sermons = state.sermons.filter(s => s.status !== 'Preached');

  const handle = async () => {
    const sermon = sermons.find(s => s.id === selectedId);
    if (!sermon) return;
    setLoading(true);
    setOutput(null);
    const result = await generateSermonHelper({ sermon });
    setOutput(result);
    setLoading(false);
  };

  const SECTIONS: { key: keyof SermonHelperOutput; label: string }[] = [
    { key: 'outline', label: '📝 Outline' },
    { key: 'discussionQuestions', label: '💬 Discussion Qs' },
    { key: 'applicationIdeas', label: '⚡ Application' },
    { key: 'socialPost', label: '📱 Social Post' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-stone-800">Sermon Helper</h2>
        <p className="text-sm text-stone-500 mt-0.5">
          Select an upcoming sermon. The assistant will generate a structured outline, discussion questions, application ideas, and a social media post.
        </p>
      </div>
      <Disclaimer />

      <div>
        <p className="text-xs font-semibold text-stone-500 mb-1.5">Select Sermon</p>
        <Select value={selectedId} onValueChange={v => { setSelectedId(v ?? ''); setOutput(null); }}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a sermon…" />
          </SelectTrigger>
          <SelectContent>
            {sermons.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.title} — {s.status}{s.preachingDate ? ` · ${s.preachingDate}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {sermons.length === 0 && (
          <p className="text-xs text-stone-400 mt-1.5">No upcoming sermons found. Add one in the Sermons section.</p>
        )}
      </div>

      <GenerateButton onClick={handle} loading={loading} label="Generate Sermon Resources" />

      {output && (
        <div className="space-y-3">
          <div className="flex gap-1.5 flex-wrap">
            {SECTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                  activeSection === key
                    ? "bg-[#4f7c5f] text-white border-transparent"
                    : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <OutputBox
            label={SECTIONS.find(s => s.key === activeSection)?.label ?? activeSection}
            content={output[activeSection]}
          />
        </div>
      )}

      {!output && !loading && (
        <div className="text-center py-10 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
          <BookOpen size={22} className="mx-auto mb-2 text-stone-300" />
          <p className="text-sm">Select a sermon and generate prep resources.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'brief',   label: 'Weekly Brief',   icon: FileText,      shortLabel: 'Brief' },
  { id: 'notes',   label: 'Notes → Tasks',  icon: Plus,          shortLabel: 'Notes' },
  { id: 'followup',label: 'Follow-Up Draft',icon: MessageSquare, shortLabel: 'Follow-Up' },
  { id: 'sermon',  label: 'Sermon Helper',  icon: BookOpen,      shortLabel: 'Sermon' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AIAssistantView() {
  const [activeTab, setActiveTab] = useState<TabId>('brief');

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6aaa7e] to-[#4f7c5f] flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">AI Assistant</h1>
          <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Beta</span>
        </div>
        <p className="text-stone-500 text-sm">
          Pastoral tools powered by your live data. Simulated for MVP — real AI integration coming soon.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-sm font-medium transition-all",
              activeTab === id
                ? "bg-white text-stone-800 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Icon size={13} className="shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        {activeTab === 'brief'    && <WeeklyBriefTab />}
        {activeTab === 'notes'    && <NotesToTasksTab />}
        {activeTab === 'followup' && <FollowUpTab />}
        {activeTab === 'sermon'   && <SermonHelperTab />}
      </div>
    </div>
  );
}
