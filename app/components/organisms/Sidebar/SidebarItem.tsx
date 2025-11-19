'use client';

import { cn } from '@/lib/utils';
import { Button } from '@heroui/button';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import { SidebarActionItem } from './SidebarActionItem';
import { useSidebar } from './SidebarContext';

export interface SidebarMenuItem {
  href?: string;
  icon?: ReactNode;
  label?: string;
  items?: SidebarMenuItem[];
  labelFirst?: boolean;
}

interface SidebarItemProps {
  href?: string;
  icon?: ReactNode;
  label?: string;
  items?: SidebarMenuItem[];
  isActive?: boolean;
  onClick?: () => void;
  labelFirst?: boolean;
}

export function SidebarItem({
  href,
  icon,
  label,
  items,
  isActive: controlledIsActive,
  onClick,
  labelFirst,
}: SidebarItemProps) {
  const pathname = usePathname();
  const { isOpen, isMobile } = useSidebar();

  const isCollapsed = !isOpen && !isMobile;
  const hasItems = items && items.length > 0;

  // Check if any child is active
  const hasActiveChild = hasItems
    ? items!.some(
        item =>
          item.href &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`))
      )
    : false;

  const isActive =
    controlledIsActive !== undefined
      ? controlledIsActive
      : hasItems
        ? hasActiveChild
        : href
          ? pathname === href || pathname.startsWith(`${href}/`)
          : false;

  // Calculate initial expanded state based on active child
  const initialExpanded = useMemo(
    () => hasItems && !isCollapsed && hasActiveChild,
    [hasItems, isCollapsed, hasActiveChild]
  );

  // Track user's manual toggle state
  const [userToggled, setUserToggled] = useState(false);
  const [userExpandedState, setUserExpandedState] = useState<boolean | null>(
    null
  );

  // Determine expanded state: use user's manual state if toggled, otherwise use auto-expand logic
  const isExpanded =
    userToggled && userExpandedState !== null
      ? userExpandedState
      : initialExpanded;

  const handleToggle = () => {
    if (hasItems && !isCollapsed) {
      const newExpanded = !isExpanded;
      setUserExpandedState(newExpanded);
      setUserToggled(true);
    }
  };

  const buttonContent = (
    <Button
      className={cn(
        'w-full h-12 transition-all duration-200',
        isCollapsed ? 'justify-center px-0' : 'justify-start px-4',
        isActive
          ? 'bg-primary text-primary-foreground font-medium'
          : 'hover:bg-default-100 text-default-700',
        hasItems && isExpanded && !isActive && 'bg-default-50'
      )}
      variant={isActive ? 'solid' : 'light'}
      color={isActive ? 'primary' : 'default'}
      startContent={isCollapsed ? null : icon}
      endContent={
        hasItems && !isCollapsed ? (
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        ) : null
      }
      isIconOnly={isCollapsed}
      title={isCollapsed ? label : undefined}
      onPress={hasItems ? handleToggle : undefined}
    >
      {isCollapsed ? icon : label}
    </Button>
  );

  const hasValidHref = href && href.trim() !== '';

  return (
    <div className="w-full">
      {hasItems ? (
        <div className="block">{buttonContent}</div>
      ) : hasValidHref ? (
        <Link href={href} onClick={onClick} className="block">
          {buttonContent}
        </Link>
      ) : (
        <SidebarActionItem icon={icon} label={label} labelFirst={labelFirst}>
          {icon}
        </SidebarActionItem>
      )}

      {/* Submenu */}
      {hasItems && isExpanded && !isCollapsed && (
        <div className="mt-1 ml-4 space-y-1 border-l-2 border-divider pl-4">
          {items!.map((item, index) => {
            // If item has no href, use SidebarActionItem
            if (!item.href || item.href.trim() === '') {
              return (
                <SidebarActionItem
                  key={`action-${index}`}
                  icon={item.icon}
                  label={item.label}
                  labelFirst={item.labelFirst}
                >
                  {item.icon}
                </SidebarActionItem>
              );
            }
            // Otherwise use regular SidebarItem
            return (
              <SidebarItem
                key={item.href || `item-${index}`}
                href={item.href}
                icon={item.icon}
                label={item.label}
                items={item.items}
                labelFirst={item.labelFirst}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
