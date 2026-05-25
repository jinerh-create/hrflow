'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarOff,
  Banknote, FolderOpen, TrendingUp, Briefcase,
  Megaphone, BarChart3, LogOut, Building2,
  Inbox, CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/performance', label: 'Performance', icon: TrendingUp },
  { href: '/payroll', label: 'Payroll', icon: Banknote },
  { href: '/leave', label: 'Leave Management', icon: CalendarOff },
  { href: '/recruitment', label: 'Recruitment', icon: Briefcase },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await getSupabase().auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-[260px] bg-white border-r border-gray-100 flex flex-col z-30 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-gray-900 font-bold text-base leading-none">HRFlow</div>
          <div className="text-emerald-600 text-xs mt-0.5 font-medium">Management System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              active
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            )}>
              <Icon className={cn('flex-shrink-0', active ? 'text-emerald-600' : 'text-gray-400')} size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="mx-3 mb-3 rounded-2xl bg-emerald-500 p-4 text-white">
        <p className="text-xs font-bold mb-1">Level Up Your HR System</p>
        <p className="text-[11px] text-emerald-100 leading-snug mb-3">Take full control with advanced modules and extended quotas.</p>
        <button className="w-full py-1.5 rounded-lg bg-white text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors">
          Get HRFlow Pro
        </button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-3 border-t border-gray-100 pt-2">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
