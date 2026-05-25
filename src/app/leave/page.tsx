export const dynamic = 'force-dynamic';
import AppShell from '@/components/layout/AppShell';
import LeaveManager from '@/components/leave/LeaveManager';

export default function LeavePage() {
  return (
    <AppShell title="Leave Management">
      <LeaveManager />
    </AppShell>
  );
}

