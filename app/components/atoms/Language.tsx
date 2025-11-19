'use client';

import { LANGUAGES } from '@/config/constants';
import { getLocaleFromCookie, setLocaleCookie } from '@/lib/cookies';
import { Button } from '@heroui/button';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/dropdown';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReactCountryFlag from 'react-country-flag';

interface LanguageToggleProps {
  initialLocale: string;
}

export function LanguageToggle({ initialLocale }: LanguageToggleProps) {
  const router = useRouter();

  const fallbackLocale = LANGUAGES[0]?.key ?? 'en';
  const [currentLocale, setCurrentLocale] = useState<string>(
    initialLocale ?? getLocaleFromCookie(fallbackLocale)
  );

  const currentLang =
    LANGUAGES.find(l => l.key === currentLocale) || LANGUAGES[0];
  const t = useTranslations();

  const handleChange = async (newLocale: string) => {
    if (newLocale === currentLocale) return;
    setLocaleCookie(newLocale);
    setCurrentLocale(newLocale);
    router.refresh();
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="bordered"
          isIconOnly
          className="flex items-center justify-center"
          aria-label={t('app.language')}
        >
          <ReactCountryFlag
            countryCode={currentLang.countryCode}
            svg
            style={{ width: '1rem', height: '1rem' }}
            title={currentLang.label}
          />
          <span className="sr-only">{t('app.language')}</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        onAction={key => handleChange(key as string)}
        selectedKeys={[currentLocale]}
        selectionMode="single"
      >
        {LANGUAGES.map(lang => (
          <DropdownItem
            key={lang.key}
            startContent={
              <ReactCountryFlag
                countryCode={lang.countryCode}
                svg
                style={{ width: '1rem', height: '1rem' }}
                title={lang.label}
              />
            }
          >
            {lang.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
