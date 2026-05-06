'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/supabase-context';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  isToday, parseISO,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, CheckSquare, HeartHandshake,
  BookOpen, Heart, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Event types ─────────────────────────────────────────────────────────────

type EventKind = 'task' | 'followup' | 'sermon' | 'prayer';

interface CalEvent {
  id: string;
  kind: EventKind;
  title: string;
  subtitle?: string;
  date: string; // yyyy-MM-dd
  meta?: string;
  priority?: string;
  status?: string;
}

const KIND_STYLES: Record<EventKind, { bg: string; text: string; dot: string; icon: React.ElementType; label: string }> = {
  task:     { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400',   icon: CheckSquare,   label: 'Task' },
  followup: { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400',  icon: HeartHandshake,label: 'Follow-Up' },
  sermon:   { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400', icon: BookOpen,       label: 'Sermon' },
  prayer:   { bg: 'bg-rose-50',   text: 'text-rose-700',   dot: 'bg-rose-400',   icon: Heart,          label: 'Prayer' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end   = endOfWeek(endOfMonth(month),   { weekStartsOn: 0 });
  const days: Date[] = [];
  let cur = start;
  while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
  return days;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EventPill({ event, compact = false }: { event: CalEvent; compact?: boolean }) {
  const s = KIND_STYLES[event.kind];
  const Icon = s.icon;
  if (compact) {
    return (
      <span
        title={event.title}
        className={cn('w-1.5 h-1.5 rounded-full shrink-0 inline-block', s.dot)}
      />
    );
  }
  return (
    <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate', s.bg, s.text)}>
      <Icon size={9} className="shrink-0" />
      <span className="truncate">{event.title}</span>
    </div>
  );
}

function DayCell({
  day, events, isCurrentMonth, selected, onClick,
}: {
  day: Date;
  events: CalEvent[];
  isCurrentMonth: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const today   = isToday(day);
  const visible = events.slice(0, 3);
  const overflow = events.length - 3;

  return (
    <button
      onClick={onClick}
      className={cn(
        'min-h-[88px] p-1.5 rounded-xl border text-left transition-all flex flex-col',
        'hover:border-stone-300 hover:shadow-sm',
        selected  ? 'border-[#6aaa7e] bg-[#6aaa7e]/5 shadow-sm' : 'border-stone-100',
        !isCurrentMonth && 'opacity-40',
      )}
    >
      <span className={cn(
        'text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-1 self-start',
        today    ? 'bg-[#4f7c5f] text-white' : 'text-stone-500',
      )}>
        {format(day, 'd')}
      </span>

      {/* Event pills — show up to 2, then dots for rest */}
      <div className="flex flex-col gap-0.5 flex-1 w-full overflow-hidden">
        {visible.slice(0, 2).map(ev => (
          <EventPill key={ev.id} event={ev} />
        ))}
        {(visible.length > 2 || overflow > 0) && (
          <div className="flex items-center gap-1 px-1">
            {visible.slice(2).map(ev => <EventPill key={ev.id} event={ev} compact />)}
            {overflow > 0 && events.slice(2).map(ev => <EventPill key={ev.id} event={ev} compact />)}
          </div>
        )}
        {events.length > 2 && (
          <span className="text-[9px] text-stone-400 px-1">+{events.length - 2} more</span>
        )}
      </div>
    </button>
  );
}

function DayPanel({ day, events, onClose }: { day: Date; events: CalEvent[]; onClose: () => void }) {
  const grouped = (Object.keys(KIND_STYLES) as EventKind[]).map(kind => ({
    kind,
    items: events.filter(e => e.kind === kind),
  })).filter(g => g.items.length > 0);

  return (
    <div className="w-72 shrink-0 bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div>
          <p className="font-semibold text-stone-800">{format(day, 'EEEE')}</p>
          <p className="text-sm text-stone-500">{format(day, 'MMMM d, yyyy')}</p>
        </div>
        <button onClick={onClose} className="text-stone-300 hover:text-stone-500 text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <Calendar size={24} className="mx-auto mb-2 text-stone-300" />
            <p className="text-sm">Nothing scheduled</p>
          </div>
        ) : (
          grouped.map(({ kind, items }) => {
            const s = KIND_STYLES[kind];
            const Icon = s.icon;
            return (
              <div key={kind}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={12} className={s.text} />
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wide', s.text)}>
                    {s.label}s
                  </p>
                </div>
                <div className="space-y-2">
                  {items.map(ev => (
                    <div key={ev.id} className={cn('rounded-xl p-3 border', s.bg, 'border-transparent')}>
                      <p className={cn('text-sm font-medium', s.text)}>{ev.title}</p>
                      {ev.subtitle && <p className="text-xs text-stone-500 mt-0.5">{ev.subtitle}</p>}
                      {ev.meta && <p className="text-xs text-stone-400 mt-1">{ev.meta}</p>}
                      {ev.priority && (
                        <span className={cn(
                          'text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-1.5 inline-block',
                          ev.priority === 'High' ? 'bg-red-100 text-red-600' :
                          ev.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'
                        )}>
                          {ev.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export default function CalendarView() {
  const { myTasks, myPeople, myPrayers, state } = useApp();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());

  // Build event list from all data sources
  const allEvents = useMemo<CalEvent[]>(() => {
    const evs: CalEvent[] = [];

    // Tasks with due dates
    myTasks.forEach(t => {
      if (!t.dueDate || t.status === 'Completed') return;
      evs.push({
        id: `task-${t.id}`,
        kind: 'task',
        title: t.title,
        subtitle: `${t.category} · ${t.status}`,
        date: t.dueDate,
        priority: t.priority,
        meta: t.notes ?? undefined,
      });
    });

    // People follow-ups
    myPeople.forEach(p => {
      if (!p.nextFollowUpDate || p.status === 'Archived') return;
      evs.push({
        id: `followup-${p.id}`,
        kind: 'followup',
        title: p.name,
        subtitle: p.careCategory,
        date: p.nextFollowUpDate,
        meta: p.notes ? p.notes.slice(0, 80) + (p.notes.length > 80 ? '…' : '') : undefined,
        status: p.status,
      });
    });

    // Sermons
    state.sermons.forEach(s => {
      if (!s.preachingDate) return;
      evs.push({
        id: `sermon-${s.id}`,
        kind: 'sermon',
        title: s.title,
        subtitle: s.scriptureText ?? s.seriesName ?? undefined,
        date: s.preachingDate,
        status: s.status,
        meta: s.bigIdea ? `"${s.bigIdea.slice(0, 80)}…"` : undefined,
      });
    });

    // Prayer follow-ups
    myPrayers.forEach(p => {
      if (!p.followUpDate || p.status !== 'Active') return;
      evs.push({
        id: `prayer-${p.id}`,
        kind: 'prayer',
        title: p.personName,
        subtitle: p.category,
        date: p.followUpDate,
        meta: p.request.slice(0, 80) + (p.request.length > 80 ? '…' : ''),
      });
    });

    return evs;
  }, [myTasks, myPeople, myPrayers, state.sermons]);

  const eventsForDay = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    return allEvents.filter(e => e.date === key);
  };

  const eventsForSelected = selected ? eventsForDay(selected) : [];

  const days = buildCalendarDays(month);

  // Upcoming events for the next 30 days (for the mini agenda)
  const today = new Date();
  const upcoming = allEvents
    .filter(e => {
      const d = parseISO(e.date);
      return d >= today && d <= addDays(today, 30);
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  // Legend counts
  const kindCounts = (Object.keys(KIND_STYLES) as EventKind[]).map(k => ({
    kind: k,
    count: allEvents.filter(e => e.kind === k).length,
  }));

  return (
    <div className="p-6 flex flex-col gap-5 h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Calendar</h1>
          <p className="text-stone-500 text-sm mt-0.5">Ministry schedule — tasks, follow-ups, sermons & prayer</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-3 mr-3">
            {kindCounts.map(({ kind, count }) => {
              const s = KIND_STYLES[kind];
              return (
                <div key={kind} className="flex items-center gap-1.5 text-xs text-stone-500">
                  <span className={cn('w-2 h-2 rounded-full', s.dot)} />
                  {s.label} <span className="font-semibold text-stone-700">{count}</span>
                </div>
              );
            })}
          </div>
          {/* Month navigation */}
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => { setMonth(new Date()); setSelected(new Date()); }}
            className="px-3 h-8 text-sm font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors min-w-[130px] text-center"
          >
            {format(month, 'MMMM yyyy')}
          </button>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => { setMonth(new Date()); setSelected(new Date()); }}
            className="px-3 h-8 text-xs font-semibold rounded-lg bg-[#4f7c5f] text-white hover:bg-[#3d6b4e] transition-colors ml-1"
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-[10px] font-semibold text-stone-400 uppercase text-center py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {days.map(day => (
              <DayCell
                key={day.toISOString()}
                day={day}
                events={eventsForDay(day)}
                isCurrentMonth={isSameMonth(day, month)}
                selected={selected ? isSameDay(day, selected) : false}
                onClick={() => setSelected(isSameDay(day, selected ?? new Date(-1)) ? null : day)}
              />
            ))}
          </div>
        </div>

        {/* Right panel: selected day OR upcoming agenda */}
        <div className="w-72 shrink-0 flex flex-col gap-4">
          {selected ? (
            <DayPanel
              day={selected}
              events={eventsForSelected}
              onClose={() => setSelected(null)}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col">
              <div className="px-4 py-3 border-b border-stone-100">
                <p className="font-semibold text-stone-800">Upcoming (30 days)</p>
                <p className="text-xs text-stone-400 mt-0.5">Click a day to see details</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-stone-400 text-center py-6">Nothing upcoming</p>
                ) : (
                  upcoming.map(ev => {
                    const s = KIND_STYLES[ev.kind];
                    const Icon = s.icon;
                    return (
                      <button
                        key={ev.id}
                        onClick={() => {
                          const d = parseISO(ev.date);
                          setMonth(d);
                          setSelected(d);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left hover:opacity-90 transition-opacity',
                          s.bg
                        )}
                      >
                        <div className="shrink-0 text-center min-w-[32px]">
                          <p className="text-[9px] font-semibold text-stone-400 uppercase">{format(parseISO(ev.date), 'MMM')}</p>
                          <p className={cn('text-base font-bold leading-tight', s.text)}>{format(parseISO(ev.date), 'd')}</p>
                        </div>
                        <div className="min-w-0">
                          <p className={cn('text-xs font-semibold truncate', s.text)}>{ev.title}</p>
                          {ev.subtitle && <p className="text-[10px] text-stone-400 truncate">{ev.subtitle}</p>}
                        </div>
                        <Icon size={12} className={cn('shrink-0 ml-auto', s.text)} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Mini stats */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">This Month</p>
            <div className="space-y-2">
              {(Object.keys(KIND_STYLES) as EventKind[]).map(kind => {
                const s = KIND_STYLES[kind];
                const Icon = s.icon;
                const count = allEvents.filter(e =>
                  e.kind === kind && isSameMonth(parseISO(e.date), month)
                ).length;
                return (
                  <div key={kind} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} className={s.text} />
                      <span className="text-xs text-stone-600">{s.label}s</span>
                    </div>
                    <span className={cn('text-xs font-bold', count > 0 ? s.text : 'text-stone-300')}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
