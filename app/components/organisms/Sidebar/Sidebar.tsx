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
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';
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
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  useEffect(() => {
    if (isMobile && pathname !== prevPathnameRef.current && isOpen) {
      close();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isMobile, isOpen, close]);

  const sidebarContent = (
    <div
      className={cn(
        'bg-background border-divider flex h-full flex-col border-r',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'border-divider flex items-center border-b',
          isMobile
            ? 'justify-between p-4'
            : isOpen
              ? 'p-4'
              : 'justify-center p-2'
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
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
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
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">{children}</div>

      {/* Footer */}
      {footer && (
        <div
          className={cn(
            'border-divider border-t',
            isMobile || isOpen ? 'p-4' : 'p-2'
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} onOpenChange={toggle} placement="left">
        <DrawerContent className="max-w-[280px] [&>button]:hidden">
          <DrawerHeader className="hidden p-0">{null}</DrawerHeader>
          <DrawerBody className="p-0">{sidebarContent}</DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside
      className={cn(
        'fixed top-17 left-0 z-40 h-[calc(100vh-4rem)] transition-all duration-300',
        isOpen ? 'w-[280px]' : 'w-[72px]'
      )}
    >
      {sidebarContent}
    </aside>
  );
}
