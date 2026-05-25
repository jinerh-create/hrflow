import Sidebar from './Sidebar';
import Header from './Header';

interface Props {
  children: React.ReactNode;
  title: string;
  userName?: string;
  userRole?: string;
}

export default function AppShell({ children, title, userName, userRole }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F4F8]">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px] overflow-hidden">
        <Header title={title} userName={userName} userRole={userRole} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
