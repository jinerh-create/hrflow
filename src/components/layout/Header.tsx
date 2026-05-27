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
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'white',
      borderBottom: '1px solid #E8EDF5',
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Home size={14} color="#94A3B8" />
        <ChevronRight size={12} color="#CBD5E1" />
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={12} color="#CBD5E1" />}
            <span style={{
              fontSize: 14,
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
              color: i === crumbs.length - 1 ? '#0F172A' : '#94A3B8',
            }}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }} />
          <input
            placeholder="Search..."
            style={{
              paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              width: 190, fontSize: 13,
              border: '1.5px solid #E8EDF5', borderRadius: 9,
              background: '#F8FAFC', outline: 'none',
              fontFamily: 'inherit', color: '#374151',
            }}
          />
        </div>

        {/* Settings */}
        <button style={{
          padding: 8, borderRadius: 9, cursor: 'pointer',
          color: '#94A3B8', background: 'none', border: 'none', display: 'flex',
        }}>
          <Settings size={17} />
        </button>

        {/* Bell */}
        <button style={{
          padding: 8, borderRadius: 9, cursor: 'pointer',
          color: '#94A3B8', background: 'none', border: 'none',
          display: 'flex', position: 'relative',
        }}>
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 7, height: 7, background: '#EF4444', borderRadius: '50%',
            border: '1.5px solid white',
          }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 30, background: '#E8EDF5', margin: '0 6px' }} />

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0DC9A0 0%, #0994A0 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {getInitials(userName)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{userName}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
