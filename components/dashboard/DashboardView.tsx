'use client';

import { useApp } from '@/lib/supabase-context';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { BookOpen, CalendarDays, HeartHandshake, Plus, ArrowRight, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ─── Sermon status progress ───────────────────────────────────────────────────

const SERMON_STEPS = ['Idea', 'Researching', 'Outlining', 'Drafting', 'Ready', 'Preached'];

function SermonBar({ status }: { status: string }) {
  const idx = SERMON_STEPS.indexOf(status);
  const pct = Math.round(((idx + 1) / SERMON_STEPS.length) * 100);
  return (
    <div className="w-full bg-stone-100 rounded-full h-1 mt-1">
      <div className="h-1 rounded-full bg-purple-400 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Bucket card shell ────────────────────────────────────────────────────────

function Bucket({
  title, icon: Icon, accent, stat, statLabel, href, addHref, children, empty,
}: {
  title: string;
  icon: React.ElementType;
  accent: string;   // tailwind bg color for the header strip
  iconColor: string;
  stat: number;
  statLabel: string;
  href: string;
  addHref: string;
  children: React.ReactNode;
  empty: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className={cn('px-5 py-4 flex items-center justify-between', accent)}>
        <div className="flex items-center gap-2.5">
          <Icon size={17} className="text-white/80" />
          <h2 className="font-semibold text-white text-[15px] tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white font-bold text-lg leading-none">{stat}</p>
            <p className="text-white/60 text-[10px] leading-none mt-0.5">{statLabel}</p>
          </div>
          <Link
            href={addHref}
            className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            title={`Add to ${title}`}
          >
            <Plus size={14} className="text-white" />
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 divide-y divide-stone-50 overflow-y-auto">
        {children}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-stone-100">
        <Link href={href} className="flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors group">
          View all {title}
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function DashboardView() {
  const { state, myTasks, myPeople, myPrayers, currentUser } = useApp();

  const today = new Date();
  const firstName = currentUser.name.split(' ')[0];
  const timeOfDay = today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening';

  // ── Sermons ──
  const activeSermons = state.sermons
    .filter(s => s.status !== 'Preached')
    .sort((a, b) => (a.preachingDate ?? 'zzz').localeCompare(b.preachingDate ?? 'zzz'));

  // ── Events (all open tasks, sorted soonest-due first) ──
  const openTasks = myTasks
    .filter(t => t.status !== 'Completed')
    .sort((a, b) => (a.dueDate ?? 'zzz').localeCompare(b.dueDate ?? 'zzz'));

  const overdueTasks = openTasks.filter(
    t => t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
  );

  // ── People ──
  const followUpsDue = myPeople
    .filter(p =>
      p.status !== 'Archived' &&
      p.nextFollowUpDate &&
      (isPast(parseISO(p.nextFollowUpDate)) || isToday(parseISO(p.nextFollowUpDate)))
    )
    .sort((a, b) => a.nextFollowUpDate!.localeCompare(b.nextFollowUpDate!));

  const upcomingFollowUps = myPeople
    .filter(p =>
      p.status !== 'Archived' &&
      p.nextFollowUpDate &&
      !isPast(parseISO(p.nextFollowUpDate)) &&
      !isToday(parseISO(p.nextFollowUpDate))
    )
    .sort((a, b) => a.nextFollowUpDate!.localeCompare(b.nextFollowUpDate!));

  const activePrayers = myPrayers.filter(p => p.status === 'Active');
  const allPeopleItems = [...followUpsDue, ...upcomingFollowUps];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* ── Greeting ── */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: currentUser.color }}
        >
          {currentUser.initials}
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-800 leading-tight">
            Good {timeOfDay}, {firstName}.
          </h1>
          <p className="text-stone-400 text-sm">
            {format(today, 'EEEE, MMMM d')}
          </p>
        </div>
      </div>

      {/* ── Three buckets ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* ────────────── SERMONS ────────────── */}
        <Bucket
          title="Sermons"
          icon={BookOpen}
          accent="bg-purple-600"
          iconColor="text-purple-600"
          stat={activeSermons.length}
          statLabel="in pipeline"
          href="/sermons"
          addHref="/sermons"
          empty="No sermons in progress"
        >
          {activeSermons.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <BookOpen size={24} className="mx-auto mb-2 text-stone-200" />
              <p className="text-sm text-stone-400">No sermons in progress</p>
              <Link href="/sermons" className="text-xs text-purple-500 hover:text-purple-700 mt-1 inline-block">
                Start one →
              </Link>
            </div>
          ) : (
            activeSermons.slice(0, 5).map(sermon => (
              <div key={sermon.id} className="px-5 py-3.5 hover:bg-stone-50/70 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-stone-800 leading-snug truncate">{sermon.title}</p>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 shrink-0 whitespace-nowrap">
                    {sermon.status}
                  </span>
                </div>
                <SermonBar status={sermon.status} />
                <p className="text-xs text-stone-400 mt-1.5">
                  {sermon.scriptureText
                    ? `${sermon.scriptureText} · `
                    : ''
                  }
                  {sermon.preachingDate
                    ? format(parseISO(sermon.preachingDate), 'MMM d')
                    : 'Date TBD'
                  }
                </p>
              </div>
            ))
          )}
        </Bucket>

        {/* ────────────── EVENTS ────────────── */}
        <Bucket
          title="Events"
          icon={CalendarDays}
          accent="bg-[#4f7c5f]"
          iconColor="text-[#4f7c5f]"
          stat={openTasks.length}
          statLabel="open"
          href="/tasks"
          addHref="/tasks"
          empty="No open tasks"
        >
          {overdueTasks.length > 0 && (
            <div className="px-5 py-2.5 bg-red-50 border-b border-red-100">
              <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                <Flame size={11} /> {overdueTasks.length} overdue
              </p>
            </div>
          )}
          {openTasks.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CalendarDays size={24} className="mx-auto mb-2 text-stone-200" />
              <p className="text-sm text-stone-400">All clear — no open tasks</p>
              <Link href="/tasks" className="text-xs text-[#4f7c5f] hover:text-[#3d6b4e] mt-1 inline-block">
                Add one →
              </Link>
            </div>
          ) : (
            openTasks.slice(0, 6).map(task => {
              const isOverdue = task.dueDate &&
                isPast(parseISO(task.dueDate)) &&
                !isToday(parseISO(task.dueDate));
              const isDueToday = task.dueDate && isToday(parseISO(task.dueDate));
              return (
                <div key={task.id} className="px-5 py-3.5 hover:bg-stone-50/70 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                      task.priority === 'High' ? 'bg-red-400' :
                      task.priority === 'Medium' ? 'bg-amber-400' : 'bg-stone-300'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium leading-snug truncate',
                        isOverdue ? 'text-red-700' : 'text-stone-800'
                      )}>
                        {task.title}
                      </p>
                      <p className={cn(
                        'text-xs mt-0.5',
                        isOverdue ? 'text-red-400' :
                        isDueToday ? 'text-amber-500 font-medium' : 'text-stone-400'
                      )}>
                        {task.category}
                        {task.dueDate && (
                          <> · {isOverdue ? '⚠ ' : ''}{format(parseISO(task.dueDate), 'MMM d')}</>
                        )}
                      </p>
                    </div>
                    <span className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap',
                      task.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                      task.status === 'Waiting' ? 'bg-amber-50 text-amber-600' :
                      'bg-stone-100 text-stone-500'
                    )}>
                      {task.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </Bucket>

        {/* ────────────── PEOPLE ────────────── */}
        <Bucket
          title="People"
          icon={HeartHandshake}
          accent="bg-rose-500"
          iconColor="text-rose-500"
          stat={followUpsDue.length}
          statLabel="need follow-up"
          href="/people"
          addHref="/people"
          empty="No follow-ups due"
        >
          {allPeopleItems.length === 0 && activePrayers.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <HeartHandshake size={24} className="mx-auto mb-2 text-stone-200" />
              <p className="text-sm text-stone-400">All follow-ups are up to date</p>
              <Link href="/people" className="text-xs text-rose-500 hover:text-rose-700 mt-1 inline-block">
                Add someone →
              </Link>
            </div>
          ) : (
            <>
              {allPeopleItems.slice(0, 5).map(person => {
                const isDue = person.nextFollowUpDate &&
                  (isPast(parseISO(person.nextFollowUpDate)) || isToday(parseISO(person.nextFollowUpDate)));
                return (
                  <div key={person.id} className="px-5 py-3.5 hover:bg-stone-50/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        isDue ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600'
                      )}>
                        {person.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{person.name}</p>
                        <p className={cn(
                          'text-xs',
                          isDue ? 'text-rose-500 font-medium' : 'text-stone-400'
                        )}>
                          {person.careCategory}
                          {person.nextFollowUpDate && (
                            <> · {format(parseISO(person.nextFollowUpDate), 'MMM d')}</>
                          )}
                        </p>
                      </div>
                      {isDue && (
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Prayer summary row */}
              {activePrayers.length > 0 && (
                <Link href="/prayer" className="px-5 py-3 flex items-center justify-between bg-amber-50/60 hover:bg-amber-50 transition-colors group">
                  <p className="text-xs font-medium text-amber-700">
                    🙏 {activePrayers.length} active prayer {activePrayers.length === 1 ? 'request' : 'requests'}
                  </p>
                  <ArrowRight size={11} className="text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </>
          )}
        </Bucket>

      </div>
    </div>
  );
}
