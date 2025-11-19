'use client';
import { AcmeLogo } from '@/app/components/atoms/AcmeLogo';
import { LanguageToggle } from '@/app/components/atoms/Language';
import { useSidebar } from '@/app/components/organisms/Sidebar/SidebarContext';
import { useIsMobile } from '@/app/components/organisms/Sidebar/useIsMobile';
import { Button } from '@heroui/button';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react';
import { PanelLeftOpen } from 'lucide-react';

interface NavBarProps {
  initialLocale: string;
}

export default function NavBar({ initialLocale }: NavBarProps) {
  const { isOpen, toggle } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <Navbar className="shadow-md">
      {/* Mobile: Icon mở sidebar bên trái */}
      {isMobile && !isOpen && (
        <NavbarContent>
          <NavbarItem>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={toggle}
              aria-label="Toggle sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </Button>
          </NavbarItem>
        </NavbarContent>
      )}

      {/* Logo ở giữa (mobile) hoặc bên trái (desktop) */}
      <NavbarBrand className={isMobile ? 'justify-center flex-1' : ''}>
        <AcmeLogo className="w-8 h-8" />
        <p className="font-bold text-inherit">LearnFlow</p>
      </NavbarBrand>

      {/* Language toggle bên phải */}
      <NavbarContent justify="end">
        <LanguageToggle initialLocale={initialLocale} />
        <NavbarItem className="hidden lg:flex"></NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
