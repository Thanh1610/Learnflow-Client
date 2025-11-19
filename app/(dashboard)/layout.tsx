import { type ReactNode } from 'react';

import {
  AppSidebarServer,
  DashboardLayout,
} from '@/app/components/organisms/Sidebar';

export default function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardLayout sidebar={<AppSidebarServer />}>{children}</DashboardLayout>
  );
}
