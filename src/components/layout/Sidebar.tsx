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
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Building2 size={20} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>HRFlow</div>
          <div style={{ fontSize: '0.7rem', color: '#0DC9A0', marginTop: 3, fontWeight: 600, letterSpacing: '0.02em' }}>Management System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link key={href} href={href} className={cn('nav-item', active && 'active')}>
              <Icon size={17} color={active ? '#0DC9A0' : '#9ca3af'} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="sidebar-cta">
        <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 4 }}>Level Up Your HR System</p>
        <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, marginBottom: 10 }}>
          Take full control with advanced modules and extended quotas.
        </p>
        <button style={{
          width: '100%', padding: '6px 0', borderRadius: 8,
          background: 'white', color: '#0DC9A0',
          fontSize: '0.75rem', fontWeight: 700,
          cursor: 'pointer', border: 'none',
        }}>
          Get HRFlow Pro
        </button>
      </div>

      {/* Logout */}
      <div className="sidebar-logout">
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%' }}>
          <LogOut size={17} color="#9ca3af" />
          <span style={{ color: '#6b7280' }}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
