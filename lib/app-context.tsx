'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, Task, Person, Sermon, PrayerRequest } from './types';
import {
  loadState, saveState, USERS,
  createTask, updateTask, deleteTask,
  createPerson, updatePerson, deletePerson,
  createSermon, updateSermon, deleteSermon,
  createPrayer, updatePrayer, deletePrayer,
  toggleRhythmItem, createRhythmItem, deleteRhythmItem,
  updateSettings, visibleTasks, visiblePeople, visiblePrayers,
  generateId,
} from './storage';

interface AppContextValue {
  state: AppState;
  users: typeof USERS;
  currentUser: typeof USERS[0];

  // State setters
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setCurrentUser: (userId: string) => void;
  setOrgView: (enabled: boolean) => void;

  // Task actions
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;

  // People actions
  addPerson: (data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editPerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;

  // Sermon actions
  addSermon: (data: Omit<Sermon, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editSermon: (id: string, updates: Partial<Sermon>) => void;
  removeSermon: (id: string) => void;

  // Prayer actions
  addPrayer: (data: Omit<PrayerRequest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editPrayer: (id: string, updates: Partial<PrayerRequest>) => void;
  removePrayer: (id: string) => void;

  // Rhythm actions
  toggleRhythm: (itemId: string) => void;
  addRhythmItem: (title: string, description?: string) => void;
  removeRhythmItem: (id: string) => void;

  // Settings
  saveSettings: (updates: Partial<AppState['settings']>) => void;

  // Computed
  myTasks: Task[];
  myPeople: Person[];
  myPrayers: PrayerRequest[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setState(loadState());
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState(prev => fn(prev));
  }, []);

  const currentUser = USERS.find(u => u.id === state.currentUserId) ?? USERS[0];

  const value: AppContextValue = {
    state,
    users: USERS,
    currentUser,
    setState,
    setCurrentUser: (userId) => update(s => ({ ...s, currentUserId: userId })),
    setOrgView: (enabled) => update(s => ({ ...s, orgViewEnabled: enabled })),

    addTask: (data) => update(s => createTask(s, data)),
    editTask: (id, updates) => update(s => updateTask(s, id, updates)),
    removeTask: (id) => update(s => deleteTask(s, id)),

    addPerson: (data) => update(s => createPerson(s, data)),
    editPerson: (id, updates) => update(s => updatePerson(s, id, updates)),
    removePerson: (id) => update(s => deletePerson(s, id)),

    addSermon: (data) => update(s => createSermon(s, data)),
    editSermon: (id, updates) => update(s => updateSermon(s, id, updates)),
    removeSermon: (id) => update(s => deleteSermon(s, id)),

    addPrayer: (data) => update(s => createPrayer(s, data)),
    editPrayer: (id, updates) => update(s => updatePrayer(s, id, updates)),
    removePrayer: (id) => update(s => deletePrayer(s, id)),

    toggleRhythm: (itemId) => update(s => toggleRhythmItem(s, itemId)),
    addRhythmItem: (title, description) => update(s => createRhythmItem(s, { title, description, isRecurring: true })),
    removeRhythmItem: (id) => update(s => deleteRhythmItem(s, id)),

    saveSettings: (updates) => update(s => updateSettings(s, updates)),

    get myTasks() { return visibleTasks(state, state.currentUserId); },
    get myPeople() { return visiblePeople(state, state.currentUserId); },
    get myPrayers() { return visiblePrayers(state, state.currentUserId); },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
