import { fetcher } from '@/lib/fetcher';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import useSWRMutation from 'swr/mutation';
import { errorMessage } from './errorMessage';

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export function useChangePassword() {
  const t = useTranslations('ChangePasswordPage');
  const {
    trigger,
    isMutating,
    error: swrError,
  } = useSWRMutation<
    ChangePasswordResponse,
    Error,
    string,
    ChangePasswordPayload
  >('/api/auth/change-password', async (_key, { arg }) => {
    return fetcher<ChangePasswordResponse>('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: arg.currentPassword,
        newPassword: arg.newPassword,
        confirmPassword: arg.confirmPassword,
      },
    });
  });

  /**
   * Hàm đổi mật khẩu của user
   * @param payload - Thông tin mật khẩu cần thay đổi
   * @returns Response từ server hoặc undefined nếu có lỗi
   */
  const changePassword = async (
    payload: ChangePasswordPayload
  ): Promise<ChangePasswordResponse | undefined> => {
    try {
      const response = await trigger(payload);
      if (response?.success) {
        toast.success(t('changePasswordSuccess'));
      } else {
        toast.error(response?.error || t('changePasswordFailed'));
      }
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(t('changePasswordFailed'));
      return undefined;
    }
  };

  const error = swrError ? errorMessage(swrError) : null;

  return {
    changePassword,
    isLoading: isMutating,
    error,
  };
}
