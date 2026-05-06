'use client';

import { useState } from 'react';
import { useApp } from '@/lib/supabase-context';
import { Person, CareCategory, CareStatus, Visibility } from '@/lib/types';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { Plus, Search, X, CheckCircle, AlertCircle, Clock, Archive, Lock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const CARE_CATEGORIES: CareCategory[] = [
  'New Visitor', 'Hospital Visit', 'Grieving', 'Counseling',
  'Inactive Member', 'Volunteer Leader', 'General Follow-Up',
];
const CARE_STATUSES: CareStatus[] = ['Needs Attention', 'In Progress', 'Stable', 'Archived'];

function statusColor(s: CareStatus) {
  const map: Record<CareStatus, string> = {
    'Needs Attention': 'bg-red-100 text-red-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Stable': 'bg-green-100 text-green-700',
    'Archived': 'bg-stone-100 text-stone-500',
  };
  return map[s];
}

function categoryColor(c: CareCategory) {
  const map: Record<CareCategory, string> = {
    'New Visitor': 'bg-teal-50 text-teal-700',
    'Hospital Visit': 'bg-red-50 text-red-700',
    'Grieving': 'bg-purple-50 text-purple-700',
    'Counseling': 'bg-orange-50 text-orange-700',
    'Inactive Member': 'bg-amber-50 text-amber-700',
    'Volunteer Leader': 'bg-blue-50 text-blue-700',
    'General Follow-Up': 'bg-stone-50 text-stone-600',
  };
  return map[c];
}

function StatusIcon({ status }: { status: CareStatus }) {
  if (status === 'Needs Attention') return <AlertCircle size={14} className="text-red-500" />;
  if (status === 'In Progress') return <Clock size={14} className="text-blue-500" />;
  if (status === 'Stable') return <CheckCircle size={14} className="text-green-500" />;
  return <Archive size={14} className="text-stone-400" />;
}

interface PersonForm {
  name: string;
  careCategory: CareCategory;
  lastContactDate: string;
  nextFollowUpDate: string;
  notes: string;
  status: CareStatus;
  visibility: Visibility;
}

const EMPTY_FORM: PersonForm = {
  name: '',
  careCategory: 'General Follow-Up',
  lastContactDate: '',
  nextFollowUpDate: '',
  notes: '',
  status: 'Needs Attention',
  visibility: 'Private',
};

function PersonFormDialog({ open, onClose, initial, onSave, title }: {
  open: boolean; onClose: () => void; initial?: Partial<PersonForm>;
  onSave: (data: PersonForm) => void; title: string;
}) {
  const [form, setForm] = useState<PersonForm>({ ...EMPTY_FORM, ...initial });
  const set = (k: keyof PersonForm, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }));

  const handleSave = () => {
    if (!form.name.trim()) return;
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
            <Label className="text-stone-600 text-xs">Name *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Person's name..." className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-stone-600 text-xs">Care Category</Label>
              <Select value={form.careCategory} onValueChange={v => set('careCategory', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CARE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-600 text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CARE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-stone-600 text-xs">Last Contact</Label>
              <Input type="date" value={form.lastContactDate} onChange={e => set('lastContactDate', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-stone-600 text-xs">Next Follow-Up</Label>
              <Input type="date" value={form.nextFollowUpDate} onChange={e => set('nextFollowUpDate', e.target.value)} className="mt-1" />
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
            <Label className="text-stone-600 text-xs">Pastoral Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes about this person..." className="mt-1 resize-none" rows={4} />
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

function PersonCard({ person, onEdit, onDelete, onFollowUpDone }: {
  person: Person; onEdit: () => void; onDelete: () => void; onFollowUpDone: () => void;
}) {
  const isOverdue = person.nextFollowUpDate &&
    (isPast(parseISO(person.nextFollowUpDate)) || isToday(parseISO(person.nextFollowUpDate))) &&
    person.status !== 'Archived';

  return (
    <div className={cn(
      "bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md group",
      isOverdue ? 'border-amber-200' : 'border-stone-100',
      person.status === 'Archived' && 'opacity-60'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-sm shrink-0">
            {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-stone-800">{person.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", categoryColor(person.careCategory))}>
                {person.careCategory}
              </span>
              {person.visibility === 'Private' ? (
                <span className="text-[10px] text-stone-400 flex items-center gap-0.5"><Lock size={9} /> Private</span>
              ) : (
                <span className="text-[10px] text-sky-500 flex items-center gap-0.5"><Globe size={9} /> Org</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <StatusIcon status={person.status} />
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColor(person.status))}>
              {person.status}
            </span>
          </div>
        </div>
      </div>

      {person.notes && (
        <p className="text-sm text-stone-500 line-clamp-2 mb-3 italic">"{person.notes}"</p>
      )}

      <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-50">
        <div className="space-y-0.5">
          {person.lastContactDate && (
            <p>Last contact: <span className="text-stone-600">{format(parseISO(person.lastContactDate), 'MMM d, yyyy')}</span></p>
          )}
          {person.nextFollowUpDate && (
            <p className={cn(isOverdue && 'text-amber-600 font-medium')}>
              Follow-up: <span>{format(parseISO(person.nextFollowUpDate), 'MMM d, yyyy')}</span>
              {isOverdue && ' ⚠'}
            </p>
          )}
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {person.nextFollowUpDate && person.status !== 'Archived' && (
            <button onClick={onFollowUpDone} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors">
              ✓ Done
            </button>
          )}
          <button onClick={onEdit} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-1 rounded-lg hover:bg-stone-200">Edit</button>
          <button onClick={onDelete} className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-lg hover:bg-red-100">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function PeopleView() {
  const { myPeople, state, addPerson, editPerson, removePerson, currentUser } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const people = state.orgViewEnabled
    ? state.people.filter(p => p.visibility === 'Organization' || p.createdBy === currentUser.id)
    : myPeople;

  let filtered = people;
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (filterStatus) filtered = filtered.filter(p => p.status === filterStatus);

  const sortedPeople = [...filtered].sort((a, b) => {
    const aDate = a.nextFollowUpDate ?? 'zzz';
    const bDate = b.nextFollowUpDate ?? 'zzz';
    return aDate.localeCompare(bDate);
  });

  const handleAdd = (data: PersonForm) => {
    addPerson({
      name: data.name,
      careCategory: data.careCategory,
      lastContactDate: data.lastContactDate || undefined,
      nextFollowUpDate: data.nextFollowUpDate || undefined,
      notes: data.notes || undefined,
      status: data.status,
      visibility: data.visibility,
      createdBy: currentUser.id,
    });
  };

  const handleEdit = (person: Person, data: PersonForm) => {
    editPerson(person.id, {
      name: data.name,
      careCategory: data.careCategory,
      lastContactDate: data.lastContactDate || undefined,
      nextFollowUpDate: data.nextFollowUpDate || undefined,
      notes: data.notes || undefined,
      status: data.status,
      visibility: data.visibility,
    });
  };

  const handleFollowUpDone = (person: Person) => {
    editPerson(person.id, {
      lastContactDate: format(new Date(), 'yyyy-MM-dd'),
      nextFollowUpDate: undefined,
      status: person.status === 'Needs Attention' ? 'In Progress' : person.status,
    });
  };

  interface PersonForm {
    name: string;
    careCategory: CareCategory;
    lastContactDate: string;
    nextFollowUpDate: string;
    notes: string;
    status: CareStatus;
    visibility: Visibility;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">People Care</h1>
          <p className="text-stone-500 text-sm mt-0.5">Pastoral care and follow-up records</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white gap-2">
          <Plus size={16} /> Add Person
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {CARE_STATUSES.filter(s => s !== 'Archived').map(status => {
          const count = people.filter(p => p.status === status).length;
          return (
            <button key={status} onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
              className={cn("bg-white rounded-xl p-3 shadow-sm border text-left transition-all hover:shadow-md",
                filterStatus === status ? 'border-[#6aaa7e] ring-1 ring-[#6aaa7e]/20' : 'border-stone-100'
              )}>
              <p className="text-2xl font-bold text-stone-800">{count}</p>
              <p className="text-xs text-stone-500 mt-0.5">{status}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..." className="pl-8 h-8 text-sm w-48" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X size={12} className="text-stone-400" /></button>}
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v ?? '')}>
          <SelectTrigger className="h-8 text-sm w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {CARE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {sortedPeople.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤲</span>
          </div>
          <p className="font-medium text-stone-600">No people records yet</p>
          <p className="text-sm mt-1">Add someone to begin your pastoral care tracking</p>
          <Button onClick={() => setAddOpen(true)} className="mt-4 bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white">
            <Plus size={16} className="mr-2" /> Add First Person
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedPeople.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              onEdit={() => setEditTarget(person)}
              onDelete={() => removePerson(person.id)}
              onFollowUpDone={() => handleFollowUpDone(person)}
            />
          ))}
        </div>
      )}

      <PersonFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} title="Add Person" />
      {editTarget && (
        <PersonFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={{
            name: editTarget.name,
            careCategory: editTarget.careCategory,
            lastContactDate: editTarget.lastContactDate ?? '',
            nextFollowUpDate: editTarget.nextFollowUpDate ?? '',
            notes: editTarget.notes ?? '',
            status: editTarget.status,
            visibility: editTarget.visibility,
          }}
          onSave={(data) => { handleEdit(editTarget, data as unknown as PersonForm); setEditTarget(null); }}
          title="Edit Person"
        />
      )}
    </div>
  );
}
