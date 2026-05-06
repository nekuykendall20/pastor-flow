'use client';

import { useState } from 'react';
import { useApp } from '@/lib/supabase-context';
import { format, startOfWeek, addDays } from 'date-fns';
import { Plus, X, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const ENCOURAGEMENTS = [
  "Keep the rhythm. Rest is holy work too.",
  "Sustainable ministry flows from a healthy soul.",
  "You can't pour from an empty cup — fill up first.",
  "The shepherd who is cared for cares better.",
  "Faithfulness in the small rhythms builds a lasting ministry.",
  "A rested pastor is a present pastor.",
  "The work of the ministry begins in the secret place.",
];

export default function RhythmView() {
  const { state, toggleRhythm, addRhythmItem, removeRhythmItem } = useApp();
  const [newItem, setNewItem] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const completed = state.weeklyRhythm.completedItems;
  const total = state.rhythmItems.length;
  const pct = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  const encouragement = ENCOURAGEMENTS[Math.floor((new Date().getDate()) % ENCOURAGEMENTS.length)];

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleAdd = () => {
    if (!newItem.trim()) return;
    addRhythmItem(newItem.trim(), newDesc.trim() || undefined);
    setNewItem('');
    setNewDesc('');
    setShowAdd(false);
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Weekly Rhythm</h1>
        <p className="text-stone-500 text-sm mt-0.5">Healthy ministry rhythms for {format(weekStart, 'MMMM d')} — {format(addDays(weekStart, 6), 'MMMM d, yyyy')}</p>
      </div>

      {/* Progress Card */}
      <div className={cn(
        "rounded-2xl p-6 mb-6 transition-all",
        pct === 100
          ? "bg-gradient-to-br from-[#6aaa7e]/20 to-emerald-50 border border-[#6aaa7e]/30"
          : "bg-white border border-stone-100 shadow-sm"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-stone-700">This Week's Progress</p>
            <p className="text-3xl font-bold text-stone-800 mt-1">{pct}<span className="text-lg text-stone-400">%</span></p>
          </div>
          {pct === 100 ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">🎉</span>
              <p className="text-xs text-[#3d7a53] font-semibold">Complete!</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-sm text-stone-500">{completed.length} of {total}</p>
              <p className="text-xs text-stone-400 mt-0.5">items done</p>
            </div>
          )}
        </div>
        <Progress value={pct} className="h-2.5" />
        {pct > 0 && pct < 100 && (
          <p className="text-xs text-stone-500 mt-3 italic flex items-center gap-1.5">
            <Sparkles size={11} className="text-amber-400" />
            {encouragement}
          </p>
        )}
        {pct === 100 && (
          <p className="text-sm text-[#3d7a53] mt-3 font-medium text-center">
            Well done — a faithful week of ministry.
          </p>
        )}
      </div>

      {/* Week Calendar */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Week of {format(weekStart, 'MMM d')}</p>
        <div className="flex gap-1.5">
          {weekDays.map(day => {
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            return (
              <div key={day.toISOString()} className={cn(
                "flex-1 rounded-lg py-2 text-center",
                isToday ? 'bg-[#6aaa7e]/15' : 'bg-stone-50'
              )}>
                <p className={cn("text-[10px] font-medium", isToday ? 'text-[#3d7a53]' : 'text-stone-400')}>
                  {format(day, 'EEE')}
                </p>
                <p className={cn("text-sm font-bold mt-0.5", isToday ? 'text-[#3d7a53]' : 'text-stone-500')}>
                  {format(day, 'd')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rhythm Items */}
      <div className="space-y-2.5 mb-6">
        {state.rhythmItems.map(item => {
          const isDone = completed.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleRhythm(item.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                isDone
                  ? 'bg-[#6aaa7e]/8 border-[#6aaa7e]/20'
                  : 'bg-white border-stone-100 hover:border-stone-200 hover:shadow-sm'
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                isDone ? 'bg-[#6aaa7e] border-[#6aaa7e]' : 'border-stone-300 group-hover:border-[#6aaa7e]/50'
              )}>
                {isDone && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium text-sm", isDone ? 'text-[#3d7a53] line-through opacity-70' : 'text-stone-700')}>
                  {item.title}
                </p>
                {item.description && (
                  <p className={cn("text-xs mt-0.5", isDone ? 'text-stone-400' : 'text-stone-400')}>
                    {item.description}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeRhythmItem(item.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-stone-300 hover:text-red-400 transition-all"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Item */}
      {showAdd ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <div className="space-y-3">
            <Input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder="Rhythm item name..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <Input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="bg-[#4f7c5f] hover:bg-[#3d6b4e] text-white">Add</Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setNewItem(''); setNewDesc(''); }}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-[#6aaa7e]/40 hover:text-[#6aaa7e] transition-all text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus size={15} /> Add Rhythm Item
        </button>
      )}

      {/* Encouragement footer */}
      <div className="mt-8 p-4 bg-stone-50 rounded-2xl border border-stone-100">
        <p className="text-xs text-stone-500 text-center italic">
          "{encouragement}"
        </p>
      </div>
    </div>
  );
}
