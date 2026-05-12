'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User as SupabaseUser, RealtimeChannel } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { loadState, saveState, USERS as SEEDED_USERS } from '@/lib/storage';
import type {
  AppState, Task, Person, Sermon, PrayerRequest,
  RhythmItem, WeeklyRhythm, OrgSettings, User,
  TaskCategory, TaskPriority, TaskStatus, Visibility,
  CareCategory, CareStatus, SermonStatus, PrayerCategory, PrayerStatus,
} from './types';
import { DEFAULT_TASK_CATEGORIES } from './types';
import type { Database } from './database.types';
import { format, startOfWeek, endOfWeek } from 'date-fns';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrgRow = Database['public']['Tables']['organizations']['Row'];
type TaskRow = Database['public']['Tables']['tasks']['Row'];
type PersonRow = Database['public']['Tables']['people_care']['Row'];
type SermonRow = Database['public']['Tables']['sermons']['Row'];
type PrayerRow = Database['public']['Tables']['prayer_requests']['Row'];
type RhythmRow = Database['public']['Tables']['rhythm_items']['Row'];
type CompletionRow = Database['public']['Tables']['rhythm_completions']['Row'];

// ─── Type converters ──────────────────────────────────────────────────────────

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    category: r.category as TaskCategory,
    priority: r.priority as TaskPriority,
    status: r.status as TaskStatus,
    visibility: r.visibility as Visibility,
    dueDate: r.due_date ?? undefined,
    notes: r.notes ?? undefined,
    createdBy: r.created_by,
    assignedTo: r.assigned_to ?? undefined,
    claimedBy: r.claimed_by ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToPerson(r: PersonRow): Person {
  return {
    id: r.id,
    name: r.name,
    careCategory: r.care_category as CareCategory,
    lastContactDate: r.last_contact_date ?? undefined,
    nextFollowUpDate: r.next_follow_up_date ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status as CareStatus,
    visibility: r.visibility as Visibility,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToSermon(r: SermonRow): Sermon {
  return {
    id: r.id,
    title: r.title,
    scriptureText: r.scripture_text ?? undefined,
    seriesName: r.series_name ?? undefined,
    preachingDate: r.preaching_date ?? undefined,
    status: r.status as SermonStatus,
    bigIdea: r.big_idea ?? undefined,
    notes: r.notes ?? undefined,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToPrayer(r: PrayerRow): PrayerRequest {
  return {
    id: r.id,
    personName: r.person_name,
    request: r.request,
    category: r.category as PrayerCategory,
    dateAdded: r.date_added,
    followUpDate: r.follow_up_date ?? undefined,
    status: r.status as PrayerStatus,
    privateNotes: r.private_notes ?? undefined,
    visibility: r.visibility as Visibility,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToRhythmItem(r: RhythmRow, completedDates: string[]): RhythmItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    dayOfWeek: r.day_of_week ?? undefined,
    isRecurring: r.is_recurring,
    completedDates,
  };
}

function profileToUser(p: ProfileRow): User {
  return {
    id: p.id,
    name: p.name,
    role: p.role as User['role'],
    title: p.title,
    initials: p.initials,
    color: p.color,
  };
}

function generateId() {
  return crypto.randomUUID();
}

// ─── Context interface ────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  users: User[];
  currentUser: User;

  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setCurrentUser: (userId: string) => void;
  setOrgView: (enabled: boolean) => void;

  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;

  addPerson: (data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editPerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;

  addSermon: (data: Omit<Sermon, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editSermon: (id: string, updates: Partial<Sermon>) => void;
  removeSermon: (id: string) => void;

  addPrayer: (data: Omit<PrayerRequest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editPrayer: (id: string, updates: Partial<PrayerRequest>) => void;
  removePrayer: (id: string) => void;

  toggleRhythm: (itemId: string) => void;
  addRhythmItem: (title: string, description?: string) => void;
  removeRhythmItem: (id: string) => void;

  saveSettings: (updates: Partial<OrgSettings>) => void;

  myTasks: Task[];
  myPeople: Person[];
  myPrayers: PrayerRequest[];

  // Supabase-specific additions
  profile: ProfileRow | null;
  organization: OrgRow | null;
  orgMembers: User[];
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Visibility helpers ───────────────────────────────────────────────────────

function visibleTasks(state: AppState, userId: string): Task[] {
  if (state.orgViewEnabled) return state.tasks;
  return state.tasks.filter(t => t.visibility === 'Organization' || t.createdBy === userId || t.assignedTo === userId || t.claimedBy === userId);
}

function visiblePeople(state: AppState, userId: string): Person[] {
  if (state.orgViewEnabled) return state.people;
  return state.people.filter(p => p.visibility === 'Organization' || p.createdBy === userId);
}

function visiblePrayers(state: AppState, userId: string): PrayerRequest[] {
  if (state.orgViewEnabled) return state.prayerRequests;
  return state.prayerRequests.filter(p => p.visibility === 'Organization' || p.createdBy === userId);
}

// ─── Demo mode (no Supabase configured) ──────────────────────────────────────

function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); setState(loadState()); }, []);
  useEffect(() => { if (hydrated) saveState(state); }, [state, hydrated]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState(prev => fn(prev)), []);
  const currentUser = SEEDED_USERS.find(u => u.id === state.currentUserId) ?? SEEDED_USERS[0];
  const now = () => new Date().toISOString();

  const value: AppContextValue = {
    state, users: SEEDED_USERS, currentUser, setState,
    setCurrentUser: (userId) => update(s => ({ ...s, currentUserId: userId })),
    setOrgView: (enabled) => update(s => ({ ...s, orgViewEnabled: enabled })),
    addTask: (data) => update(s => ({ ...s, tasks: [{ ...data, id: generateId(), createdAt: now(), updatedAt: now() }, ...s.tasks] })),
    editTask: (id, updates) => update(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: now() } : t) })),
    removeTask: (id) => update(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) })),
    addPerson: (data) => update(s => ({ ...s, people: [...s.people, { ...data, id: generateId(), createdAt: now(), updatedAt: now() }] })),
    editPerson: (id, updates) => update(s => ({ ...s, people: s.people.map(p => p.id === id ? { ...p, ...updates, updatedAt: now() } : p) })),
    removePerson: (id) => update(s => ({ ...s, people: s.people.filter(p => p.id !== id) })),
    addSermon: (data) => update(s => ({ ...s, sermons: [{ ...data, id: generateId(), createdAt: now(), updatedAt: now() }, ...s.sermons] })),
    editSermon: (id, updates) => update(s => ({ ...s, sermons: s.sermons.map(sr => sr.id === id ? { ...sr, ...updates, updatedAt: now() } : sr) })),
    removeSermon: (id) => update(s => ({ ...s, sermons: s.sermons.filter(sr => sr.id !== id) })),
    addPrayer: (data) => update(s => ({ ...s, prayerRequests: [{ ...data, id: generateId(), createdAt: now(), updatedAt: now() }, ...s.prayerRequests] })),
    editPrayer: (id, updates) => update(s => ({ ...s, prayerRequests: s.prayerRequests.map(p => p.id === id ? { ...p, ...updates, updatedAt: now() } : p) })),
    removePrayer: (id) => update(s => ({ ...s, prayerRequests: s.prayerRequests.filter(p => p.id !== id) })),
    toggleRhythm: (itemId) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      update(s => {
        const done = s.weeklyRhythm.completedItems.includes(itemId);
        return {
          ...s,
          weeklyRhythm: { ...s.weeklyRhythm, completedItems: done ? s.weeklyRhythm.completedItems.filter(i => i !== itemId) : [...s.weeklyRhythm.completedItems, itemId] },
          rhythmItems: s.rhythmItems.map(r => r.id !== itemId ? r : { ...r, completedDates: done ? r.completedDates.filter(d => d !== today) : [...r.completedDates, today] }),
        };
      });
    },
    addRhythmItem: (title, description) => update(s => ({ ...s, rhythmItems: [...s.rhythmItems, { id: generateId(), title, description, isRecurring: true, completedDates: [] }] })),
    removeRhythmItem: (id) => update(s => ({ ...s, rhythmItems: s.rhythmItems.filter(r => r.id !== id), weeklyRhythm: { ...s.weeklyRhythm, completedItems: s.weeklyRhythm.completedItems.filter(i => i !== id) } })),
    saveSettings: (updates) => update(s => ({ ...s, settings: { ...s.settings, ...updates } })),
    get myTasks() { return visibleTasks(state, state.currentUserId); },
    get myPeople() { return visiblePeople(state, state.currentUserId); },
    get myPrayers() { return visiblePrayers(state, state.currentUserId); },
    profile: null,
    organization: null,
    orgMembers: SEEDED_USERS,
    isLoading: false,
    signOut: async () => {},
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return <DemoProvider>{children}</DemoProvider>;
  }
  return <SupabaseProvider>{children}</SupabaseProvider>;
}

