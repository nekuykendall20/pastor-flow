'use client';

import { useState } from 'react';
import { useApp } from '@/lib/supabase-context';
import { PrayerRequest, PrayerCategory, PrayerStatus, Visibility } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Plus, Search, X, Heart, CheckCircle, Lock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const CATEGORIES: PrayerCategory[] = [
  'Health', 'Family', 'Spiritual Growth', 'Grief',
  'Work/Financial', 'Church/Ministry', 'Other',
];

function categoryColor(c: PrayerCategory) {
  const map: Record<PrayerCategory, string> = {
    Health: 'bg-red-50 text-red-700',
    Family: 'bg-orange-50 text-orange-700',
    'Spiritual Growth': 'bg-purple-50 text-purple-700',
    Grief: 'bg-slate-100 text-slate-600',
    'Work/Financial': 'bg-amber-50 text-amber-700',
    'Church/Ministry': 'bg-teal-50 text-teal-700',
    Other: 'bg-stone-100 text-stone-600',
  };
  return map[c];
}

interface PrayerForm {
  personName: string;
  request: string;
  category: PrayerCategory;
  dateAdded: string;
  followUpDate: string;
  status: PrayerStatus;
  privateNotes: string;
  visibility: Visibility;
}

const EMPTY_FORM: PrayerForm = {
  personName: '',
  request: '',
  category: 'Other',
  dateAdded: format(new Date(), 'yyyy-MM-dd'),
  followUpDate: '',
  status: 'Active',
  privateNotes: '',
  visibility: 'Private',
};

