'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarOff,
  Banknote, FolderOpen, TrendingUp, Briefcase,
  Megaphone, BarChart3, LogOut,
  Inbox, CalendarDays,
} from 'lucide-react';
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
    <aside style={{
      position: 'fixed', top: 0, left: 0,
      width: 260, height: '100vh',
      background: 'white',
      borderRight: '1px solid #E8EDF5',
      display: 'flex', flexDirection: 'column',
      zIndex: 30,
      boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 20px',
        borderBottom: '1px solid #E8EDF5',
        flexShrink: 0,
      }}>
        <img
          src="/squad-logo.png"
          alt="SQUAD"
          style={{ height: 38, width: 'auto', objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1 }}>SQUAD</div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginTop: 2, letterSpacing: '0.05em' }}>MANAGEMENT SYSTEM</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 12px',
              borderRadius: 9,
              fontSize: 14, fontWeight: active ? 600 : 500,
              color: active ? '#0F172A' : '#64748B',
              background: active ? '#E6FAF5' : 'transparent',
              marginBottom: 2,
              textDecoration: 'none',
              transition: 'all 0.12s',
            }}>
              <Icon size={17} color={active ? '#0DC9A0' : '#94A3B8'} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* CTA */}
      <div style={{
        margin: '0 10px 10px',
        borderRadius: 14,
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #0DC9A0 0%, #0994A0 100%)',
        color: 'white',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Level Up Your HR</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45, marginBottom: 10 }}>
          Advanced analytics, payroll automation, and more.
        </div>
        <button style={{
          width: '100%', padding: '7px 0', borderRadius: 8,
          background: 'rgba(255,255,255,0.95)', color: '#0994A0',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
          fontFamily: 'inherit',
        }}>
          Get SQUAD Pro
        </button>
      </div>

      {/* Logout */}
      <div style={{ padding: '0 10px 12px', borderTop: '1px solid #E8EDF5', paddingTop: 10 }}>
        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 11,
          padding: '9px 12px', borderRadius: 9,
          fontSize: 14, fontWeight: 500, color: '#64748B',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}>
          <LogOut size={17} color="#94A3B8" />
          Logout
        </button>
      </div>
    </aside>
  );
}
