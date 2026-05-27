'use client';
import { Bell, Search, Settings, ChevronRight, Home } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface Props {
  title: string;
  breadcrumb?: string[];
  userName?: string;
  userRole?: string;
}

export default function Header({ title, breadcrumb, userName = 'Admin', userRole = 'HR Manager' }: Props) {
  const crumbs = breadcrumb ?? [title];

  return (
    <header className="app-header">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
        <Home size={14} color="#9ca3af" />
        <ChevronRight size={13} color="#d1d5db" />
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={13} color="#d1d5db" />}
            <span style={{
              fontWeight: i === crumbs.length - 1 ? 600 : 500,
              color: i === crumbs.length - 1 ? '#111827' : '#9ca3af',
            }}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }} />
          <input
            placeholder="Search..."
            className="form-input"
            style={{ paddingLeft: 32, paddingRight: 12, width: 200, paddingTop: 7, paddingBottom: 7, fontSize: '0.8125rem' }}
          />
        </div>

        {/* Settings */}
        <button style={{ padding: 8, borderRadius: 9, cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
          className="btn-ghost btn">
          <Settings size={17} />
        </button>

        {/* Notifications */}
        <button style={{ padding: 8, borderRadius: 9, cursor: 'pointer', color: '#9ca3af', display: 'flex', position: 'relative' }}
          className="btn-ghost btn">
          <Bell size={17} />
          <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: '#ef4444', borderRadius: '50%' }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: '#e8edf2', margin: '0 4px' }} />

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#0DC9A0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.75rem', fontWeight: 700,
            flexShrink: 0,
          }}>
            {getInitials(userName)}
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937', lineHeight: 1.2 }}>{userName}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
