import ResetPasswordForm from '@/app/auth/reset-password';
import { PAGE_ROUTES } from '@/config/pageRoutes';
import { metaObject } from '@/config/site.config';
import { redirect } from 'next/navigation';

export const metadata = {
  ...metaObject('ResetPassword'),
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ oobCode?: string }>;
}) {
  const params = await searchParams;

  if (!params.oobCode) {
    redirect(PAGE_ROUTES.LOGIN);
  }

  return <ResetPasswordForm />;
}
