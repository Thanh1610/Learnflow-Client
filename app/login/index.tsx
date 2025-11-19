'use client';

import { PAGE_ROUTES } from '@/config/pageRoutes';
import { Button, Divider, Input, Link } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '@iconify/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';

import { AcmeLogo } from '@/app/components/atoms/AcmeLogo';
import { useLogin } from '@/app/hooks/useLogin';
import {
  createLoginSchema,
  type LoginFormResult,
  type LoginFormValues,
} from '@/app/login/schema';
import { useAuthStore } from '@/app/stores/useAuthStore';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const [isVisible, setIsVisible] = React.useState(false);
  const t = useTranslations('Auth.login');
  const router = useRouter();
  const toggleVisibility = () => setIsVisible(!isVisible);
  const { login } = useLogin();
  const setSession = useAuthStore(state => state.setSession);
  const schema = React.useMemo(
    () =>
      createLoginSchema({
        emailRequired: t('emailRequired'),
        emailInvalid: t('emailInvalid'),
        passwordRequired: t('passwordRequired'),
        passwordMin: t('passwordMin'),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues, undefined, LoginFormResult>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async values => {
    const response = await login({
      email: values.email,
      password: values.password,
    });
    if (response?.success) {
      if (response.data?.role === 'USER') {
        return toast.error(t('accessDenied'));
      }
      setSession({
        user: response.data ?? null,
        token: response.token ?? null,
      });
      toast.success(t('loginSuccess'));
      router.push(PAGE_ROUTES.HOME);
    } else {
      toast.error(t('loginFailed'));
    }
  });
  return (
    <div className="flex h-full w-full items-center justify-center mt-[68px]">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col items-center pb-6">
          <AcmeLogo />
          <p className="text-xl font-medium">{t('title')}</p>
          <p className="text-small text-default-500">{t('description')}</p>
        </div>
        <form className="flex flex-col gap-3" noValidate onSubmit={onSubmit}>
          {/* email */}
          <Input
            isInvalid={Boolean(errors.email)}
            errorMessage={errors.email?.message}
            label={t('email')}
            placeholder={t('emailPlaceholder')}
            type="email"
            variant="bordered"
            {...register('email')}
          />

          {/* password */}
          <Input
            isInvalid={Boolean(errors.password)}
            errorMessage={errors.password?.message}
            endContent={
              <button type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-closed-linear"
                  />
                ) : (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-bold"
                  />
                )}
              </button>
            }
            label={t('password')}
            placeholder={t('passwordPlaceholder')}
            type={isVisible ? 'text' : 'password'}
            variant="bordered"
            {...register('password')}
          />
          <div className="flex w-full items-center justify-end px-1 py-2">
            <Link className="text-default-500" href="#" size="sm">
              {t('forgotPassword')}
            </Link>
          </div>
          <Button
            className="w-full"
            color="primary"
            isLoading={isSubmitting}
            type="submit"
          >
            {t('login')}
          </Button>
        </form>
        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="text-tiny text-default-500 shrink-0">{t('or')}</p>
          <Divider className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            startContent={<Icon icon="flat-color-icons:google" width={24} />}
            variant="bordered"
          >
            {t('signInWithGoogle')}
          </Button>
          <Button
            startContent={
              <Icon className="text-default-500" icon="fe:github" width={24} />
            }
            variant="bordered"
          >
            {t('signInWithGithub')}
          </Button>
        </div>
        <p className="text-small text-center">
          {t('needAnAccount')}&nbsp;
          <Link href={PAGE_ROUTES.REGISTER} size="sm">
            {t('signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
