'use client';

import { useState } from 'react';
import { useApp } from '@/lib/supabase-context';
import { Sermon, SermonStatus } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Plus, Search, X, BookOpen, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const STATUSES: SermonStatus[] = ['Idea', 'Researching', 'Outlining', 'Drafting', 'Ready', 'Preached'];
const STATUS_STEPS = STATUSES.length;

function statusPct(status: SermonStatus) {
  return Math.round(((STATUSES.indexOf(status) + 1) / STATUS_STEPS) * 100);
}

function statusColor(s: SermonStatus): string {
  const map: Record<SermonStatus, string> = {
    Idea: 'bg-stone-100 text-stone-600',
    Researching: 'bg-amber-100 text-amber-700',
    Outlining: 'bg-orange-100 text-orange-700',
    Drafting: 'bg-blue-100 text-blue-700',
    Ready: 'bg-green-100 text-green-700',
    Preached: 'bg-purple-100 text-purple-700',
  };
  return map[s];
}

interface SermonForm {
  title: string;
  scriptureText: string;
  seriesName: string;
  preachingDate: string;
  status: SermonStatus;
  bigIdea: string;
  notes: string;
}

const EMPTY_FORM: SermonForm = {
  title: '',
  scriptureText: '',
  seriesName: '',
  preachingDate: '',
  status: 'Idea',
  bigIdea: '',
  notes: '',
};

