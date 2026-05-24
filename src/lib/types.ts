export type Role = 'super_admin' | 'hr_manager' | 'dept_manager' | 'employee' | 'accountant';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type EmployeeStatus = 'active' | 'inactive' | 'terminated';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type PayrollStatus = 'draft' | 'processed' | 'paid';
export type DocumentType = 'contract' | 'id_card' | 'passport' | 'work_permit' | 'visa' | 'certificate' | 'warning' | 'salary_letter' | 'other';
export type JobStatus = 'open' | 'closed' | 'on_hold';
export type CandidateStatus = 'applied' | 'screening' | 'interview' | 'offered' | 'hired' | 'rejected';

export interface Department {
  id: string;
  name: string;
  code?: string;
  manager_id?: string;
  created_at: string;
  manager?: Employee;
  _count?: { employees: number };
}

export interface Designation {
  id: string;
  name: string;
  department_id?: string;
  created_at: string;
  department?: Department;
}

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  date_of_birth?: string;
  nationality?: string;
  address?: string;
  department_id?: string;
  designation_id?: string;
  joining_date: string;
  employment_type: EmploymentType;
  basic_salary: number;
  bank_name?: string;
  bank_account?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  status: EmployeeStatus;
  notes?: string;
  created_at: string;
  department?: Department;
  designation?: Designation;
}

export interface Profile {
  id: string;
  role: Role;
  employee_id?: string;
  created_at: string;
  employee?: Employee;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: AttendanceStatus;
  overtime_hours: number;
  notes?: string;
  created_at: string;
  employee?: Employee;
}

export interface LeaveType {
  id: string;
  name: string;
  days_allowed: number;
  is_paid: boolean;
  carry_forward: boolean;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  leave_type?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason?: string;
  status: LeaveStatus;
  approved_by?: string;
  comments?: string;
  created_at: string;
  employee?: Employee;
  leave_type?: LeaveType;
  approver?: Employee;
}

export interface Payroll {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime_pay: number;
  bonus: number;
  advance_deduction: number;
  leave_deduction: number;
  net_salary: number;
  status: PayrollStatus;
  processed_at?: string;
  notes?: string;
  created_at: string;
  employee?: Employee;
}

export interface Document {
  id: string;
  employee_id: string;
  type: DocumentType;
  name: string;
  file_url?: string;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  employee?: Employee;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id?: string;
  period: string;
  rating?: number;
  kpi_score?: number;
  feedback?: string;
  goals?: string;
  created_at: string;
  employee?: Employee;
  reviewer?: Employee;
}

export interface JobPosting {
  id: string;
  title: string;
  department_id?: string;
  description?: string;
  requirements?: string;
  vacancies: number;
  status: JobStatus;
  created_at: string;
  department?: Department;
  _count?: { candidates: number };
}

export interface Candidate {
  id: string;
  job_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  status: CandidateStatus;
  interview_date?: string;
  notes?: string;
  created_at: string;
  job?: JobPosting;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_by?: string;
  created_at: string;
  creator?: Employee;
}

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
  dept_manager: 'Dept. Manager',
  employee: 'Employee',
  accountant: 'Accountant',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-yellow-100 text-yellow-700',
  terminated: 'bg-red-100 text-red-700',
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  half_day: 'bg-blue-100 text-blue-700',
  holiday: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-600',
  processed: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  open: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  applied: 'bg-blue-100 text-blue-700',
  screening: 'bg-purple-100 text-purple-700',
  interview: 'bg-indigo-100 text-indigo-700',
  offered: 'bg-yellow-100 text-yellow-700',
  hired: 'bg-green-100 text-green-700',
};

export function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function daysUntilExpiry(expiry?: string | null) {
  if (!expiry) return null;
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
}
