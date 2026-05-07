'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CheckSquare, Users, BookOpen,
  HeartHandshake, CalendarDays, CalendarRange, Settings, ChevronDown,
  Building2, User, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/supabase-context';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/people', label: 'People Care', icon: HeartHandshake },
  { href: '/sermons', label: 'Sermons', icon: BookOpen },
  { href: '/prayer', label: 'Prayer', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/rhythm', label: 'Weekly Rhythm', icon: CalendarRange },
  { href: '/ai', label: 'AI Assistant', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { state, users, currentUser, setCurrentUser, setOrgView, signOut, orgMembers } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <aside className="w-64 min-h-screen bg-[#1c2b22] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6aaa7e] flex items-center justify-center">
            <HeartHandshake size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-[15px] leading-tight">Pastor Flow</h1>
            <p className="text-white/40 text-[10px] leading-tight mt-0.5">
              {state.settings.organizationName}
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-white/5 rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setOrgView(false)}
            className={cn(
              'flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all',
              !state.orgViewEnabled
                ? 'bg-[#6aaa7e] text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            )}
          >
            <User size={11} className="inline mr-1" />
            My View
          </button>
          <button
            onClick={() => setOrgView(true)}
            className={cn(
              'flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all',
              state.orgViewEnabled
                ? 'bg-[#6aaa7e] text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            )}
          >
            <Building2 size={11} className="inline mr-1" />
            Org View
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2 mt-2">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 group',
                active
                  ? 'bg-[#6aaa7e]/20 text-[#a8d5b0]'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5'
              )}
            >
              <Icon
                size={16}
                className={cn(active ? 'text-[#6aaa7e]' : 'text-white/40 group-hover:text-white/60')}
              />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Sign Out */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-xs font-medium truncate">{currentUser.name}</p>
              <p className="text-white/40 text-[10px] truncate capitalize">{currentUser.role}</p>
            </div>
            <ChevronDown size={13} className="text-white/30 shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#243329] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              {orgMembers.length > 1 && (
                <>
                  <p className="text-white/30 text-[9px] font-semibold uppercase tracking-widest px-3 pt-2 pb-1">
                    View as
                  </p>
                  {orgMembers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => { setCurrentUser(user.id); setUserMenuOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-all text-left',
                        user.id === state.currentUserId && 'bg-white/5'
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white/90 text-[11px] font-medium truncate">{user.name}</p>
                        <p className="text-white/40 text-[10px] truncate">{user.title}</p>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-white/10 my-1" />
                </>
              )}
              <button
                onClick={() => { signOut(); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-all text-left text-white/50 hover:text-white/80 text-xs"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
