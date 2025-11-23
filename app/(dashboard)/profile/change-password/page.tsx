import CardInfo from '@/app/components/molecules/ui/CardInfo';
import { PAGE_ROUTES } from '@/config/pageRoutes';
import { getServerUser } from '@/lib/server-auth';
import { getTranslations } from 'next-intl/server';
import ChangePasswordForm from './index';

export const metadata = {
  title: 'Change Password',
  description: 'Change your account password',
};

export default async function ChangePasswordPage() {
  const t = await getTranslations('ChangePasswordPage');
  await getServerUser();

  return (
    <div className="flex flex-col gap-8">
      <CardInfo
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          {
            label: t('home'),
            href: PAGE_ROUTES.HOME,
          },
          {
            label: t('profile'),
            href: PAGE_ROUTES.PROFILE_PAGE,
          },
          {
            label: t('changePassword'),
            href: PAGE_ROUTES.CHANGE_PASSWORD_PAGE,
            isCurrent: true,
          },
        ]}
      />
      <ChangePasswordForm />
    </div>
  );
}
