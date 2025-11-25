'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

interface SidebarContextType {
  isOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setIsMobile: (isMobile: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-state';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen));
    }
  }, [isOpen]);

  const handleSetIsMobile = (mobile: boolean) => {
    setIsMobile(mobile);
  };

  const toggle = () => setIsOpen((prev: boolean) => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isMobile,
        toggle,
        open,
        close,
        setIsMobile: handleSetIsMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
