'use client';

import { useApp } from '@/lib/supabase-context';
import { format, isPast, isToday, parseISO, addDays } from 'date-fns';
import { CheckCircle2, AlertCircle, BookOpen, HeartHandshake, Calendar, Plus, TrendingUp, Clock, Users, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Task, Person, PrayerRequest } from '@/lib/types';
function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number; icon: React.ElementType; color: string; href: string;
}) {
  return (
    <Link href={href}>
      <div className={cn("bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-shadow cursor-pointer group", color)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-stone-500 font-medium">{label}</p>
            <p className="text-3xl font-bold text-stone-800 mt-1">{value}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-50 group-hover:scale-110 transition-transform flex items-center justify-center">
            <Icon size={18} className="text-stone-500" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ label, icon: Icon, color, onClick }: {
  label: string; icon: React.ElementType; color: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95", color)}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function UserAvatar({ userId, size = 'sm' }: { userId?: string; size?: 'sm' | 'md' }) {
  const { users } = useApp();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full text-white font-semibold",
        size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'
      )}
      style={{ backgroundColor: user.color }}
      title={user.name}
    >
      {user.initials}
    </span>
  );
}

function PriorityDot({ priority }: { priority: Task['priority'] }) {
  return (
    <span className={cn("w-2 h-2 rounded-full inline-block shrink-0",
      priority === 'High' ? 'bg-red-400' : priority === 'Medium' ? 'bg-amber-400' : 'bg-stone-300'
    )} />
  );
}

