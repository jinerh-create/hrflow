export const dynamic = 'force-dynamic';
import AppShell from '@/components/layout/AppShell';
import DutySchedule from '@/components/duty/DutySchedule';

export default function DutySchedulePage() {
  return (
    <AppShell title="Duty Schedule">
      <DutySchedule />
    </AppShell>
  );
}
