import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SQUAD — HR Management System',
  description: 'Modern HR management for teams',
};

const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #F4F6F9;
  color: #111827;
  line-height: 1.5;
}

a { color: inherit; text-decoration: none; }
button { cursor: pointer; border: none; background: none; font: inherit; color: inherit; }
input, select, textarea { font: inherit; color: inherit; }

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }

/* ── Layout ── */
.sidebar {
  position: fixed; top: 0; left: 0;
  width: 260px; height: 100vh;
  background: white;
  border-right: 1px solid #e8edf2;
  display: flex; flex-direction: column;
  z-index: 30;
}

.sidebar-logo {
  display: flex; align-items: center; gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #e8edf2;
  flex-shrink: 0;
}

.sidebar-logo-icon {
  width: 38px; height: 38px; border-radius: 11px;
  background: #0DC9A0;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(13,201,160,0.35);
}

.sidebar-nav {
  flex: 1; overflow-y: auto;
  padding: 10px;
  display: flex; flex-direction: column; gap: 2px;
}

.nav-item {
  display: flex; align-items: center; gap: 11px;
  padding: 9px 11px;
  border-radius: 9px;
  font-size: 0.875rem; font-weight: 500;
  color: #6b7280;
  transition: all 0.13s;
  text-decoration: none;
}
.nav-item:hover { background: #f9fafb; color: #1f2937; }
.nav-item.active { background: #E6FAF5; color: #1f2937; font-weight: 600; }

.sidebar-cta {
  margin: 10px; border-radius: 14px;
  padding: 14px; background: #0DC9A0; color: white;
  flex-shrink: 0;
}

.sidebar-logout {
  padding: 10px; border-top: 1px solid #e8edf2;
  flex-shrink: 0;
}

.app-content {
  margin-left: 260px;
  display: flex; flex-direction: column;
  min-height: 100vh;
}

.app-header {
  position: sticky; top: 0; z-index: 20;
  background: white;
  border-bottom: 1px solid #e8edf2;
  height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
}

.app-main { flex: 1; padding: 24px; }

/* ── Cards ── */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #edf1f7;
  padding: 24px;
}

/* ── Badge ── */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 0.72rem; font-weight: 600;
}

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 600; font-size: 0.875rem;
  transition: all 0.13s;
  cursor: pointer; border: none; font-family: inherit;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary { background: #0DC9A0; color: white; }
.btn-primary:hover { background: #0AA88A; }

.btn-secondary { background: #f3f4f6; color: #374151; }
.btn-secondary:hover { background: #e5e7eb; }

.btn-danger { background: #fef2f2; color: #dc2626; }
.btn-danger:hover { background: #fee2e2; }

.btn-ghost { color: #6b7280; }
.btn-ghost:hover { background: #f3f4f6; color: #374151; }

.btn-outline { border: 1.5px solid #0DC9A0 !important; color: #0DC9A0; background: transparent; }
.btn-outline:hover { background: #EDFDF9; }

.btn-sm { padding: 5px 12px; font-size: 0.75rem; }

/* ── Forms ── */
.form-label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 6px; }
.form-input {
  width: 100%; border-radius: 10px;
  border: 1.5px solid #e5e7eb; background: white;
  padding: 9px 14px; font-size: 0.875rem; font-family: inherit;
  outline: none; transition: border-color 0.13s, box-shadow 0.13s;
}
.form-input:focus { border-color: #0DC9A0; box-shadow: 0 0 0 3px rgba(13,201,160,0.12); }
.form-select { appearance: none; }
.form-textarea { resize: none; }

/* ── Modal ── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
  z-index: 40; display: flex; align-items: flex-end; justify-content: center; padding: 16px;
}
@media (min-width: 640px) { .modal-backdrop { align-items: center; } }
.modal {
  background: white; border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  width: 100%; max-width: 32rem; max-height: 90vh; overflow-y: auto; z-index: 50;
}

/* ── Table ── */
.tbl { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
.tbl thead { background: #f8fafc; }
.tbl th { padding: 11px 16px; text-align: left; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
.tbl td { padding: 11px 16px; border-top: 1px solid #f1f5f9; }
.tbl tr:hover td { background: #f0fdf9; }

/* ── Misc ── */
.avatar { border-radius: 9999px; object-fit: cover; flex-shrink: 0; }
.section-title { font-size: 1.0625rem; font-weight: 700; color: #1f2937; }
.section-sub { font-size: 0.875rem; color: #6b7280; }
.stat-num { font-size: 1.5rem; font-weight: 700; color: #111827; }
.stat-label { font-size: 0.8125rem; color: #6b7280; font-weight: 500; }
.ring-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Tailwind CDN — handles utility classes without needing the CSS file to be served */}
        <script src="https://cdn.tailwindcss.com" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
