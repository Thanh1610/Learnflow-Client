'use client';

import { AcmeLogo } from '@/app/components/atoms/AcmeLogo';
import { useRegisterApi } from '@/app/hooks/useRegisterApi';
import {
  createRegisterSchema,
  type RegisterFormResult,
  type RegisterFormValues,
} from '@/app/register/schema';
import { PAGE_ROUTES } from '@/config/pageRoutes';
import { Button, Checkbox, Divider, Input, Link } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '@iconify/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function RegisterForm() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const t = useTranslations('Auth.register');
  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);
  const router = useRouter();
  const schema = React.useMemo(
    () =>
      createRegisterSchema({
        usernameRequired: t('usernameRequired'),
        emailRequired: t('emailRequired'),
        emailInvalid: t('emailInvalid'),
        passwordRequired: t('passwordRequired'),
        passwordMin: t('passwordMin'),
        confirmPasswordRequired: t('confirmPasswordRequired'),
        confirmPasswordMismatch: t('confirmPasswordMismatch'),
        termsRequired: t('termsRequired'),
      }),
    [t]
  );

  const {
    control,
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues, undefined, RegisterFormResult>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeWithTerms: false,
    },
  });

  const { registerUser, isLoading: isRegistering } = useRegisterApi();

  const agreeWithTerms = useWatch({
    control,
    name: 'agreeWithTerms',
  });

  const onSubmit = handleSubmit(async values => {
    try {
      const response = await registerUser({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      console.log('register success', response);
      if (response?.success) {
        toast.success(t('registerSuccess'));
        router.push(PAGE_ROUTES.LOGIN);
      } else {
        toast.error(t('registerFailed'));
      }
    } catch (error) {
      console.error('register failed', error);
      toast.error(t('registerFailed'));
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
          <div className="flex flex-col">
            <Input
              isInvalid={Boolean(errors.username)}
              errorMessage={errors.username?.message}
              classNames={{
                base: '-mb-[2px]',
                inputWrapper:
                  'rounded-b-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10',
              }}
              label={t('username')}
              placeholder={t('usernamePlaceholder')}
              type="text"
              variant="bordered"
              {...registerField('username')}
            />
            <Input
              isInvalid={Boolean(errors.email)}
              errorMessage={errors.email?.message}
              classNames={{
                base: '-mb-[2px]',
                inputWrapper:
                  'rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10',
              }}
              label={t('email')}
              placeholder={t('emailPlaceholder')}
              type="email"
              variant="bordered"
              {...registerField('email')}
            />
            <Input
              isInvalid={Boolean(errors.password)}
              errorMessage={errors.password?.message}
              classNames={{
                base: '-mb-[2px]',
                inputWrapper:
                  'rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10',
              }}
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
              {...registerField('password')}
            />
            <Input
              isInvalid={Boolean(errors.confirmPassword)}
              errorMessage={errors.confirmPassword?.message}
              classNames={{
                inputWrapper: 'rounded-t-none',
              }}
              endContent={
                <button type="button" onClick={toggleConfirmVisibility}>
                  {isConfirmVisible ? (
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
              label={t('confirmPassword')}
              placeholder={t('confirmPasswordPlaceholder')}
              type={isConfirmVisible ? 'text' : 'password'}
              variant="bordered"
              {...registerField('confirmPassword')}
            />
          </div>
          <div className="py-4">
            <Controller
              control={control}
              name="agreeWithTerms"
              render={({ field }) => (
                <Checkbox
                  ref={field.ref}
                  isSelected={Boolean(field.value)}
                  onBlur={field.onBlur}
                  onValueChange={field.onChange}
                  size="sm"
                >
                  {t('agreeWithTerms')}&nbsp;
                  <Link className="relative z-1" href="#" size="sm">
                    {t('terms')}
                  </Link>
                  &nbsp;{t('and')}&nbsp;
                  <Link className="relative z-1" href="#" size="sm">
                    {t('privacyPolicy')}
                  </Link>
                </Checkbox>
              )}
            />
            {errors.agreeWithTerms?.message ? (
              <p className="text-tiny text-danger mt-1">
                {errors.agreeWithTerms.message}
              </p>
            ) : null}
          </div>
          <Button
            color="primary"
            isDisabled={!agreeWithTerms}
            isLoading={isSubmitting || isRegistering}
            type="submit"
          >
            {t('signUp')}
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
            {t('signUpWithGoogle')}
          </Button>
          <Button
            startContent={
              <Icon className="text-default-500" icon="fe:github" width={24} />
            }
            variant="bordered"
          >
            {t('signUpWithGithub')}
          </Button>
        </div>
        <p className="text-small text-center">
          {t('alreadyHaveAccount')}&nbsp;
          <Link href={PAGE_ROUTES.LOGIN} size="sm">
            {t('logIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
