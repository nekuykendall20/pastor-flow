'use client';

import { useApp } from '@/lib/supabase-context';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { BookOpen, CalendarDays, HeartHandshake, FolderOpen, Plus, ArrowRight, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ─── Sermon status progress ───────────────────────────────────────────────────

const SERMON_STEPS = ['Idea', 'Researching', 'Outlining', 'Drafting', 'Ready', 'Preached'];

function SermonBar({ status }: { status: string }) {
  const idx = SERMON_STEPS.indexOf(status);
  const pct = Math.round(((idx + 1) / SERMON_STEPS.length) * 100);
  return (
    <div className="w-full bg-black/10 rounded-full h-1 mt-1">
      <div className="h-1 rounded-full bg-white/60 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Bucket card shell ────────────────────────────────────────────────────────

function Bucket({
  title, icon: Icon, headerBg, stat, statLabel, href, addHref, children,
}: {
  title: string;
  icon: React.ElementType;
  headerBg: string;   // inline style color
  stat: number;
  statLabel: string;
  href: string;
  addHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
        <div className="flex items-center gap-2.5">
          <Icon size={16} className="text-white/70" />
          <h2 className="font-semibold text-white text-[15px] tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white font-bold text-lg leading-none">{stat}</p>
            <p className="text-white/50 text-[10px] leading-none mt-0.5">{statLabel}</p>
          </div>
          <Link
            href={addHref}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            title={`Add to ${title}`}
          >
            <Plus size={13} className="text-white/80" />
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
          <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// ─── Earthy palette ───────────────────────────────────────────────────────────
// Muted, organic tones — all from the same warm earth family

const COLORS = {
  sermons:  '#5c4835', // warm umber
  events:   '#3d5a48', // forest sage
  people:   '#5c4050', // dusty plum
  projects: '#3d4a5c', // deep slate
};

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

  // ── Events: tasks WITH a due date (time-bound, on the calendar) ──
  const eventTasks = myTasks
    .filter(t => t.status !== 'Completed' && t.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

  const overdueEvents = eventTasks.filter(
    t => isPast(parseISO(t.dueDate!)) && !isToday(parseISO(t.dueDate!))
  );

  // ── Projects: tasks WITHOUT a due date (ongoing work, no fixed deadline) ──
  const projectTasks = myTasks
    .filter(t => t.status !== 'Completed' && !t.dueDate)
    .sort((a, b) => {
      const pri = { High: 0, Medium: 1, Low: 2 };
      return (pri[a.priority as keyof typeof pri] ?? 1) - (pri[b.priority as keyof typeof pri] ?? 1);
    });

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

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

      {/* ── Four buckets ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* ────────────── SERMONS ────────────── */}
        <Bucket
          title="Sermons"
          icon={BookOpen}
          headerBg={COLORS.sermons}
          stat={activeSermons.length}
          statLabel="in pipeline"
          href="/sermons"
          addHref="/sermons"
        >
          {activeSermons.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <BookOpen size={22} className="mx-auto mb-2 text-stone-200" />
              <p className="text-sm text-stone-400">No sermons in progress</p>
              <Link href="/sermons" className="text-xs mt-1 inline-block" style={{ color: COLORS.sermons }}>
                Start one →
              </Link>
            </div>
          ) : (
            activeSermons.slice(0, 5).map(sermon => (
              <div key={sermon.id} className="px-5 py-3.5 hover:bg-stone-50/70 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-stone-800 leading-snug truncate">{sermon.title}</p>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 shrink-0 whitespace-nowrap">
                    {sermon.status}
                  </span>
                </div>
                <SermonBar status={sermon.status} />
                <p className="text-xs text-stone-400 mt-1.5">
                  {sermon.scriptureText ? `${sermon.scriptureText} · ` : ''}
                  {sermon.preachingDate ? format(parseISO(sermon.preachingDate), 'MMM d') : 'Date TBD'}
                </p>
              </div>
            ))
          )}
        </Bucket>

        {/* ────────────── EVENTS ────────────── */}
        <Bucket
          title="Events"
          icon={CalendarDays}
          headerBg={COLORS.events}
          stat={eventTasks.length}
          statLabel="upcoming"
          href="/tasks"
          addHref="/tasks"
        >
          {overdueEvents.length > 0 && (
            <div className="px-5 py-2 bg-red-50 border-b border-red-100">
              <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                <Flame size={10} /> {overdueEvents.length} overdue
              </p>
            </div>
          )}
          {eventTasks.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CalendarDays size={22} className="mx-auto mb-2 text-stone-200" />
              <p className="text-sm text-stone-400">No upcoming events</p>
              <Link href="/tasks" className="text-xs mt-1 inline-block" style={{ color: COLORS.events }}>
                Add one →
              </Link>
            </div>
          ) : (
            eventTasks.slice(0, 6).map(task => {
              const isOverdue = isPast(parseISO(task.dueDate!)) && !isToday(parseISO(task.dueDate!));
              const isDueToday = isToday(parseISO(task.dueDate!));
              return (
                <div key={task.id} className="px-5 py-3.5 hover:bg-stone-50/70 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                      task.priority === 'High' ? 'bg-red-400' :
                      task.priority === 'Medium' ? 'bg-amber-400' : 'bg-stone-300'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium leading-snug truncate', isOverdue ? 'text-red-700' : 'text-stone-800')}>
                        {task.title}
                      </p>
                      <p className={cn('text-xs mt-0.5',
                        isOverdue ? 'text-red-400' :
                        isDueToday ? 'text-amber-500 font-medium' : 'text-stone-400'
                      )}>
                        {task.category} · {isOverdue ? '⚠ ' : ''}{format(parseISO(task.dueDate!), 'MMM d')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Bucket>

        {/* ────────────── PROJECTS ────────────── */}
        <Bucket
          title="Projects"
          icon={FolderOpen}
          headerBg={COLORS.projects}
          stat={projectTasks.length}
          statLabel="in progress"
          href="/tasks"
          addHref="/tasks"
        >
          {projectTasks.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <FolderOpen size={22} className="mx-auto mb-2 text-stone-200" />
              <p className="text-sm text-stone-400">No open projects</p>
              <Link href="/tasks" className="text-xs mt-1 inline-block" style={{ color: COLORS.projects }}>
                Add one →
              </Link>
            </div>
          ) : (
            projectTasks.slice(0, 6).map(task => (
              <div key={task.id} className="px-5 py-3.5 hover:bg-stone-50/70 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                    task.priority === 'High' ? 'bg-red-400' :
                    task.priority === 'Medium' ? 'bg-amber-400' : 'bg-stone-300'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 leading-snug truncate">{task.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {task.category} · {task.priority}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap',
                    task.status === 'In Progress' ? 'bg-blue-50 text-blue-500' :
                    task.status === 'Waiting' ? 'bg-amber-50 text-amber-500' :
                    'bg-stone-100 text-stone-400'
                  )}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </Bucket>

        {/* ────────────── PEOPLE ────────────── */}
        <Bucket
          title="People"
          icon={HeartHandshake}
          headerBg={COLORS.people}
          stat={followUpsDue.length}
          statLabel="need follow-up"
          href="/people"
          addHref="/people"
        >
          {allPeopleItems.length === 0 && activePrayers.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <HeartHandshake size={22} className="mx-auto mb-2 text-stone-200" />
              <p className="text-sm text-stone-400">All follow-ups are current</p>
              <Link href="/people" className="text-xs mt-1 inline-block" style={{ color: COLORS.people }}>
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
                      <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-xs font-bold shrink-0">
                        {person.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{person.name}</p>
                        <p className={cn('text-xs', isDue ? 'text-rose-500 font-medium' : 'text-stone-400')}>
                          {person.careCategory}
                          {person.nextFollowUpDate && <> · {format(parseISO(person.nextFollowUpDate), 'MMM d')}</>}
                        </p>
                      </div>
                      {isDue && <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />}
                    </div>
                  </div>
                );
              })}
              {activePrayers.length > 0 && (
                <Link href="/prayer" className="px-5 py-3 flex items-center justify-between bg-stone-50 hover:bg-stone-100/70 transition-colors group">
                  <p className="text-xs font-medium text-stone-500">
                    🙏 {activePrayers.length} active prayer {activePrayers.length === 1 ? 'request' : 'requests'}
                  </p>
                  <ArrowRight size={11} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </>
          )}
        </Bucket>

      </div>
    </div>
  );
}
