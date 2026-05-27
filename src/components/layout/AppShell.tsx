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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="app-content">
        <Header title={title} breadcrumb={breadcrumb} userName={userName} userRole={userRole} />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
