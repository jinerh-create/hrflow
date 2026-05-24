'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Banknote, Building2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { Employee } from '@/lib/types';
import { fmtDate, fmtMoney } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import AppShell from '@/components/layout/AppShell';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  useEffect(() => {
    sb.from('employees').select('*, department:departments(name), designation:designations(name)').eq('id', id).single()
      .then(({ data }) => { setEmp(data as any); setLoading(false); });
  }, [id]);

  if (loading || !emp) return <AppShell title="Employee"><div className="text-center py-16 text-slate-400">Loading…</div></AppShell>;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) => (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-slate-50 flex-shrink-0"><Icon size={16} className="text-slate-500" /></div>
      <div><p className="text-xs text-slate-400 font-medium">{label}</p><p className="text-sm font-semibold text-slate-700 mt-0.5">{value ?? '—'}</p></div>
    </div>
  );

  return (
    <AppShell title={emp.full_name}>
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="btn-ghost"><ArrowLeft size={16} /> Back</button>

        {/* Profile card */}
        <div className="card">
          <div className="flex items-start gap-6">
            <Avatar name={emp.full_name} photoUrl={emp.photo_url} size={80} />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{emp.full_name}</h2>
                  <p className="text-slate-500 mt-1">{(emp as any).designation?.name ?? '—'} · {(emp as any).department?.name ?? '—'}</p>
                </div>
                <Badge status={emp.status} />
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded-lg">{emp.employee_code}</span>
                <span className="text-sm text-slate-500 capitalize">{emp.employment_type.replace(/_/g,' ')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Contact Information</h3>
            <InfoRow icon={Mail} label="Email" value={emp.email} />
            <InfoRow icon={Phone} label="Phone" value={emp.phone} />
            <InfoRow icon={MapPin} label="Address" value={emp.address} />
          </div>
          <div className="card space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Employment Details</h3>
            <InfoRow icon={Calendar} label="Joining Date" value={fmtDate(emp.joining_date)} />
            <InfoRow icon={Calendar} label="Date of Birth" value={fmtDate(emp.date_of_birth)} />
            <InfoRow icon={Banknote} label="Basic Salary" value={fmtMoney(emp.basic_salary)} />
            <InfoRow icon={Building2} label="Nationality" value={emp.nationality} />
          </div>
          <div className="card space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Bank Details</h3>
            <InfoRow icon={Banknote} label="Bank Name" value={emp.bank_name} />
            <InfoRow icon={Banknote} label="Account Number" value={emp.bank_account} />
          </div>
          <div className="card space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Emergency Contact</h3>
            <InfoRow icon={Phone} label="Name" value={emp.emergency_contact_name} />
            <InfoRow icon={Phone} label="Phone" value={emp.emergency_contact_phone} />
          </div>
        </div>

        {emp.notes && (
          <div className="card">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-2">Notes</h3>
            <p className="text-sm text-slate-600">{emp.notes}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
