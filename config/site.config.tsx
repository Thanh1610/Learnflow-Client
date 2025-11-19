import { Metadata } from 'next';
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types';

export const siteConfig = {
  title: 'Learnflow',
  description: 'Learnflow',
  logo: '/logo/logo.png',
  icon: '/favicon.ico',
  favicon: '/favicon.ico',
};

export const metaObject = (
  title?: string,
  openGraph?: OpenGraph,
  description: string = siteConfig.description,
  withBrand: boolean = true
): Metadata => {
  const composedTitle = title
    ? withBrand
      ? `${title} | ${siteConfig.title}`
      : title
    : siteConfig.title;

  return {
    title: composedTitle,
    description,
    openGraph: openGraph ?? {
      title: composedTitle,
      description,
      url: 'http://localhost:3000',
      siteName: siteConfig.title,
      locale: 'en_US',
      type: 'website',
    },
  };
};
