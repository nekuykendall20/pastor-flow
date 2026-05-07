'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import { HeartHandshake, Menu } from 'lucide-react';
import { useApp } from '@/lib/supabase-context';

const AUTH_PATHS = ['/login', '/onboarding', '/auth'];

export default function ConditionalSidebar() {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { state } = useApp();

  // Close drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (isAuthPage) return null;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* ── Mobile top header bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#1c2b22] flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#6aaa7e] flex items-center justify-center shrink-0">
            <HeartHandshake size={14} className="text-white" />
          </div>
          <div>
            <span className="text-white font-semibold text-sm leading-tight block">Pastor Flow</span>
            {state.settings.organizationName && (
              <span className="text-white/40 text-[10px] leading-tight block">{state.settings.organizationName}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Mobile slide-over drawer ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative w-72 max-w-[85vw] h-full overflow-y-auto shadow-2xl animate-slide-in-left">
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
