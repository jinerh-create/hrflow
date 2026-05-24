'use client';
import { useEffect, useState } from 'react';
import { Plus, Briefcase, Users } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { JobPosting, Candidate, Department } from '@/lib/types';
import { fmtDate } from '@/lib/types';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';

const PIPELINE: Candidate['status'][] = ['applied','screening','interview','offered','hired','rejected'];

export default function RecruitmentManager() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  const fetchData = async () => {
    setLoading(true);
    const [jRes, dRes] = await Promise.all([
      sb.from('job_postings').select('*, department:departments(name)').order('created_at', { ascending: false }),
      sb.from('departments').select('*').order('name'),
    ]);
    setJobs((jRes.data ?? []) as any);
    setDepartments(dRes.data ?? []);
    setLoading(false);
  };

  const fetchCandidates = async (jobId: string) => {
    const { data } = await sb.from('candidates').select('*').eq('job_id', jobId).order('created_at', { ascending: false });
    setCandidates((data ?? []) as any);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (selectedJob) fetchCandidates(selectedJob); }, [selectedJob]);

  async function updateCandidateStatus(id: string, status: Candidate['status']) {
    await sb.from('candidates').update({ status }).eq('id', id);
    if (selectedJob) fetchCandidates(selectedJob);
  }

  const selectedJobData = jobs.find(j => j.id === selectedJob);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-700">Job Postings ({jobs.length})</h2>
        <button onClick={() => setShowAddJob(true)} className="btn-primary"><Plus size={15} /> New Job</button>
      </div>

      {/* Job cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map(job => (
          <button key={job.id} onClick={() => setSelectedJob(job.id)}
            className={`card text-left transition-all hover:shadow-md ${selectedJob === job.id ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50"><Briefcase className="text-blue-600" size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{job.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{(job as any).department?.name ?? 'All Departments'}</p>
              </div>
              <Badge status={job.status} />
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Users size={12} /> {job.vacancies} vacancies</span>
              <span>{fmtDate(job.created_at)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Candidates pipeline */}
      {selectedJob && selectedJobData && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800">Pipeline — {selectedJobData.title}</h3>
            <button onClick={() => setShowAddCandidate(true)} className="btn-secondary text-sm"><Plus size={14} /> Add Candidate</button>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE.map(stage => {
              const stageCandidates = candidates.filter(c => c.status === stage);
              return (
                <div key={stage} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 capitalize">{stage} ({stageCandidates.length})</p>
                  <div className="space-y-2">
                    {stageCandidates.map(c => (
                      <div key={c.id} className="bg-white rounded-lg p-2 shadow-sm">
                        <p className="font-semibold text-xs text-slate-800">{c.full_name}</p>
                        <p className="text-xs text-slate-400 truncate">{c.email}</p>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {PIPELINE.filter(s => s !== stage && s !== 'rejected').map(s => (
                            <button key={s} onClick={() => updateCandidateStatus(c.id, s)}
                              className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors capitalize">
                              → {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAddJob && <AddJobModal departments={departments} onClose={() => setShowAddJob(false)} onSaved={fetchData} />}
      {showAddCandidate && selectedJob && <AddCandidateModal jobId={selectedJob} onClose={() => setShowAddCandidate(false)} onSaved={() => fetchCandidates(selectedJob)} />}
    </div>
  );
}

function AddJobModal({ departments, onClose, onSaved }: { departments: Department[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', department_id: '', description: '', requirements: '', vacancies: '1', status: 'open' });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();
  async function save() {
    if (!form.title) return;
    setSaving(true);
    await sb.from('job_postings').insert({ ...form, vacancies: Number(form.vacancies) });
    setSaving(false); onSaved(); onClose();
  }
  return (
    <Modal title="New Job Posting" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="form-label">Job Title</label><input className="form-input" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">Department</label>
            <select className="form-select" value={form.department_id} onChange={e => setForm(f=>({...f,department_id:e.target.value}))}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Vacancies</label><input className="form-input" type="number" min="1" value={form.vacancies} onChange={e => setForm(f=>({...f,vacancies:e.target.value}))} /></div>
        </div>
        <div><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} /></div>
        <div><label className="form-label">Requirements</label><textarea className="form-input" rows={3} value={form.requirements} onChange={e => setForm(f=>({...f,requirements:e.target.value}))} /></div>
        <div className="flex gap-3"><button onClick={save} disabled={saving || !form.title} className="btn-primary flex-1">{saving?'Saving…':'Post Job'}</button><button onClick={onClose} className="btn-secondary">Cancel</button></div>
      </div>
    </Modal>
  );
}

function AddCandidateModal({ jobId, onClose, onSaved }: { jobId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();
  async function save() {
    if (!form.full_name || !form.email) return;
    setSaving(true);
    await sb.from('candidates').insert({ ...form, job_id: jobId, status: 'applied' });
    setSaving(false); onSaved(); onClose();
  }
  return (
    <Modal title="Add Candidate" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="form-label">Full Name</label><input className="form-input" value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} /></div>
        <div><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></div>
        <div><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} /></div>
        <div><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} /></div>
        <div className="flex gap-3"><button onClick={save} disabled={saving} className="btn-primary flex-1">{saving?'Saving…':'Add Candidate'}</button><button onClick={onClose} className="btn-secondary">Cancel</button></div>
      </div>
    </Modal>
  );
}
