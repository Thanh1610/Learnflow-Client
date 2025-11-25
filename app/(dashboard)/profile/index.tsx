'use client';
import CustomSelect from '@/app/components/atoms/CustomSelect';
import AvatarUpload from '@/app/components/molecules/ui/AvatarUpload';
import { useUpdateUserProfile } from '@/app/hooks/useUpdateUserProfile';
import { useUploadAvatar } from '@/app/hooks/useUploadAvatar';
import { PAGE_ROUTES } from '@/config/pageRoutes';
import { formatCalendarDateToString, safeParseDate } from '@/lib/date';
import type { UserType } from '@/types/user.type';
import { Textarea } from '@heroui/input';
import {
  Button,
  Card,
  CardBody,
  DatePicker,
  Divider,
  Form,
  Input,
  Spacer,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

interface ProfileFormProps {
  userData?: UserType;
}

type ProfileFormValues = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender: '1' | '2';
};

export default function ProfileForm({ userData }: ProfileFormProps) {
  const t = useTranslations('ProfilePage');
  const router = useRouter();
  const { updateUserProfile, isLoading: isUpdatingProfile } =
    useUpdateUserProfile();
  const { uploadAvatar, isLoading: isUploadingAvatar } = useUploadAvatar();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    userData?.avatar ?? null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Memoize form schema to avoid recreation on every render
  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('form.validation.nameRequired')),
        email: z
          .string()
          .min(1, t('form.validation.emailRequired'))
          .email(t('form.validation.emailInvalid')),
        phone: z.string().optional(),
        address: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.enum(['1', '2']),
      }),
    [t]
  );

  // Memoize default values to avoid recreation on every render
  const defaultValues = useMemo<ProfileFormValues>(
    () => ({
      name: userData?.name ?? '',
      email: userData?.email ?? '',
      phone: userData?.phone ?? undefined,
      address: userData?.address ?? undefined,
      dateOfBirth: userData?.dateOfBirth ?? undefined,
      gender: (userData?.gender ?? '1') as '1' | '2',
    }),
    [userData]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Memoize gender options to avoid recreation on every render
  const genderOptions = useMemo(
    () => [
      { key: '1', label: t('form.male') },
      { key: '2', label: t('form.female') },
    ],
    [t]
  );

  // Memoize computed values
  const displayAvatar = avatarUrl ?? userData?.avatar ?? '';
  const loading = isUpdatingProfile || isUploadingAvatar || isSubmitting;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userData?.id) {
      return;
    }

    let finalAvatarUrl = avatarUrl;

    // Upload avatar first if a new file was selected
    if (selectedFile) {
      // Get old avatar URL before uploading new one
      const oldAvatarUrl = avatarUrl || userData?.avatar || null;
      const uploadResponse = await uploadAvatar(selectedFile, oldAvatarUrl);
      if (uploadResponse?.success && uploadResponse.data?.url) {
        finalAvatarUrl = uploadResponse.data.url;
        setAvatarUrl(finalAvatarUrl);
        setSelectedFile(null); // Clear selected file after successful upload
      } else {
        // If upload failed, don't proceed with profile update
        return;
      }
    }

    // Update profile with all data including new avatar URL
    const response = await updateUserProfile({
      id: userData.id,
      name: data.name,
      email: data.email,
      phone: data.phone ?? '',
      address: data.address ?? '',
      dateOfBirth: data.dateOfBirth ?? '',
      gender: data.gender,
      avatar: finalAvatarUrl ?? undefined,
    });
    if (response?.success && response.data) {
      // Update form with new data from response
      reset({
        name: response.data.name ?? '',
        email: response.data.email ?? '',
        phone: response.data.phone ?? '',
        address: response.data.address ?? '',
        dateOfBirth: response.data.dateOfBirth ?? '',
        gender: (response.data.gender ?? '1') as '1' | '2',
      });
      // Update avatar URL if it was updated
      if (response.data.avatar) {
        setAvatarUrl(response.data.avatar);
      }
      // Refresh server component to reload data
      router.refresh();
    }
  };
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-6 lg:gap-8 xl:flex-row">
        {/* Avatar Section */}
        <div className="w-full lg:w-auto lg:shrink-0">
          <div className="flex justify-center xl:justify-start">
            <AvatarUpload
              avatar={displayAvatar}
              onFileSelect={handleFileSelect}
              isLoading={isUploadingAvatar}
            />
          </div>
        </div>

        {/* Form Section */}
        <Card className="w-full flex-1">
          <CardBody className="px-4 sm:px-6">
            <Form
              className="mt-4 gap-0"
              validationBehavior="native"
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* Name Input */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    isClearable
                    isRequired
                    label={t('form.name')}
                    placeholder={t('form.namePlaceholder')}
                    value={field.value}
                    onValueChange={field.onChange}
                    isInvalid={Boolean(errors.name)}
                    errorMessage={errors.name?.message}
                    classNames={{
                      inputWrapper: 'h-14',
                    }}
                  />
                )}
              />
              <Spacer y={6} />

              {/* Email Input */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    isClearable
                    isRequired
                    type="email"
                    label={t('form.email')}
                    placeholder={t('form.emailPlaceholder')}
                    value={field.value}
                    onValueChange={field.onChange}
                    isInvalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                    classNames={{
                      inputWrapper: 'h-14',
                    }}
                  />
                )}
              />
              <Spacer y={6} />

              {/* Phone Input */}
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    isClearable
                    type="tel"
                    label={t('form.phone')}
                    placeholder={t('form.phonePlaceholder')}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    isInvalid={Boolean(errors.phone)}
                    errorMessage={errors.phone?.message}
                    classNames={{
                      inputWrapper: 'h-14',
                    }}
                  />
                )}
              />
              <Spacer y={6} />

              {/* Address Textarea */}
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    isClearable
                    label={t('form.address')}
                    placeholder={t('form.addressPlaceholder')}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    isInvalid={Boolean(errors.address)}
                    errorMessage={errors.address?.message}
                    minRows={3}
                  />
                )}
              />
              <Spacer y={6} />

              {/* Date of Birth and Gender Flex */}
              <div className="flex w-full flex-col gap-4 md:flex-row">
                {/* Date of Birth DatePicker */}
                <div className="w-full md:flex-1">
                  <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label={t('form.dateOfBirth')}
                        value={safeParseDate(field.value)}
                        onChange={date => {
                          field.onChange(formatCalendarDateToString(date));
                        }}
                        isInvalid={Boolean(errors.dateOfBirth)}
                        errorMessage={errors.dateOfBirth?.message}
                        className="w-full"
                      />
                    )}
                  />
                </div>

                {/* Gender Select */}
                <div className="w-full md:flex-1">
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        label={t('form.gender')}
                        placeholder={t('form.genderPlaceholder')}
                        selectionMode="single"
                        defaultSelectedKey={field.value || '1'}
                        options={genderOptions}
                        onSelectionChange={keys => {
                          const selectedKey = Array.from(keys)[0] as string;
                          field.onChange((selectedKey || '1') as '1' | '2');
                        }}
                        className="w-full"
                      />
                    )}
                  />
                </div>
              </div>
              <Spacer y={6} />

              <Divider />

              {/* Submit Button */}
              <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                <Button
                  className="bg-linear-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                  size="lg"
                  endContent={<LockIcon className="size-4" />}
                  onPress={() => {
                    router.push(PAGE_ROUTES.CHANGE_PASSWORD_PAGE);
                  }}
                >
                  {t('form.changePassword')}
                </Button>

                <Button
                  color="primary"
                  type="submit"
                  isLoading={loading}
                  size="lg"
                >
                  {t('form.saveChanges')}
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
