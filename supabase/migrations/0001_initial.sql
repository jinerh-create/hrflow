-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  manager_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designations
CREATE TABLE designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  photo_url TEXT,
  date_of_birth DATE,
  nationality TEXT,
  address TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  designation_id UUID REFERENCES designations(id) ON DELETE SET NULL,
  joining_date DATE NOT NULL,
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time','part_time','contract','intern')),
  basic_salary DECIMAL(12,2) DEFAULT 0,
  bank_name TEXT,
  bank_account TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK for department manager
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Profiles (links Supabase auth user to employee + role)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin','hr_manager','dept_manager','employee','accountant')),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','half_day','holiday')),
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Leave types
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  days_allowed INTEGER NOT NULL DEFAULT 0,
  is_paid BOOLEAN DEFAULT TRUE,
  carry_forward BOOLEAN DEFAULT FALSE
);

-- Seed leave types
INSERT INTO leave_types (name, days_allowed, is_paid) VALUES
  ('Annual Leave', 20, TRUE),
  ('Sick Leave', 10, TRUE),
  ('Emergency Leave', 5, TRUE),
  ('Unpaid Leave', 30, FALSE),
  ('Maternity Leave', 90, TRUE),
  ('Paternity Leave', 14, TRUE);

-- Leave balances
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  UNIQUE(employee_id, leave_type_id, year)
);

-- Leave requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by UUID REFERENCES employees(id),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  allowances DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  overtime_pay DECIMAL(12,2) DEFAULT 0,
  bonus DECIMAL(12,2) DEFAULT 0,
  advance_deduction DECIMAL(12,2) DEFAULT 0,
  leave_deduction DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','processed','paid')),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('contract','id_card','passport','work_permit','visa','certificate','warning','salary_letter','other')),
  name TEXT NOT NULL,
  file_url TEXT,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance reviews
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES employees(id),
  period TEXT NOT NULL, -- e.g. "2024-Q1"
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  kpi_score DECIMAL(5,2),
  feedback TEXT,
  goals TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job postings
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  description TEXT,
  requirements TEXT,
  vacancies INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed','on_hold')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied','screening','interview','offered','hired','rejected')),
  interview_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_period ON payroll(year, month);
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_documents_expiry ON documents(expiry_date);

-- RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- HR roles can read all employees
CREATE POLICY "employees_auth_read" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "employees_admin_write" ON employees FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_manager'))
);

-- All authenticated users can read departments/designations/leave_types
CREATE POLICY "departments_read" ON departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "departments_write" ON departments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_manager'))
);
CREATE POLICY "designations_read" ON designations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "leave_types_read" ON leave_types FOR SELECT USING (auth.role() = 'authenticated');

-- Attendance
CREATE POLICY "attendance_read" ON attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "attendance_write" ON attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_manager','dept_manager'))
);

-- Leave requests
CREATE POLICY "leave_requests_read" ON leave_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "leave_requests_insert" ON leave_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "leave_requests_update" ON leave_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_manager','dept_manager'))
);

-- Payroll
CREATE POLICY "payroll_read" ON payroll FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "payroll_write" ON payroll FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_manager','accountant'))
);

-- Documents
CREATE POLICY "documents_read" ON documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "documents_write" ON documents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_manager'))
);

-- Announcements
CREATE POLICY "announcements_read" ON announcements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "announcements_write" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_manager'))
);

-- Seed demo data
INSERT INTO departments (name, code) VALUES
  ('Human Resources', 'HR'),
  ('Engineering', 'ENG'),
  ('Finance', 'FIN'),
  ('Sales', 'SALES'),
  ('Operations', 'OPS');

INSERT INTO designations (name, department_id) VALUES
  ('HR Manager', (SELECT id FROM departments WHERE code='HR')),
  ('HR Officer', (SELECT id FROM departments WHERE code='HR')),
  ('Software Engineer', (SELECT id FROM departments WHERE code='ENG')),
  ('Senior Engineer', (SELECT id FROM departments WHERE code='ENG')),
  ('Accountant', (SELECT id FROM departments WHERE code='FIN')),
  ('Finance Manager', (SELECT id FROM departments WHERE code='FIN')),
  ('Sales Executive', (SELECT id FROM departments WHERE code='SALES')),
  ('Sales Manager', (SELECT id FROM departments WHERE code='SALES'));
