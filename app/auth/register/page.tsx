import RegisterForm from '@/app/auth/register';
import { metaObject } from '@/config/site.config';
export const metadata = {
  ...metaObject('Register'),
};

export default function RegisterPage() {
  return <RegisterForm />;
}
