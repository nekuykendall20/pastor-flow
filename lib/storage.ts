'use client';

import { AppState, Task, Person, Sermon, PrayerRequest, RhythmItem, OrgSettings } from './types';
import { USERS, SAMPLE_TASKS, SAMPLE_PEOPLE, SAMPLE_SERMONS, SAMPLE_PRAYER_REQUESTS, SAMPLE_RHYTHM_ITEMS } from './sample-data';
import { format } from 'date-fns';

export { USERS };

const STORAGE_KEY = 'pastor-flow-data';

function getWeekOf(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return format(monday, 'yyyy-MM-dd');
}

const DEFAULT_STATE: AppState = {
  tasks: SAMPLE_TASKS,
  people: SAMPLE_PEOPLE,
  sermons: SAMPLE_SERMONS,
  prayerRequests: SAMPLE_PRAYER_REQUESTS,
  rhythmItems: SAMPLE_RHYTHM_ITEMS,
  weeklyRhythm: { weekOf: getWeekOf(), completedItems: [] },
  currentUserId: 'u1',
  orgViewEnabled: false,
  settings: {
    organizationName: 'Grace Community Church',
    theme: 'light',
  },
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    // Reset rhythm if new week
    const currentWeek = getWeekOf();
    if (parsed.weeklyRhythm.weekOf !== currentWeek) {
      parsed.weeklyRhythm = { weekOf: currentWeek, completedItems: [] };
    }
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getNow(): string {
  return new Date().toISOString();
}

// Task helpers
export function createTask(state: AppState, data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): AppState {
  const task: Task = { ...data, id: generateId(), createdAt: getNow(), updatedAt: getNow() };
  return { ...state, tasks: [...state.tasks, task] };
}

export function updateTask(state: AppState, id: string, updates: Partial<Task>): AppState {
  return {
    ...state,
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: getNow() } : t),
  };
}

export function deleteTask(state: AppState, id: string): AppState {
  return { ...state, tasks: state.tasks.filter(t => t.id !== id) };
}

// Person helpers
export function createPerson(state: AppState, data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): AppState {
  const person: Person = { ...data, id: generateId(), createdAt: getNow(), updatedAt: getNow() };
  return { ...state, people: [...state.people, person] };
}

export function updatePerson(state: AppState, id: string, updates: Partial<Person>): AppState {
  return {
    ...state,
    people: state.people.map(p => p.id === id ? { ...p, ...updates, updatedAt: getNow() } : p),
  };
}

export function deletePerson(state: AppState, id: string): AppState {
  return { ...state, people: state.people.filter(p => p.id !== id) };
}

// Sermon helpers
export function createSermon(state: AppState, data: Omit<Sermon, 'id' | 'createdAt' | 'updatedAt'>): AppState {
  const sermon: Sermon = { ...data, id: generateId(), createdAt: getNow(), updatedAt: getNow() };
  return { ...state, sermons: [...state.sermons, sermon] };
}

export function updateSermon(state: AppState, id: string, updates: Partial<Sermon>): AppState {
  return {
    ...state,
    sermons: state.sermons.map(s => s.id === id ? { ...s, ...updates, updatedAt: getNow() } : s),
  };
}

export function deleteSermon(state: AppState, id: string): AppState {
  return { ...state, sermons: state.sermons.filter(s => s.id !== id) };
}

// Prayer helpers
export function createPrayer(state: AppState, data: Omit<PrayerRequest, 'id' | 'createdAt' | 'updatedAt'>): AppState {
  const prayer: PrayerRequest = { ...data, id: generateId(), createdAt: getNow(), updatedAt: getNow() };
  return { ...state, prayerRequests: [...state.prayerRequests, prayer] };
}

export function updatePrayer(state: AppState, id: string, updates: Partial<PrayerRequest>): AppState {
  return {
    ...state,
    prayerRequests: state.prayerRequests.map(p => p.id === id ? { ...p, ...updates, updatedAt: getNow() } : p),
  };
}

export function deletePrayer(state: AppState, id: string): AppState {
  return { ...state, prayerRequests: state.prayerRequests.filter(p => p.id !== id) };
}

// Rhythm helpers
export function toggleRhythmItem(state: AppState, itemId: string): AppState {
  const today = format(new Date(), 'yyyy-MM-dd');
  const completed = state.weeklyRhythm.completedItems;
  const isCompleted = completed.includes(itemId);
  return {
    ...state,
    weeklyRhythm: {
      ...state.weeklyRhythm,
      completedItems: isCompleted
        ? completed.filter(id => id !== itemId)
        : [...completed, itemId],
    },
  };
}

export function createRhythmItem(state: AppState, data: Omit<RhythmItem, 'id' | 'completedDates'>): AppState {
  const item: RhythmItem = { ...data, id: generateId(), completedDates: [] };
  return { ...state, rhythmItems: [...state.rhythmItems, item] };
}

export function deleteRhythmItem(state: AppState, id: string): AppState {
  return { ...state, rhythmItems: state.rhythmItems.filter(r => r.id !== id) };
}

// Settings helpers
export function updateSettings(state: AppState, updates: Partial<OrgSettings>): AppState {
  return { ...state, settings: { ...state.settings, ...updates } };
}

// Visibility filter helpers
export function visibleTasks(state: AppState, userId: string) {
  const user = USERS.find(u => u.id === userId);
  if (!user) return [];
  return state.tasks.filter(t => {
    if (t.visibility === 'Organization') return true;
    if (t.createdBy === userId) return true;
    if (t.assignedTo === userId) return true;
    if (t.claimedBy === userId) return true;
    return false;
  });
}

export function visiblePeople(state: AppState, userId: string) {
  return state.people.filter(p => {
    if (p.visibility === 'Organization') return true;
    return p.createdBy === userId;
  });
}

export function visiblePrayers(state: AppState, userId: string) {
  return state.prayerRequests.filter(p => {
    if (p.visibility === 'Organization') return true;
    return p.createdBy === userId;
  });
}
