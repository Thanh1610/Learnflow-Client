import { getLocale } from 'next-intl/server';
import { AppSidebar } from './AppSidebar';
import { getMenuItems } from './menuItems';

export async function AppSidebarServer() {
  const locale = await getLocale();
  const menuItems = await getMenuItems(locale);
  return <AppSidebar initialLocale={locale} menuItems={menuItems} />;
}