function SermonStatusBar({ status }: { status: string }) {
  const steps = ['Idea', 'Researching', 'Outlining', 'Drafting', 'Ready', 'Preached'];
  const idx = steps.indexOf(status);
  const pct = Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div className="w-full bg-stone-100 rounded-full h-1.5 mt-1.5">
      <div
        className="h-1.5 rounded-full bg-[#6aaa7e] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function DashboardView() {
  const { state, myTasks, myPeople, myPrayers, currentUser } = useApp();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const openTasks = myTasks.filter(t => t.status !== 'Completed');
  const overdueTasks = myTasks.filter(t =>
    t.status !== 'Completed' && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
  );
  const followUpsNeeded = myPeople.filter(p =>
    p.nextFollowUpDate && (isPast(parseISO(p.nextFollowUpDate)) || isToday(parseISO(p.nextFollowUpDate)))
    && p.status !== 'Archived'
  );
  const activePrayers = myPrayers.filter(p => p.status === 'Active');
  const answeredPrayers = myPrayers.filter(p => p.status === 'Answered');
  const claimableTasks = state.tasks.filter(t =>
    t.visibility === 'Organization' && !t.claimedBy && !t.assignedTo && t.status !== 'Completed'
  );
  const upcomingFollowUps = myPeople
    .filter(p => p.nextFollowUpDate && !isPast(parseISO(p.nextFollowUpDate)) && p.status !== 'Archived')
    .sort((a, b) => a.nextFollowUpDate!.localeCompare(b.nextFollowUpDate!))
    .slice(0, 3);

  const rhythmPct = state.rhythmItems.length
    ? Math.round((state.weeklyRhythm.completedItems.length / state.rhythmItems.length) * 100)
    : 0;

  const nextSermon = state.sermons
    .filter(s => s.preachingDate && s.status !== 'Preached')
    .sort((a, b) => (a.preachingDate ?? '').localeCompare(b.preachingDate ?? ''))
    [0];

  const myAssignedTasks = myTasks
    .filter(t => (t.assignedTo === currentUser.id || t.claimedBy === currentUser.id) && t.status !== 'Completed')
    .sort((a, b) => (a.dueDate ?? 'zzz').localeCompare(b.dueDate ?? 'zzz'))
    .slice(0, 5);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: currentUser.color }}>
            {currentUser.initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-800">
              Good {today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser.name.split(' ')[1] ?? currentUser.name.split(' ')[0]}.
            </h1>
            <p className="text-stone-500 text-sm">
              {format(today, 'EEEE, MMMM d, yyyy')} · {currentUser.title}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/tasks">
          <QuickAction label="Add Task" icon={Plus} color="bg-[#6aaa7e]/15 text-[#3d7a53] hover:bg-[#6aaa7e]/25" />
        </Link>
        <Link href="/prayer">
          <QuickAction label="Add Prayer" icon={Plus} color="bg-amber-50 text-amber-700 hover:bg-amber-100" />
        </Link>
        <Link href="/people">
          <QuickAction label="Add Person" icon={Plus} color="bg-blue-50 text-blue-700 hover:bg-blue-100" />
        </Link>
        <Link href="/sermons">
          <QuickAction label="Add Sermon" icon={Plus} color="bg-purple-50 text-purple-700 hover:bg-purple-100" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Open Tasks" value={openTasks.length} icon={CheckCircle2} color="" href="/tasks" />
        <StatCard label="Follow-Ups Due" value={followUpsNeeded.length} icon={AlertCircle} color="" href="/people" />
        <StatCard label="Active Prayers" value={activePrayers.length} icon={HeartHandshake} color="" href="/prayer" />
        <StatCard label="Sermons in Progress" value={state.sermons.filter(s => s.status !== 'Preached' && s.status !== 'Idea').length} icon={BookOpen} color="" href="/sermons" />
        <StatCard label="Rhythm Complete" value={rhythmPct} icon={Calendar} color="" href="/rhythm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Focus */}
        <div className="lg:col-span-2 space-y-5">

          {/* My Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#6aaa7e]" /> My Active Tasks
              </h2>
              <Link href="/tasks" className="text-xs text-stone-400 hover:text-stone-600">View all →</Link>
            </div>
            {myAssignedTasks.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-4">No tasks assigned to you. ✓</p>
            ) : (
              <div className="space-y-2">
                {myAssignedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 group">
                    <PriorityDot priority={task.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 font-medium truncate">{task.title}</p>
                      <p className="text-xs text-stone-400">
                        {task.category} · {task.dueDate ? format(parseISO(task.dueDate), 'MMM d') : 'No due date'}
                      </p>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      task.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                      task.status === 'Waiting' ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-500'
                    )}>{task.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
              <h2 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
                <Flame size={15} className="text-red-500" /> Overdue Items
              </h2>
              <div className="space-y-2">
                {overdueTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-center gap-3">
                    <PriorityDot priority={task.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-red-800 font-medium truncate">{task.title}</p>
                      <p className="text-xs text-red-400">
                        Due {task.dueDate ? format(parseISO(task.dueDate), 'MMM d') : '—'}
                      </p>
                    </div>
                    <UserAvatar userId={task.assignedTo} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Sermon */}
          {nextSermon && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-stone-800 flex items-center gap-2">
                  <BookOpen size={16} className="text-purple-500" /> Next Sermon
                </h2>
                <Link href="/sermons" className="text-xs text-stone-400 hover:text-stone-600">View all →</Link>
              </div>
              <div>
                <p className="font-semibold text-stone-800">{nextSermon.title}</p>
                <p className="text-sm text-stone-500 mt-0.5">
                  {nextSermon.scriptureText ?? 'No scripture set'} · {nextSermon.preachingDate ? format(parseISO(nextSermon.preachingDate), 'MMMM d') : 'Date TBD'}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Status: {nextSermon.status}</span>
                    <span>{['Idea','Researching','Outlining','Drafting','Ready','Preached'].indexOf(nextSermon.status) + 1}/6</span>
                  </div>
                  <SermonStatusBar status={nextSermon.status} />
                </div>
                {nextSermon.bigIdea && (
                  <p className="text-xs text-stone-500 mt-3 italic border-l-2 border-purple-200 pl-3">
                    "{nextSermon.bigIdea}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Claimable Tasks */}
          {claimableTasks.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-stone-800 flex items-center gap-2">
                  <Users size={16} className="text-blue-500" /> Available to Claim
                </h2>
                <Link href="/tasks" className="text-xs text-stone-400 hover:text-stone-600">View all →</Link>
              </div>
              <div className="space-y-2">
                {claimableTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50/50">
                    <PriorityDot priority={task.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 font-medium truncate">{task.title}</p>
                      <p className="text-xs text-stone-400">{task.category} · {task.dueDate ? format(parseISO(task.dueDate), 'MMM d') : 'No due date'}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Unclaimed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Rhythm Progress */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-800 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#6aaa7e]" /> Weekly Rhythm
              </h2>
              <Link href="/rhythm" className="text-xs text-stone-400 hover:text-stone-600">View →</Link>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-stone-500 mb-1.5">
                <span>{state.weeklyRhythm.completedItems.length} of {state.rhythmItems.length} complete</span>
                <span className="font-semibold text-[#6aaa7e]">{rhythmPct}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-[#6aaa7e] transition-all" style={{ width: `${rhythmPct}%` }} />
              </div>
            </div>
            <div className="space-y-1.5">
              {state.rhythmItems.slice(0, 5).map(item => {
                const done = state.weeklyRhythm.completedItems.includes(item.id);
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className={cn("w-3.5 h-3.5 rounded-full border-2 shrink-0",
                      done ? 'bg-[#6aaa7e] border-[#6aaa7e]' : 'border-stone-300'
                    )}>
                      {done && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                    </div>
                    <span className={cn("text-xs", done ? 'text-stone-400 line-through' : 'text-stone-600')}>{item.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Follow-Ups */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-800 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" /> Upcoming Follow-Ups
              </h2>
              <Link href="/people" className="text-xs text-stone-400 hover:text-stone-600">View →</Link>
            </div>
            {upcomingFollowUps.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-3">All caught up!</p>
            ) : (
              <div className="space-y-3">
                {upcomingFollowUps.map(person => (
                  <div key={person.id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                      {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-stone-700 font-medium truncate">{person.name}</p>
                      <p className="text-xs text-stone-400">
                        {person.careCategory} · {person.nextFollowUpDate ? format(parseISO(person.nextFollowUpDate), 'MMM d') : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Answered Prayers */}
          {answeredPrayers.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
              <h2 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                <HeartHandshake size={16} className="text-amber-500" /> Answered Prayers 🙏
              </h2>
              <div className="space-y-2">
                {answeredPrayers.slice(0, 3).map(p => (
                  <div key={p.id} className="text-xs text-amber-700 bg-white/60 rounded-lg p-2.5">
                    <p className="font-medium">{p.personName}</p>
                    <p className="text-amber-600 truncate mt-0.5">{p.request}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Prayers */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-800 flex items-center gap-2">
                <HeartHandshake size={16} className="text-rose-400" /> Prayer Requests
              </h2>
              <Link href="/prayer" className="text-xs text-stone-400 hover:text-stone-600">View →</Link>
            </div>
            {activePrayers.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-3">No active prayer requests.</p>
            ) : (
              <div className="space-y-2.5">
                {activePrayers.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-700">{p.personName}</p>
                      <p className="text-xs text-stone-400 line-clamp-2">{p.request}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
