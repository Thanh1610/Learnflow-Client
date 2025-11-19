'use client';

import { cn } from '@/lib/utils';
import { Button } from '@heroui/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from '@heroui/drawer';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { useSidebar } from './SidebarContext';
import { useIsMobile } from './useIsMobile';

interface SidebarProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ children, header, footer, className }: SidebarProps) {
  const { isOpen, toggle, close, setIsMobile } = useSidebar();
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  const sidebarContent = (
    <div
      className={cn(
        'flex flex-col h-full bg-background border-r border-divider',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center border-b border-divider',
          isMobile
            ? 'justify-between p-4'
            : isOpen
              ? 'p-4'
              : 'p-2 justify-center'
        )}
      >
        {header && (
          <div className={isOpen || isMobile ? 'flex-1' : ''}>{header}</div>
        )}
        {!isMobile && (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={toggle}
            aria-label="Toggle sidebar"
            className={isOpen ? 'ml-auto' : ''}
          >
            {isOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </Button>
        )}
        {isMobile && (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={close}
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">{children}</div>

      {/* Footer */}
      {footer && (
        <div
          className={cn(
            'border-t border-divider',
            isMobile || isOpen ? 'p-4' : 'p-2'
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} onOpenChange={toggle} placement="left">
        <DrawerContent className="max-w-[280px] [&>button]:hidden">
          <DrawerHeader className="p-0 hidden">{null}</DrawerHeader>
          <DrawerBody className="p-0">{sidebarContent}</DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Fixed Sidebar
  return (
    <aside
      className={cn(
        'fixed left-0 top-17 h-[calc(100vh-4rem)] z-40 transition-all duration-300',
        isOpen ? 'w-[280px]' : 'w-[72px]'
      )}
    >
      {sidebarContent}
    </aside>
  );
}
