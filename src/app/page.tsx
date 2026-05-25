export const dynamic = 'force-dynamic';
import AppShell from '@/components/layout/AppShell';
import Dashboard from '@/components/dashboard/Dashboard';

export default function HomePage() {
  return (
    <AppShell title="Dashboard">
      <Dashboard />
    </AppShell>
  );
}

