'use client';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const sb = getSupabase();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <svg width="72" height="64" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="5" fill="white" fillOpacity="0.7"/>
              <path d="M1 31 C1 20 9 18 9 18 C9 18 17 20 17 31" stroke="white" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <circle cx="19" cy="7" r="6" fill="white"/>
              <path d="M7 32 C7 18 19 16 19 16 C19 16 31 18 31 32" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <circle cx="29" cy="9" r="5" fill="white" fillOpacity="0.7"/>
              <path d="M21 31 C21 20 29 18 29 18 C29 18 37 20 37 31" stroke="white" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-1px', margin: 0 }}>SQUAD</h1>
          <p className="text-blue-300 mt-1">HR Management System</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Sign in to your account</h2>
          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input className="form-input pr-12" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
