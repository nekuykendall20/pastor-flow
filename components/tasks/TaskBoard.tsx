'use client';

import { useState } from 'react';
import { useApp } from '@/lib/supabase-context';
import { Task, TaskStatus, TaskCategory, TaskPriority, Visibility } from '@/lib/types';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { Plus, Search, Filter, X, ChevronDown, GripVertical, Flag, Lock, Globe, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'Todo', label: 'To Do', color: 'bg-stone-100 text-stone-600' },
  { status: 'In Progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { status: 'Waiting', label: 'Waiting', color: 'bg-amber-100 text-amber-700' },
  { status: 'Completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
];

const CATEGORIES: TaskCategory[] = ['Admin', 'Sermon', 'Care', 'Staff', 'Sunday Service', 'Personal'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];

function priorityColor(p: TaskPriority) {
  return p === 'High' ? 'bg-red-100 text-red-700' : p === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500';
}

function categoryColor(c: TaskCategory) {
  const map: Record<TaskCategory, string> = {
    Admin: 'bg-slate-100 text-slate-600',
    Sermon: 'bg-purple-100 text-purple-700',
    Care: 'bg-rose-100 text-rose-700',
    Staff: 'bg-blue-100 text-blue-700',
    'Sunday Service': 'bg-orange-100 text-orange-700',
    Personal: 'bg-teal-100 text-teal-700',
  };
  return map[c];
}

function UserAvatar({ userId }: { userId?: string }) {
  const { users } = useApp();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  return (
    <span
      className="w-6 h-6 rounded-full inline-flex items-center justify-center text-white text-[10px] font-bold shrink-0"
      style={{ backgroundColor: user.color }}
      title={user.name}
    >
      {user.initials}
    </span>
  );
}

interface TaskFormData {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
  notes: string;
  status: TaskStatus;
  visibility: Visibility;
  assignedTo: string;
}

const EMPTY_FORM: TaskFormData = {
  title: '',
  category: 'Admin',
  priority: 'Medium',
  dueDate: '',
  notes: '',
  status: 'Todo',
  visibility: 'Organization',
  assignedTo: '',
};

function TaskFormDialog({
  open, onClose, initial, onSave, title, currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<TaskFormData>;
  onSave: (data: TaskFormData) => void;
  title: string;
  currentUserId: string;
}) {
  const { users } = useApp();
  const [form, setForm] = useState<TaskFormData>({ ...EMPTY_FORM, ...initial });
  const set = (k: keyof TaskFormData, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }));

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
            <Label className="text-stone-600 text-xs">Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title..." className="mt-1" />
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
              <Label className="text-stone-600 text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-stone-600 text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLUMNS.map(c => <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-600 text-xs">Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-stone-600 text-xs">Visibility</Label>
              <Select value={form.visibility} onValueChange={v => set('visibility', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-600 text-xs">Assign To</Label>
              <Select value={form.assignedTo} onValueChange={v => set('assignedTo', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-stone-600 text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Add notes..." className="mt-1 resize-none" rows={3} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} className="flex-1 bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white">Save Task</Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskCard({ task, onEdit, onDelete, onMove, currentUserId, currentUserRole }: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (status: TaskStatus) => void;
  currentUserId: string;
  currentUserRole: string;
}) {
  const { editTask } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && task.status !== 'Completed';
  const canEdit = currentUserRole === 'owner' || task.createdBy === currentUserId || task.assignedTo === currentUserId || task.claimedBy === currentUserId;

  const handleClaim = () => editTask(task.id, { claimedBy: currentUserId });
  const handleUnclaim = () => editTask(task.id, { claimedBy: undefined });

  return (
    <div className={cn(
      "bg-white rounded-xl p-3.5 shadow-sm border transition-all hover:shadow-md group",
      task.status === 'Completed' ? 'border-stone-100 opacity-60' : 'border-stone-100',
      isOverdue && 'border-red-200 bg-red-50/30'
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={cn("text-sm font-medium text-stone-800 leading-snug flex-1", task.status === 'Completed' && 'line-through text-stone-400')}>
          {task.title}
        </p>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-stone-100 transition-all">
            <ChevronDown size={13} className="text-stone-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 bg-white border border-stone-200 rounded-xl shadow-xl z-20 py-1 min-w-[140px]" onMouseLeave={() => setMenuOpen(false)}>
              {canEdit && <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-stone-50">Edit</button>}
              {COLUMNS.filter(c => c.status !== task.status).map(c => (
                <button key={c.status} onClick={() => { onMove(c.status); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-stone-50">
                  Move to {c.label}
                </button>
              ))}
              {task.visibility === 'Organization' && !task.claimedBy && !task.assignedTo && (
                <button onClick={() => { handleClaim(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50">Claim Task</button>
              )}
              {task.claimedBy === currentUserId && (
                <button onClick={() => { handleUnclaim(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs text-stone-500 hover:bg-stone-50">Unclaim</button>
              )}
              {(currentUserRole === 'owner' || task.createdBy === currentUserId) && (
                <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50">Delete</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", priorityColor(task.priority))}>
          {task.priority}
        </span>
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", categoryColor(task.category))}>
          {task.category}
        </span>
        {task.visibility === 'Private' ? (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 flex items-center gap-1">
            <Lock size={9} /> Private
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 flex items-center gap-1">
            <Globe size={9} /> Org
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <span className={cn("text-[10px] text-stone-400", isOverdue && 'text-red-500 font-medium')}>
              {isOverdue ? '⚠ ' : ''}{format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.visibility === 'Organization' && !task.claimedBy && !task.assignedTo && (
            <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <UserCheck size={9} /> Available
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {task.assignedTo && <UserAvatar userId={task.assignedTo} />}
          {task.claimedBy && task.claimedBy !== task.assignedTo && <UserAvatar userId={task.claimedBy} />}
        </div>
      </div>
    </div>
  );
}

export default function TaskBoard() {
  const { state, myTasks, addTask, editTask, removeTask, currentUser } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [filterPri, setFilterPri] = useState<string>('');
  const [mobileCol, setMobileCol] = useState<TaskStatus>('Todo');

  const canCreate = true;

  let tasks = state.orgViewEnabled ? state.tasks.filter(t => {
    if (t.visibility === 'Organization') return true;
    if (t.createdBy === currentUser.id || t.assignedTo === currentUser.id || t.claimedBy === currentUser.id) return true;
    return false;
  }) : myTasks;

  if (search) tasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.notes?.toLowerCase().includes(search.toLowerCase()));
  if (filterCat) tasks = tasks.filter(t => t.category === filterCat);
  if (filterPri) tasks = tasks.filter(t => t.priority === filterPri);

  const getColumnTasks = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const handleAdd = (data: TaskFormData) => {
    addTask({
      title: data.title,
      category: data.category,
      priority: data.priority,
      dueDate: data.dueDate || undefined,
      notes: data.notes || undefined,
      status: data.status,
      visibility: data.visibility,
      createdBy: currentUser.id,
      assignedTo: data.assignedTo || undefined,
    });
  };

  const handleEdit = (task: Task, data: TaskFormData) => {
    editTask(task.id, {
      title: data.title,
      category: data.category,
      priority: data.priority,
      dueDate: data.dueDate || undefined,
      notes: data.notes || undefined,
      status: data.status,
      visibility: data.visibility,
      assignedTo: data.assignedTo || undefined,
    });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-800">Tasks</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {state.orgViewEnabled ? 'Organization view' : 'My tasks'}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white gap-2">
          <Plus size={16} /> <span className="hidden sm:inline">Add Task</span><span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-8 h-8 text-sm w-40 md:w-48" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X size={12} className="text-stone-400" /></button>}
        </div>
        <Select value={filterCat} onValueChange={v => setFilterCat(v ?? '')}>
          <SelectTrigger className="h-8 text-sm w-32 md:w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPri} onValueChange={v => setFilterPri(v ?? '')}>
          <SelectTrigger className="h-8 text-sm w-28 md:w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priorities</SelectItem>
            {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterCat || filterPri) && (
          <button onClick={() => { setFilterCat(''); setFilterPri(''); }} className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* ── Mobile: tab selector + single-column list ── */}
      <div className="md:hidden flex flex-col flex-1 min-h-0">
        {/* Column tabs */}
        <div className="flex border-b border-stone-200 mb-3 shrink-0">
          {COLUMNS.map(col => (
            <button
              key={col.status}
              onClick={() => setMobileCol(col.status)}
              className={cn(
                'flex-1 py-2.5 text-xs font-medium text-center transition-colors',
                mobileCol === col.status
                  ? 'text-[#4f7c5f] border-b-2 border-[#4f7c5f]'
                  : 'text-stone-400 hover:text-stone-600'
              )}
            >
              {col.label}
              <span className={cn(
                'ml-1 text-[10px] px-1.5 py-0.5 rounded-full',
                mobileCol === col.status ? 'bg-[#4f7c5f]/10 text-[#4f7c5f]' : 'bg-stone-100 text-stone-400'
              )}>
                {getColumnTasks(col.status).length}
              </span>
            </button>
          ))}
        </div>

        {/* Single column task list */}
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="space-y-2.5">
            {getColumnTasks(mobileCol).length === 0 ? (
              <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center mt-4">
                <p className="text-sm text-stone-300">No tasks here</p>
              </div>
            ) : (
              getColumnTasks(mobileCol).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentUserId={currentUser.id}
                  currentUserRole={currentUser.role}
                  onEdit={() => setEditTarget(task)}
                  onDelete={() => removeTask(task.id)}
                  onMove={(status) => editTask(task.id, { status })}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop: Kanban Board ── */}
      <div className="hidden md:flex gap-4 flex-1 overflow-x-auto pb-4 min-h-0">
        {COLUMNS.map(col => {
          const colTasks = getColumnTasks(col.status);
          return (
            <div key={col.status} className="flex-1 min-w-[240px] max-w-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", col.color)}>
                    {col.label}
                  </span>
                  <span className="text-xs text-stone-400 font-medium">{colTasks.length}</span>
                </div>
                <button onClick={() => setAddOpen(true)} className="text-stone-300 hover:text-stone-500 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-stone-300">No tasks here</p>
                  </div>
                ) : (
                  colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUserId={currentUser.id}
                      currentUserRole={currentUser.role}
                      onEdit={() => setEditTarget(task)}
                      onDelete={() => removeTask(task.id)}
                      onMove={(status) => editTask(task.id, { status })}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
        title="Add Task"
        currentUserId={currentUser.id}
      />

      {editTarget && (
        <TaskFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={{
            title: editTarget.title,
            category: editTarget.category,
            priority: editTarget.priority,
            dueDate: editTarget.dueDate ?? '',
            notes: editTarget.notes ?? '',
            status: editTarget.status,
            visibility: editTarget.visibility,
            assignedTo: editTarget.assignedTo ?? '',
          }}
          onSave={(data) => handleEdit(editTarget, data)}
          title="Edit Task"
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}
