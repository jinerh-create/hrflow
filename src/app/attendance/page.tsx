import AppShell from '@/components/layout/AppShell';
import AttendanceManager from '@/components/attendance/AttendanceManager';

export default function AttendancePage() {
  return (
    <AppShell title="Attendance">
      <AttendanceManager />
    </AppShell>
  );
}
