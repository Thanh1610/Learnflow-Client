'use client';

import AvatarPopover from '@/app/components/molecules/avatarPopover';
import { MenuItem } from '@/app/components/organisms/Sidebar/menuItems';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarItem, useSidebar } from './index';

function SidebarHeader() {
  const { isOpen, isMobile } = useSidebar();
  const isCollapsed = !isOpen && !isMobile;
  const user = useAuthStore(state => state.user);
  if (!user) {
    return null;
  }
  return (
    <div
      className={cn('flex items-center gap-2', isCollapsed && 'justify-center')}
    >
      {!isCollapsed && <h2 className="text-lg font-bold">LearnFlow</h2>}
    </div>
  );
}

function SidebarFooter() {
  const { isOpen, isMobile } = useSidebar();
  const isCollapsed = !isOpen && !isMobile;

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        isCollapsed ? 'justify-center flex-col' : 'justify-start'
      )}
    >
      <AvatarPopover />
    </div>
  );
}

interface AppSidebarProps {
  menuItems: MenuItem[];
}

export function AppSidebar({ menuItems }: AppSidebarProps) {
  return (
    <Sidebar header={<SidebarHeader />} footer={<SidebarFooter />}>
      <div className="flex flex-col gap-1">
        {menuItems.map((item, index: number) => (
          <SidebarItem
            key={`${item.href}-${index}`}
            href={item.href}
            icon={item.icon}
            label={item.label}
            items={item.items}
          />
        ))}
      </div>
    </Sidebar>
  );
}
