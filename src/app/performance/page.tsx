export const dynamic = 'force-dynamic';
import AppShell from '@/components/layout/AppShell';
import PerformanceManager from '@/components/performance/PerformanceManager';
export default function PerformancePage() {
  return <AppShell title="Performance"><PerformanceManager /></AppShell>;
}

