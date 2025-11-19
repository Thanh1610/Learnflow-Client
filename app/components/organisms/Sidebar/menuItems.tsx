import { LanguageToggle } from '@/app/components/atoms/Language';
import ThemeSwitcher from '@/app/components/ThemeSwitcher';
import {
  BarChart,
  FileText,
  HelpCircle,
  Home,
  Monitor,
  Settings,
  Users,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ReactElement } from 'react';

export interface MenuItem {
  href?: string;
  icon?: ReactElement;
  label?: string;
  items?: MenuItem[];
  labelFirst?: boolean;
}

export async function getMenuItems(initialLocale: string): Promise<MenuItem[]> {
  const t = await getTranslations('sidebar');
  return [
    {
      href: '/',
      icon: <Home className="w-5 h-5" />,
      label: t('home'),
    },
    {
      href: '/courses',
      icon: <FileText className="w-5 h-5" />,
      label: t('courses'),
    },
    {
      href: '/management',
      icon: <Monitor className="w-5 h-5" />,
      label: t('management'),
      items: [
        {
          href: '/management/users',
          icon: <Users className="w-5 h-5" />,
          label: t('users'),
        },
        {
          href: '/management/questions',
          icon: <HelpCircle className="w-5 h-5" />,
          label: t('questions'),
        },
      ],
    },
    {
      href: '/analytics',
      icon: <BarChart className="w-5 h-5" />,
      label: t('analytics'),
    },
    {
      href: '/settings',
      icon: <Settings className="w-5 h-5" />,
      label: t('settings.heading'),
      items: [
        {
          icon: <ThemeSwitcher />,
          label: t('settings.theme'),
          labelFirst: true,
        },
        {
          icon: <LanguageToggle initialLocale={initialLocale} />,
          label: t('settings.language'),
          labelFirst: true,
        },
      ],
    },
  ];
}