function SermonFormDialog({ open, onClose, initial, onSave, title }: {
  open: boolean; onClose: () => void; initial?: Partial<SermonForm>;
  onSave: (data: SermonForm) => void; title: string;
}) {
  const [form, setForm] = useState<SermonForm>({ ...EMPTY_FORM, ...initial });
  const set = (k: keyof SermonForm, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
    setForm(EMPTY_FORM);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-stone-800">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-stone-600 text-xs">Sermon Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Sermon title..." className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-stone-600 text-xs">Scripture Text</Label>
              <Input value={form.scriptureText} onChange={e => set('scriptureText', e.target.value)} placeholder="e.g. John 3:16" className="mt-1" />
            </div>
            <div>
              <Label className="text-stone-600 text-xs">Series Name</Label>
              <Input value={form.seriesName} onChange={e => set('seriesName', e.target.value)} placeholder="Series..." className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-stone-600 text-xs">Preaching Date</Label>
              <Input type="date" value={form.preachingDate} onChange={e => set('preachingDate', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-stone-600 text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-stone-600 text-xs">Big Idea (Central Message)</Label>
            <Input value={form.bigIdea} onChange={e => set('bigIdea', e.target.value)} placeholder="One sentence..." className="mt-1" />
          </div>
          <div>
            <Label className="text-stone-600 text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Outline, illustrations, points..." className="mt-1 resize-none" rows={4} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} className="flex-1 bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white">Save</Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SermonCard({ sermon, onEdit, onDelete, onAdvance }: {
  sermon: Sermon; onEdit: () => void; onDelete: () => void; onAdvance: () => void;
}) {
  const pct = statusPct(sermon.status);
  const nextStatus = STATUSES[STATUSES.indexOf(sermon.status) + 1];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColor(sermon.status))}>
              {sermon.status}
            </span>
            {sermon.seriesName && (
              <span className="text-[10px] text-stone-400 truncate">{sermon.seriesName}</span>
            )}
          </div>
          <h3 className="font-semibold text-stone-800 leading-snug">{sermon.title}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
        {sermon.scriptureText && (
          <span className="flex items-center gap-1">
            <BookOpen size={11} /> {sermon.scriptureText}
          </span>
        )}
        {sermon.preachingDate && (
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {format(parseISO(sermon.preachingDate), 'MMMM d, yyyy')}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-stone-400 mb-1">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="flex gap-1">
          {STATUSES.map((s, i) => (
            <div key={s} className={cn(
              "flex-1 h-1.5 rounded-full transition-all",
              STATUSES.indexOf(sermon.status) >= i ? 'bg-[#6aaa7e]' : 'bg-stone-100'
            )} title={s} />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-stone-300 mt-0.5">
          <span>Idea</span>
          <span>Preached</span>
        </div>
      </div>

      {sermon.bigIdea && (
        <p className="text-xs text-stone-500 italic border-l-2 border-purple-200 pl-3 mb-3 line-clamp-2">
          "{sermon.bigIdea}"
        </p>
      )}

      {sermon.notes && (
        <p className="text-xs text-stone-400 line-clamp-2 mb-3">{sermon.notes}</p>
      )}

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-stone-50">
        {nextStatus && (
          <button onClick={onAdvance} className="text-[10px] bg-[#6aaa7e]/15 text-[#3d7a53] px-2.5 py-1 rounded-lg hover:bg-[#6aaa7e]/25 font-medium transition-colors">
            → {nextStatus}
          </button>
        )}
        <button onClick={onEdit} className="text-[10px] bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg hover:bg-stone-200 ml-auto transition-colors">Edit</button>
        <button onClick={onDelete} className="text-[10px] bg-red-50 text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
      </div>
    </div>
  );
}

export default function SermonView() {
  const { state, addSermon, editSermon, removeSermon, currentUser } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sermon | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  let sermons = [...state.sermons];
  if (search) sermons = sermons.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.seriesName?.toLowerCase().includes(search.toLowerCase()));
  if (filterStatus) sermons = sermons.filter(s => s.status === filterStatus);
  sermons.sort((a, b) => (a.preachingDate ?? 'zzz').localeCompare(b.preachingDate ?? 'zzz'));

  const handleAdd = (data: SermonForm) => {
    addSermon({
      title: data.title,
      scriptureText: data.scriptureText || undefined,
      seriesName: data.seriesName || undefined,
      preachingDate: data.preachingDate || undefined,
      status: data.status,
      bigIdea: data.bigIdea || undefined,
      notes: data.notes || undefined,
      createdBy: currentUser.id,
    });
  };

  const handleEdit = (sermon: Sermon, data: SermonForm) => {
    editSermon(sermon.id, {
      title: data.title,
      scriptureText: data.scriptureText || undefined,
      seriesName: data.seriesName || undefined,
      preachingDate: data.preachingDate || undefined,
      status: data.status,
      bigIdea: data.bigIdea || undefined,
      notes: data.notes || undefined,
    });
  };

  const handleAdvance = (sermon: Sermon) => {
    const nextIdx = STATUSES.indexOf(sermon.status) + 1;
    if (nextIdx < STATUSES.length) {
      editSermon(sermon.id, { status: STATUSES[nextIdx] });
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-800">Sermons</h1>
          <p className="text-stone-500 text-sm mt-0.5">Sermon planning and preparation workspace</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white gap-2">
          <Plus size={16} /> Add Sermon
        </Button>
      </div>

      {/* Status Summary */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map(s => {
          const count = state.sermons.filter(sr => sr.status === s).length;
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                filterStatus === s ? 'ring-1 ring-stone-400' : '',
                statusColor(s)
              )}>
              {s} <span className="font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sermons..." className="pl-8 h-8 text-sm w-52" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X size={12} className="text-stone-400" /></button>}
        </div>
      </div>

      {sermons.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-stone-400" />
          </div>
          <p className="font-medium text-stone-600">No sermons yet</p>
          <p className="text-sm mt-1">Start planning your next message</p>
          <Button onClick={() => setAddOpen(true)} className="mt-4 bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white">
            <Plus size={16} className="mr-2" /> Add First Sermon
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sermons.map(sermon => (
            <SermonCard
              key={sermon.id}
              sermon={sermon}
              onEdit={() => setEditTarget(sermon)}
              onDelete={() => removeSermon(sermon.id)}
              onAdvance={() => handleAdvance(sermon)}
            />
          ))}
        </div>
      )}

      <SermonFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} title="Add Sermon" />
      {editTarget && (
        <SermonFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={{
            title: editTarget.title,
            scriptureText: editTarget.scriptureText ?? '',
            seriesName: editTarget.seriesName ?? '',
            preachingDate: editTarget.preachingDate ?? '',
            status: editTarget.status,
            bigIdea: editTarget.bigIdea ?? '',
            notes: editTarget.notes ?? '',
          }}
          onSave={(data) => { handleEdit(editTarget, data); setEditTarget(null); }}
          title="Edit Sermon"
        />
      )}
    </div>
  );
}
