'use client';

import { Button } from '@heroui/button';
import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';

export function SidebarTrigger() {
  const { toggle } = useSidebar();

  return (
    <Button
      isIconOnly
      variant="light"
      onPress={toggle}
      aria-label="Toggle sidebar"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}
