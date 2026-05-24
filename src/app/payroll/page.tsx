import AppShell from '@/components/layout/AppShell';
import PayrollManager from '@/components/payroll/PayrollManager';

export default function PayrollPage() {
  return (
    <AppShell title="Payroll">
      <PayrollManager />
    </AppShell>
  );
}
