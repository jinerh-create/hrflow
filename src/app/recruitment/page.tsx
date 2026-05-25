export const dynamic = 'force-dynamic';
import AppShell from '@/components/layout/AppShell';
import RecruitmentManager from '@/components/recruitment/RecruitmentManager';

export default function RecruitmentPage() {
  return (
    <AppShell title="Recruitment">
      <RecruitmentManager />
    </AppShell>
  );
}

