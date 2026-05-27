import Sidebar from './Sidebar';
import Header from './Header';

interface Props {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string[];
  userName?: string;
  userRole?: string;
}

export default function AppShell({ children, title, breadcrumb, userName, userRole }: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F4F8', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Sidebar />
      <div style={{ marginLeft: 260, display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <Header title={title} breadcrumb={breadcrumb} userName={userName} userRole={userRole} />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
