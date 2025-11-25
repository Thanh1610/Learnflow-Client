import CardInfo from '@/app/components/molecules/ui/CardInfo';
import { PAGE_ROUTES } from '@/config/pageRoutes';
import { getServerUser, getUserById } from '@/lib/server-auth';
import { getTranslations } from 'next-intl/server';
import ProfileForm from './index';

export const metadata = {
  title: 'Profile',
  description: 'Manage your profile information',
};

export default async function ProfilePage() {
  const t = await getTranslations('ProfilePage');
  const user = await getServerUser();
  const userId = user?.sub;
  const userData = userId ? await getUserById(userId) : null;

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
            isCurrent: true,
          },
        ]}
      />
      <div className="px-8">
        <ProfileForm userData={userData ?? undefined} />
      </div>
    </div>
  );
}
