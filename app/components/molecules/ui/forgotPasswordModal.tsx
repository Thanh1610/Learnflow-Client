'use client';

import { useForgotPassword } from '@/app/hooks/useForgotPassword';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

type ForgotPasswordModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordModal({
  isOpen,
  onOpenChange,
}: ForgotPasswordModalProps) {
  const t = useTranslations('ForgotPasswordModal');
  const { forgotPassword, isLoading, error } = useForgotPassword();

  const schema = React.useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, { message: t('emailRequired') })
          .email({ message: t('emailInvalid') }),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = handleSubmit(async values => {
    const response = await forgotPassword({ email: values.email });
    if (response?.success) {
      toast.success(t('successMessage') || 'Reset link sent to your email');
      reset();
      onOpenChange(false);
    } else {
      toast.error(
        error ||
          response?.error ||
          t('errorMessage') ||
          'Failed to send reset link'
      );
    }
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t('title')}
              </ModalHeader>

              <ModalBody>
                <form
                  id="forgot-password-form"
                  onSubmit={onSubmit}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-default-500 text-sm">
                      {t('description')}
                    </p>
                  </div>
                  <div className="flex w-full flex-wrap gap-4 md:flex-nowrap">
                    <Input
                      {...register('email')}
                      isInvalid={Boolean(errors.email)}
                      errorMessage={errors.email?.message}
                      label={t('email')}
                      type="email"
                      placeholder={t('emailPlaceholder') || 'Enter your email'}
                      variant="bordered"
                      autoFocus
                    />
                  </div>
                </form>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={handleClose}
                  isDisabled={isLoading}
                >
                  {t('cancel')}
                </Button>
                <Button
                  color="primary"
                  form="forgot-password-form"
                  type="submit"
                  isLoading={isLoading}
                >
                  {t('confirm')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