function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const realtimeRef = useRef<RealtimeChannel | null>(null);

  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [organization, setOrganization] = useState<OrgRow | null>(null);
  const [orgMembers, setOrgMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const defaultState: AppState = {
    tasks: [],
    people: [],
    sermons: [],
    prayerRequests: [],
    rhythmItems: [],
    weeklyRhythm: { weekOf: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'), completedItems: [] },
    currentUserId: '',
    orgViewEnabled: false,
    settings: { organizationName: 'My Church', theme: 'light', taskCategories: DEFAULT_TASK_CATEGORIES },
  };

  const [state, setState] = useState<AppState>(defaultState);

  // ── Auth listener ──
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => setSupabaseUser(data.user));
    return () => subscription.unsubscribe();
  }, []);

  // ── Load all data when user is known ──
  useEffect(() => {
    if (!supabaseUser) {
      setState(defaultState);
      setProfile(null);
      setOrganization(null);
      setOrgMembers([]);
      setIsLoading(false);
      return;
    }
    loadAll(supabaseUser.id);
  }, [supabaseUser?.id]);

  async function loadAll(userId: string) {
    setIsLoading(true);

    const [profileRes, tasksRes, peopleRes, sermonsRes, prayersRes, rhythmRes, completionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('people_care').select('*').order('name'),
      supabase.from('sermons').select('*').order('created_at', { ascending: false }),
      supabase.from('prayer_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('rhythm_items').select('*').eq('profile_id', userId).order('created_at'),
      supabase.from('rhythm_completions').select('*').eq('profile_id', userId),
    ]);

    const prof = profileRes.data;
    setProfile(prof);

    let org: OrgRow | null = null;
    let members: User[] = [];

    if (prof?.organization_id) {
      const [orgRes, membersRes] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', prof.organization_id).single(),
        supabase.from('profiles').select('*').eq('organization_id', prof.organization_id),
      ]);
      org = orgRes.data;
      members = (membersRes.data ?? []).map(profileToUser);
    }
    setOrganization(org);
    setOrgMembers(members);

    const completions: CompletionRow[] = completionsRes.data ?? [];
    const completionsByItem: Record<string, string[]> = {};
    for (const c of completions) {
      if (!completionsByItem[c.rhythm_item_id]) completionsByItem[c.rhythm_item_id] = [];
      completionsByItem[c.rhythm_item_id].push(c.completed_date);
    }

    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
    const thisWeekCompleted = completions
      .filter(c => c.completed_date >= weekStart && c.completed_date <= weekEnd)
      .map(c => c.rhythm_item_id);

    setState({
      tasks: (tasksRes.data ?? []).map(rowToTask),
      people: (peopleRes.data ?? []).map(rowToPerson),
      sermons: (sermonsRes.data ?? []).map(rowToSermon),
      prayerRequests: (prayersRes.data ?? []).map(rowToPrayer),
      rhythmItems: (rhythmRes.data ?? []).map(r => rowToRhythmItem(r, completionsByItem[r.id] ?? [])),
      weeklyRhythm: { weekOf: weekStart, completedItems: thisWeekCompleted },
      currentUserId: userId,
      orgViewEnabled: false,
      settings: {
        organizationName: org?.name ?? 'My Church',
        theme: 'light',
        taskCategories: (org?.task_categories && org.task_categories.length > 0)
          ? org.task_categories
          : DEFAULT_TASK_CATEGORIES,
      },
    });

    setIsLoading(false);
    subscribeToTasks(prof?.organization_id ?? null);
  }

  function subscribeToTasks(orgId: string | null) {
    if (realtimeRef.current) realtimeRef.current.unsubscribe();
    if (!orgId) return;

    realtimeRef.current = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `organization_id=eq.${orgId}` },
        payload => {
          setState(prev => {
            if (payload.eventType === 'INSERT') {
              const newTask = rowToTask(payload.new as TaskRow);
              if (prev.tasks.find(t => t.id === newTask.id)) return prev;
              return { ...prev, tasks: [newTask, ...prev.tasks] };
            }
            if (payload.eventType === 'UPDATE') {
              return { ...prev, tasks: prev.tasks.map(t => t.id === payload.new.id ? rowToTask(payload.new as TaskRow) : t) };
            }
            if (payload.eventType === 'DELETE') {
              return { ...prev, tasks: prev.tasks.filter(t => t.id !== payload.old.id) };
            }
            return prev;
          });
        }
      )
      .subscribe();
  }

  useEffect(() => {
    return () => { realtimeRef.current?.unsubscribe(); };
  }, []);

  // ── Helpers ──
  const currentUser: User = profile
    ? profileToUser(profile)
    : { id: '', name: 'Loading…', role: 'staff', title: '', initials: '…', color: '#6aaa7e' };

  const users = orgMembers.length > 0 ? orgMembers : (profile ? [profileToUser(profile)] : []);

  // ── Task actions ──
  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!profile?.organization_id) return;
    const now = new Date().toISOString();
    const id = generateId();
    const task: Task = { ...data, id, createdAt: now, updatedAt: now };
    setState(prev => ({ ...prev, tasks: [task, ...prev.tasks] }));
    supabase.from('tasks').insert({
      id,
      organization_id: profile.organization_id!,
      title: data.title,
      category: data.category,
      priority: data.priority,
      status: data.status,
      visibility: data.visibility,
      due_date: data.dueDate ?? null,
      notes: data.notes ?? null,
      created_by: data.createdBy,
      assigned_to: data.assignedTo ?? null,
      claimed_by: data.claimedBy ?? null,
    });
  }, [profile]);

  const editTask = useCallback((id: string, updates: Partial<Task>) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: now } : t),
    }));
    supabase.from('tasks').update({
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.visibility !== undefined && { visibility: updates.visibility }),
      ...(updates.dueDate !== undefined && { due_date: updates.dueDate }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.assignedTo !== undefined && { assigned_to: updates.assignedTo }),
      ...(updates.claimedBy !== undefined && { claimed_by: updates.claimedBy }),
      updated_at: now,
    }).eq('id', id);
  }, []);

  const removeTask = useCallback((id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    supabase.from('tasks').delete().eq('id', id);
  }, []);

  // ── People actions ──
  const addPerson = useCallback((data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!profile?.organization_id) return;
    const now = new Date().toISOString();
    const id = generateId();
    const person: Person = { ...data, id, createdAt: now, updatedAt: now };
    setState(prev => ({ ...prev, people: [...prev.people, person] }));
    supabase.from('people_care').insert({
      id,
      organization_id: profile.organization_id!,
      name: data.name,
      care_category: data.careCategory,
      last_contact_date: data.lastContactDate ?? null,
      next_follow_up_date: data.nextFollowUpDate ?? null,
      notes: data.notes ?? null,
      status: data.status,
      visibility: data.visibility,
      created_by: data.createdBy,
    });
  }, [profile]);

  const editPerson = useCallback((id: string, updates: Partial<Person>) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      people: prev.people.map(p => p.id === id ? { ...p, ...updates, updatedAt: now } : p),
    }));
    supabase.from('people_care').update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.careCategory !== undefined && { care_category: updates.careCategory }),
      ...(updates.lastContactDate !== undefined && { last_contact_date: updates.lastContactDate }),
      ...(updates.nextFollowUpDate !== undefined && { next_follow_up_date: updates.nextFollowUpDate }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.visibility !== undefined && { visibility: updates.visibility }),
      updated_at: now,
    }).eq('id', id);
  }, []);

  const removePerson = useCallback((id: string) => {
    setState(prev => ({ ...prev, people: prev.people.filter(p => p.id !== id) }));
    supabase.from('people_care').delete().eq('id', id);
  }, []);

  // ── Sermon actions ──
  const addSermon = useCallback((data: Omit<Sermon, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!profile?.organization_id) return;
    const now = new Date().toISOString();
    const id = generateId();
    const sermon: Sermon = { ...data, id, createdAt: now, updatedAt: now };
    setState(prev => ({ ...prev, sermons: [sermon, ...prev.sermons] }));
    supabase.from('sermons').insert({
      id,
      organization_id: profile.organization_id!,
      title: data.title,
      scripture_text: data.scriptureText ?? null,
      series_name: data.seriesName ?? null,
      preaching_date: data.preachingDate ?? null,
      status: data.status,
      big_idea: data.bigIdea ?? null,
      notes: data.notes ?? null,
      created_by: data.createdBy,
    });
  }, [profile]);

  const editSermon = useCallback((id: string, updates: Partial<Sermon>) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      sermons: prev.sermons.map(s => s.id === id ? { ...s, ...updates, updatedAt: now } : s),
    }));
    supabase.from('sermons').update({
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.scriptureText !== undefined && { scripture_text: updates.scriptureText }),
      ...(updates.seriesName !== undefined && { series_name: updates.seriesName }),
      ...(updates.preachingDate !== undefined && { preaching_date: updates.preachingDate }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.bigIdea !== undefined && { big_idea: updates.bigIdea }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      updated_at: now,
    }).eq('id', id);
  }, []);

  const removeSermon = useCallback((id: string) => {
    setState(prev => ({ ...prev, sermons: prev.sermons.filter(s => s.id !== id) }));
    supabase.from('sermons').delete().eq('id', id);
  }, []);

  // ── Prayer actions ──
  const addPrayer = useCallback((data: Omit<PrayerRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!profile?.organization_id) return;
    const now = new Date().toISOString();
    const id = generateId();
    const prayer: PrayerRequest = { ...data, id, createdAt: now, updatedAt: now };
    setState(prev => ({ ...prev, prayerRequests: [prayer, ...prev.prayerRequests] }));
    supabase.from('prayer_requests').insert({
      id,
      organization_id: profile.organization_id!,
      person_name: data.personName,
      request: data.request,
      category: data.category,
      date_added: data.dateAdded,
      follow_up_date: data.followUpDate ?? null,
      status: data.status,
      private_notes: data.privateNotes ?? null,
      visibility: data.visibility,
      created_by: data.createdBy,
    });
  }, [profile]);

  const editPrayer = useCallback((id: string, updates: Partial<PrayerRequest>) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      prayerRequests: prev.prayerRequests.map(p => p.id === id ? { ...p, ...updates, updatedAt: now } : p),
    }));
    supabase.from('prayer_requests').update({
      ...(updates.personName !== undefined && { person_name: updates.personName }),
      ...(updates.request !== undefined && { request: updates.request }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.dateAdded !== undefined && { date_added: updates.dateAdded }),
      ...(updates.followUpDate !== undefined && { follow_up_date: updates.followUpDate }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.privateNotes !== undefined && { private_notes: updates.privateNotes }),
      ...(updates.visibility !== undefined && { visibility: updates.visibility }),
      updated_at: now,
    }).eq('id', id);
  }, []);

  const removePrayer = useCallback((id: string) => {
    setState(prev => ({ ...prev, prayerRequests: prev.prayerRequests.filter(p => p.id !== id) }));
    supabase.from('prayer_requests').delete().eq('id', id);
  }, []);

  // ── Rhythm actions ──
  const toggleRhythm = useCallback((itemId: string) => {
    if (!profile) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setState(prev => {
      const weekStart = prev.weeklyRhythm.weekOf;
      const alreadyDone = prev.weeklyRhythm.completedItems.includes(itemId);
      const newCompleted = alreadyDone
        ? prev.weeklyRhythm.completedItems.filter(i => i !== itemId)
        : [...prev.weeklyRhythm.completedItems, itemId];
      const updatedRhythmItems = prev.rhythmItems.map(r => {
        if (r.id !== itemId) return r;
        const dates = alreadyDone
          ? r.completedDates.filter(d => d !== today)
          : [...r.completedDates, today];
        return { ...r, completedDates: dates };
      });
      if (alreadyDone) {
        supabase.from('rhythm_completions')
          .delete()
          .eq('rhythm_item_id', itemId)
          .eq('profile_id', profile.id)
          .gte('completed_date', weekStart);
      } else {
        supabase.from('rhythm_completions').upsert({
          id: generateId(),
          rhythm_item_id: itemId,
          profile_id: profile.id,
          completed_date: today,
        });
      }
      return { ...prev, weeklyRhythm: { ...prev.weeklyRhythm, completedItems: newCompleted }, rhythmItems: updatedRhythmItems };
    });
  }, [profile]);

  const addRhythmItem = useCallback((title: string, description?: string) => {
    if (!profile?.organization_id) return;
    const id = generateId();
    const now = new Date().toISOString();
    const item: RhythmItem = { id, title, description, isRecurring: true, completedDates: [] };
    setState(prev => ({ ...prev, rhythmItems: [...prev.rhythmItems, item] }));
    supabase.from('rhythm_items').insert({
      id,
      organization_id: profile.organization_id!,
      profile_id: profile.id,
      title,
      description: description ?? null,
      is_recurring: true,
      created_at: now,
      updated_at: now,
    });
  }, [profile]);

  const removeRhythmItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      rhythmItems: prev.rhythmItems.filter(r => r.id !== id),
      weeklyRhythm: { ...prev.weeklyRhythm, completedItems: prev.weeklyRhythm.completedItems.filter(i => i !== id) },
    }));
    supabase.from('rhythm_items').delete().eq('id', id);
  }, []);

  // ── Settings ──
  const saveSettings = useCallback((updates: Partial<OrgSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
    if (!organization) return;
    if (updates.organizationName) {
      supabase.from('organizations').update({ name: updates.organizationName }).eq('id', organization.id);
      setOrganization(prev => prev ? { ...prev, name: updates.organizationName! } : prev);
    }
    if (updates.taskCategories) {
      supabase.from('organizations').update({ task_categories: updates.taskCategories }).eq('id', organization.id);
    }
  }, [organization]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value: AppContextValue = {
    state,
    users,
    currentUser,
    setState,
    setCurrentUser: (userId) => setState(prev => ({ ...prev, currentUserId: userId })),
    setOrgView: (enabled) => setState(prev => ({ ...prev, orgViewEnabled: enabled })),

    addTask, editTask, removeTask,
    addPerson, editPerson, removePerson,
    addSermon, editSermon, removeSermon,
    addPrayer, editPrayer, removePrayer,
    toggleRhythm, addRhythmItem, removeRhythmItem,
    saveSettings,

    get myTasks() { return visibleTasks(state, state.currentUserId); },
    get myPeople() { return visiblePeople(state, state.currentUserId); },
    get myPrayers() { return visiblePrayers(state, state.currentUserId); },

    profile,
    organization,
    orgMembers,
    isLoading,
    signOut,
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-[oklch(0.97_0.008_85)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#6aaa7e]/30 border-t-[#6aaa7e] rounded-full animate-spin" />
          <p className="text-sm text-[oklch(0.18_0.02_150)]/40">Loading Pastor Flow…</p>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