function PrayerFormDialog({ open, onClose, initial, onSave, title }: {
  open: boolean; onClose: () => void; initial?: Partial<PrayerForm>;
  onSave: (data: PrayerForm) => void; title: string;
}) {
  const [form, setForm] = useState<PrayerForm>({ ...EMPTY_FORM, ...initial });
  const set = (k: keyof PrayerForm, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }));

  const handleSave = () => {
    if (!form.personName.trim() || !form.request.trim()) return;
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
            <Label className="text-stone-600 text-xs">Person / Name *</Label>
            <Input value={form.personName} onChange={e => set('personName', e.target.value)} placeholder="Who is this for?" className="mt-1" />
          </div>
          <div>
            <Label className="text-stone-600 text-xs">Prayer Request *</Label>
            <Textarea value={form.request} onChange={e => set('request', e.target.value)} placeholder="Describe the request..." className="mt-1 resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-stone-600 text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-600 text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Answered">Answered</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-stone-600 text-xs">Date Added</Label>
              <Input type="date" value={form.dateAdded} onChange={e => set('dateAdded', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-stone-600 text-xs">Follow-Up Date</Label>
              <Input type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-stone-600 text-xs">Visibility</Label>
            <Select value={form.visibility} onValueChange={v => set('visibility', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Private">Private (only you)</SelectItem>
                <SelectItem value="Organization">Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-stone-600 text-xs">Private Notes</Label>
            <Textarea value={form.privateNotes} onChange={e => set('privateNotes', e.target.value)} placeholder="Personal pastoral notes (always private)..." className="mt-1 resize-none" rows={2} />
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

function PrayerCard({ prayer, onEdit, onDelete, onMarkAnswered }: {
  prayer: PrayerRequest; onEdit: () => void; onDelete: () => void; onMarkAnswered: () => void;
}) {
  const isAnswered = prayer.status === 'Answered';

  return (
    <div className={cn(
      "rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md group",
      isAnswered
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
        : prayer.status === 'Archived' ? 'bg-stone-50 border-stone-100 opacity-60' : 'bg-white border-stone-100'
    )}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn("font-semibold", isAnswered ? 'text-amber-800' : 'text-stone-800')}>
              {prayer.personName}
            </h3>
            {isAnswered && <span className="text-amber-500 text-sm">🙏</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", categoryColor(prayer.category))}>
              {prayer.category}
            </span>
            {prayer.visibility === 'Private' ? (
              <span className="text-[10px] text-stone-400 flex items-center gap-0.5"><Lock size={9} /> Private</span>
            ) : (
              <span className="text-[10px] text-sky-500 flex items-center gap-0.5"><Globe size={9} /> Org</span>
            )}
          </div>
        </div>
        {isAnswered && (
          <div className="bg-amber-100 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle size={10} /> Answered
          </div>
        )}
      </div>

      <p className={cn("text-sm mb-3 leading-relaxed", isAnswered ? 'text-amber-700' : 'text-stone-600')}>
        {prayer.request}
      </p>

      {prayer.privateNotes && (
        <div className="bg-stone-50 rounded-lg p-2.5 mb-3 border border-stone-100">
          <p className="text-xs text-stone-500 italic">{prayer.privateNotes}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-100/50">
        <div>
          <span>Added {format(parseISO(prayer.dateAdded), 'MMM d, yyyy')}</span>
          {prayer.followUpDate && (
            <span className="ml-2">· Follow up {format(parseISO(prayer.followUpDate), 'MMM d')}</span>
          )}
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {prayer.status === 'Active' && (
            <button onClick={onMarkAnswered} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-200 font-medium transition-colors">
              Mark Answered
            </button>
          )}
          <button onClick={onEdit} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-1 rounded-lg hover:bg-stone-200">Edit</button>
          <button onClick={onDelete} className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-lg hover:bg-red-100">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function PrayerView() {
  const { myPrayers, state, addPrayer, editPrayer, removePrayer, currentUser } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PrayerRequest | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PrayerStatus | ''>('Active');
  const [filterCat, setFilterCat] = useState<string>('');

  const prayers = state.orgViewEnabled
    ? state.prayerRequests.filter(p => p.visibility === 'Organization' || p.createdBy === currentUser.id)
    : myPrayers;

  let filtered = prayers;
  if (search) filtered = filtered.filter(p => p.personName.toLowerCase().includes(search.toLowerCase()) || p.request.toLowerCase().includes(search.toLowerCase()));
  if (filterStatus) filtered = filtered.filter(p => p.status === filterStatus);
  if (filterCat) filtered = filtered.filter(p => p.category === filterCat);

  const active = prayers.filter(p => p.status === 'Active').length;
  const answered = prayers.filter(p => p.status === 'Answered').length;

  const handleAdd = (data: PrayerForm) => {
    addPrayer({
      personName: data.personName,
      request: data.request,
      category: data.category,
      dateAdded: data.dateAdded,
      followUpDate: data.followUpDate || undefined,
      status: data.status,
      privateNotes: data.privateNotes || undefined,
      visibility: data.visibility,
      createdBy: currentUser.id,
    });
  };

  const handleEdit = (prayer: PrayerRequest, data: PrayerForm) => {
    editPrayer(prayer.id, {
      personName: data.personName,
      request: data.request,
      category: data.category,
      dateAdded: data.dateAdded,
      followUpDate: data.followUpDate || undefined,
      status: data.status,
      privateNotes: data.privateNotes || undefined,
      visibility: data.visibility,
    });
  };

  interface PrayerForm {
    personName: string;
    request: string;
    category: PrayerCategory;
    dateAdded: string;
    followUpDate: string;
    status: PrayerStatus;
    privateNotes: string;
    visibility: Visibility;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Prayer</h1>
          <p className="text-stone-500 text-sm mt-0.5">Prayer requests and answers</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white gap-2">
          <Plus size={16} /> Add Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button onClick={() => setFilterStatus(filterStatus === 'Active' ? '' : 'Active')}
          className={cn("bg-white rounded-xl p-4 shadow-sm border text-left transition-all hover:shadow-md",
            filterStatus === 'Active' ? 'border-[#6aaa7e] ring-1 ring-[#6aaa7e]/20' : 'border-stone-100'
          )}>
          <p className="text-2xl font-bold text-stone-800">{active}</p>
          <p className="text-xs text-stone-500 mt-0.5">Active Requests</p>
        </button>
        <button onClick={() => setFilterStatus(filterStatus === 'Answered' ? '' : 'Answered')}
          className={cn("bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border text-left transition-all hover:shadow-md",
            filterStatus === 'Answered' ? 'border-amber-400' : 'border-amber-100'
          )}>
          <p className="text-2xl font-bold text-amber-700">{answered}</p>
          <p className="text-xs text-amber-600 mt-0.5">Answered 🙏</p>
        </button>
        <button onClick={() => setFilterStatus(filterStatus === 'Archived' ? '' : 'Archived')}
          className={cn("bg-white rounded-xl p-4 shadow-sm border text-left transition-all hover:shadow-md",
            filterStatus === 'Archived' ? 'border-stone-400' : 'border-stone-100'
          )}>
          <p className="text-2xl font-bold text-stone-500">{prayers.filter(p => p.status === 'Archived').length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Archived</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests..." className="pl-8 h-8 text-sm w-48" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X size={12} className="text-stone-400" /></button>}
        </div>
        <Select value={filterCat} onValueChange={v => setFilterCat(v ?? '')}>
          <SelectTrigger className="h-8 text-sm w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <Heart size={24} className="text-stone-400" />
          </div>
          <p className="font-medium text-stone-600">No prayer requests here</p>
          <p className="text-sm mt-1">Add a prayer request to begin</p>
          <Button onClick={() => setAddOpen(true)} className="mt-4 bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white">
            <Plus size={16} className="mr-2" /> Add Request
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(prayer => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              onEdit={() => setEditTarget(prayer)}
              onDelete={() => removePrayer(prayer.id)}
              onMarkAnswered={() => editPrayer(prayer.id, { status: 'Answered' })}
            />
          ))}
        </div>
      )}

      <PrayerFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} title="Add Prayer Request" />
      {editTarget && (
        <PrayerFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={{
            personName: editTarget.personName,
            request: editTarget.request,
            category: editTarget.category,
            dateAdded: editTarget.dateAdded,
            followUpDate: editTarget.followUpDate ?? '',
            status: editTarget.status,
            privateNotes: editTarget.privateNotes ?? '',
            visibility: editTarget.visibility,
          }}
          onSave={(data) => { handleEdit(editTarget, data as unknown as PrayerForm); setEditTarget(null); }}
          title="Edit Prayer Request"
        />
      )}
    </div>
  );
}
