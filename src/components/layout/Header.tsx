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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <Home size={14} className="text-gray-400 flex-shrink-0" />
        <ChevronRight size={13} className="text-gray-300" />
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="text-gray-300" />}
            <span className={i === crumbs.length - 1
              ? 'font-semibold text-gray-900'
              : 'text-gray-400 font-medium'
            }>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            placeholder="Search anything..."
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 w-56 transition-all focus:outline-none focus:bg-white"
            style={{ '--tw-ring-color': '#0DC9A0' } as React.CSSProperties}
            onFocus={e => { e.currentTarget.style.borderColor = '#0DC9A0'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,201,160,0.15)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
          />
        </div>

        {/* Settings */}
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
          <Settings size={18} />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200 ml-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ background: '#0DC9A0' }}>
            {getInitials(userName)}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-gray-800 leading-none">{userName}</div>
            <div className="text-xs text-gray-400 mt-0.5">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
