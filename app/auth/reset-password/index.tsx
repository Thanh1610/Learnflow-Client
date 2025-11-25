'use client';

import { useResetPassword } from '@/app/hooks/useResetPassword';
import { PAGE_ROUTES } from '@/config/pageRoutes';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
  Input,
  Spacer,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '@iconify/react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

type ResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordForm() {
  const t = useTranslations('ResetPasswordPage');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, isLoading } = useResetPassword();
  const [isNewVisible, setIsNewVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const oobCode = searchParams.get('oobCode');

  const toggleNewVisibility = () => setIsNewVisible(!isNewVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  // Memoize form schema
  const formSchema = useMemo(
    () =>
      z
        .object({
          newPassword: z
            .string()
            .min(1, t('form.validation.newPasswordRequired'))
            .min(8, t('form.validation.passwordMin')),
          confirmPassword: z
            .string()
            .min(1, t('form.validation.confirmPasswordRequired')),
        })
        .refine(data => data.newPassword === data.confirmPassword, {
          message: t('form.validation.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!oobCode) return;

    const response = await resetPassword({
      oobCode,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });

    if (response?.success) {
      setSubmitSuccess(true);
      reset();
      toast.success(t('form.success'));
      router.push(PAGE_ROUTES.LOGIN);
    } else {
      toast.error(t('form.error'));
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="flex flex-col items-center gap-1 px-4 pt-6 sm:px-6">
            <p className="text-xl font-medium">{t('title')}</p>
          </CardHeader>
          <CardBody className="px-4 sm:px-6">
            <Form
              className="mt-4 gap-0"
              validationBehavior="native"
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* New Password Input */}
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    isRequired
                    label={t('form.newPassword')}
                    placeholder={t('form.newPasswordPlaceholder')}
                    type={isNewVisible ? 'text' : 'password'}
                    variant="bordered"
                    isInvalid={Boolean(errors.newPassword)}
                    errorMessage={errors.newPassword?.message}
                    endContent={
                      <button type="button" onClick={toggleNewVisibility}>
                        {isNewVisible ? (
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
                    classNames={{
                      inputWrapper: 'h-14',
                    }}
                  />
                )}
              />
              <Spacer y={6} />

              {/* Confirm Password Input */}
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    isRequired
                    label={t('form.confirmPassword')}
                    placeholder={t('form.confirmPasswordPlaceholder')}
                    type={isConfirmVisible ? 'text' : 'password'}
                    variant="bordered"
                    isInvalid={Boolean(errors.confirmPassword)}
                    errorMessage={errors.confirmPassword?.message}
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
                    classNames={{
                      inputWrapper: 'h-14',
                    }}
                  />
                )}
              />
              <Spacer y={6} />

              {/* Submit Button */}
              <div className="mt-4 flex w-full justify-center">
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSubmitting || isLoading}
                  size="lg"
                  className="w-full"
                  isDisabled={!oobCode || submitSuccess}
                >
                  {t('form.resetPassword')}
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
