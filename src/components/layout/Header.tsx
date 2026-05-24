'use client';
import { Bell, Search } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface Props {
  title: string;
  userName?: string;
  userRole?: string;
}

export default function Header({ title, userName = 'Admin', userRole = 'HR Manager' }: Props) {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(userName)}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-slate-700 leading-none">{userName}</div>
            <div className="text-xs text-slate-500 mt-0.5">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
