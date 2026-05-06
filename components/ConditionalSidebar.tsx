'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';

const AUTH_PATHS = ['/login', '/onboarding', '/auth'];

export default function ConditionalSidebar() {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));
  if (isAuthPage) return null;
  return <Sidebar />;
}
