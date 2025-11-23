'use client';

import { useChangePassword } from '@/app/hooks/useChangePassword';
import { Button, Card, CardBody, Form, Input, Spacer } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '@iconify/react';
import { useTranslations } from 'next-intl';
import React, { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ChangePasswordForm() {
  const t = useTranslations('ChangePasswordPage');
  const { changePassword, isLoading } = useChangePassword();
  const [isCurrentVisible, setIsCurrentVisible] = React.useState(false);
  const [isNewVisible, setIsNewVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);

  const toggleCurrentVisibility = () => setIsCurrentVisible(!isCurrentVisible);
  const toggleNewVisibility = () => setIsNewVisible(!isNewVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  // Memoize form schema
  const formSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z
            .string()
            .min(1, t('form.validation.currentPasswordRequired')),
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
        })
        .refine(data => data.currentPassword !== data.newPassword, {
          message: t('form.validation.samePassword'),
          path: ['newPassword'],
        }),
    [t]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    const response = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });

    if (response?.success) {
      reset();
      // Optionally redirect after successful password change
      // router.push(PAGE_ROUTES.PROFILE_PAGE);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Card className="w-full">
        <CardBody className="px-4 sm:px-6">
          <Form
            className="mt-4 gap-0"
            validationBehavior="native"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Current Password Input */}
            <Controller
              name="currentPassword"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  isRequired
                  label={t('form.currentPassword')}
                  placeholder={t('form.currentPasswordPlaceholder')}
                  type={isCurrentVisible ? 'text' : 'password'}
                  variant="bordered"
                  isInvalid={Boolean(errors.currentPassword)}
                  errorMessage={errors.currentPassword?.message}
                  endContent={
                    <button type="button" onClick={toggleCurrentVisibility}>
                      {isCurrentVisible ? (
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
                isLoading={isLoading || isSubmitting}
                size="lg"
                className="w-full"
              >
                {t('form.saveChanges')}
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
