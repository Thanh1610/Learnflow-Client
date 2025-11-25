import { fetcher } from '@/lib/fetcher';
import type { UserType } from '@/types/user.type';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import useSWRMutation from 'swr/mutation';
import { errorMessage } from './errorMessage';

export type UpdateUserProfilePayload = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  avatar?: string;
};

export type UpdateUserProfileResponse = {
  success: boolean;
  data?: UserType;
  error?: string;
};

export function useUpdateUserProfile() {
  const t = useTranslations('ProfilePage');
  const {
    trigger,
    isMutating,
    error: swrError,
  } = useSWRMutation<
    UpdateUserProfileResponse,
    Error,
    string,
    UpdateUserProfilePayload
  >('/api/users/update-profile', async (_key, { arg }) => {
    return fetcher<UpdateUserProfileResponse>(
      `/api/users/update-profile?id=${arg.id}`,
      {
        method: 'POST',
        body: {
          name: arg.name,
          email: arg.email,
          phone: arg.phone,
          address: arg.address,
          dateOfBirth: arg.dateOfBirth,
          gender: arg.gender,
          avatar: arg.avatar,
        },
      }
    );
  });

  /**
   * Hàm cập nhật thông tin profile của user
   * @param payload - Thông tin user cần cập nhật
   * @returns Response từ server hoặc undefined nếu có lỗi
   */
  const updateUserProfile = async (
    payload: UpdateUserProfilePayload
  ): Promise<UpdateUserProfileResponse | undefined> => {
    try {
      const response = await trigger(payload);
      if (response?.success) {
        toast.success(t('updateSuccess'));
      } else {
        toast.error(t('updateFailed'));
      }
      return response;
    } catch (error) {
      console.error('Update user profile error:', error);
      toast.error(t('updateFailed'));
      return undefined;
    }
  };

  const error = swrError ? errorMessage(swrError) : null;

  return {
    updateUserProfile,
    isLoading: isMutating,
    error,
  };
}
