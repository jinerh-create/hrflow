import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HRFlow — HR Management System',
  description: 'Modern HR management for teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
