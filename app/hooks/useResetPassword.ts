import { fetcher } from '@/lib/fetcher';
import useSWRMutation from 'swr/mutation';
import { errorMessage } from './errorMessage';

export type ResetPasswordPayload = {
  oobCode: string;
  newPassword: string;
  confirmPassword: string;
};

export type ResetPasswordResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export function useResetPassword() {
  const {
    trigger,
    isMutating,
    error: swrError,
  } = useSWRMutation<
    ResetPasswordResponse,
    Error,
    string,
    ResetPasswordPayload
  >('/api/auth/reset-password', async (_key, { arg }) => {
    return fetcher<ResetPasswordResponse, ResetPasswordPayload>(
      '/api/auth/reset-password',
      {
        method: 'POST',
        body: arg,
      }
    );
  });

  /**
   * Hàm reset password
   * @param payload - oobCode, newPassword, confirmPassword
   * @returns Response từ server hoặc undefined nếu có lỗi
   */
  const resetPassword = async (
    payload: ResetPasswordPayload
  ): Promise<ResetPasswordResponse | undefined> => {
    try {
      return await trigger(payload);
    } catch (error) {
      console.error('Reset password error:', error);
      return undefined;
    }
  };

  const error = swrError ? errorMessage(swrError) : null;

  return {
    resetPassword,
    error,
    isLoading: isMutating,
  };
}
