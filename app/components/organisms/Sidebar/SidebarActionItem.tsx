'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useSidebar } from './SidebarContext';

interface SidebarActionItemProps {
  icon?: ReactNode;
  label?: string;
  children?: ReactNode;
  labelFirst?: boolean;
}

export function SidebarActionItem({
  icon,
  label,
  children,
  labelFirst = false,
}: SidebarActionItemProps) {
  const { isOpen, isMobile } = useSidebar();
  const isCollapsed = !isOpen && !isMobile;

  // If children is provided, render it directly with wrapper styling
  if (children) {
    return (
      <div
        className={cn(
          'w-full min-h-12 flex items-center transition-all duration-200 rounded-lg group',
          isCollapsed
            ? 'justify-center px-0 py-2'
            : 'justify-start px-4 gap-3 py-2 hover:bg-default-100 cursor-pointer',
          labelFirst && !isCollapsed && 'flex-row-reverse'
        )}
      >
        <div
          className={cn(
            'flex items-center',
            isCollapsed ? 'justify-center' : 'shrink-0'
          )}
        >
          {children}
        </div>
        {!isCollapsed && label && (
          <span className="text-sm text-default-700 flex-1 font-medium">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Otherwise render with icon and label
  return (
    <div
      className={cn(
        'w-full min-h-12 flex items-center transition-all duration-200 rounded-lg group',
        isCollapsed
          ? 'justify-center px-0 py-2'
          : 'justify-start px-4 gap-3 py-2 hover:bg-default-100 cursor-pointer',
        labelFirst && !isCollapsed && 'flex-row-reverse'
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center',
            isCollapsed ? 'justify-center' : 'shrink-0'
          )}
        >
          {icon}
        </div>
      )}
      {!isCollapsed && label && (
        <span className="text-sm text-default-700 flex-1 font-medium">
          {label}
        </span>
      )}
      {isCollapsed && !label && icon && (
        <div className="flex items-center justify-center">{icon}</div>
      )}
    </div>
  );
}
