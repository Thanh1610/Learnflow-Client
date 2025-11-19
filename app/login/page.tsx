import LoginForm from '@/app/login';
import { metaObject } from '@/config/site.config';
export const metadata = {
  ...metaObject('Login'),
};

export default function LoginPage() {
  return <LoginForm />;
}
