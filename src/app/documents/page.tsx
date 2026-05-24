import AppShell from '@/components/layout/AppShell';
import DocumentsManager from '@/components/documents/DocumentsManager';

export default function DocumentsPage() {
  return (
    <AppShell title="Documents">
      <DocumentsManager />
    </AppShell>
  );
}
