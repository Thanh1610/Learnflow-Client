'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useSidebar } from './SidebarContext';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

export function DashboardLayout({
  children,
  sidebar,
  className,
}: DashboardLayoutProps) {
  const { isOpen, isMobile } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-y-auto transition-all duration-300',
          !isMobile && isOpen && 'ml-[280px]',
          !isMobile && !isOpen && 'ml-[72px]',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
