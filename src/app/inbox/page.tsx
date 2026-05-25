export const dynamic = 'force-dynamic';
import AppShell from '@/components/layout/AppShell';
import InboxManager from '@/components/inbox/InboxManager';

export default function InboxPage() {
  return (
    <AppShell title="Inbox">
      <InboxManager />
    </AppShell>
  );
}
