import NavBar from '@/app/components/molecules/NavBar';
import '@/app/globals.css';
import { siteConfig } from '@/config/site.config';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import localFont from 'next/font/local';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
const dinNextRounded = localFont({
  src: [
    {
      path: '../public/fonts/DINNextRoundedLTPro-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/DINNextRoundedLTPro-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/DINNextRoundedLTPro-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/DINNextRoundedLTPro-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-din-next-rounded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  icons: {
    icon: '/logo/logoLearnFlow.svg',
    shortcut: '/logo/logoLearnFlow.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${dinNextRounded.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <NavBar initialLocale={locale} />
            {children}
          </Providers>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
