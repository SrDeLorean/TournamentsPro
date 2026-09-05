import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-route-surface">
      <div className="dashboard-route-content">{children}</div>
    </div>
  );
}
