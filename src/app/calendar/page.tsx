export const dynamic = 'force-dynamic';
import AppShell from '@/components/layout/AppShell';
import CalendarManager from '@/components/calendar/CalendarManager';

export default function CalendarPage() {
  return (
    <AppShell title="Calendar">
      <CalendarManager />
    </AppShell>
  );
}
