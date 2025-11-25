import { fetcher } from '@/lib/fetcher';
import useSWRMutation from 'swr/mutation';
import { errorMessage } from './errorMessage';

export type ForgotPasswordPayload = {
  email: string;
};

export type ForgotPasswordResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export function useForgotPassword() {
  const {
    trigger,
    isMutating,
    error: swrError,
  } = useSWRMutation<
    ForgotPasswordResponse,
    Error,
    string,
    ForgotPasswordPayload
  >('/api/auth/forgot-password', async (_key, { arg }) => {
    return fetcher<ForgotPasswordResponse, ForgotPasswordPayload>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: arg,
      }
    );
  });

  /**
   * Hàm gửi yêu cầu reset password
   * @param payload - Email của user
   * @returns Response từ server hoặc undefined nếu có lỗi
   */
  const forgotPassword = async (
    payload: ForgotPasswordPayload
  ): Promise<ForgotPasswordResponse | undefined> => {
    try {
      return await trigger(payload);
    } catch (error) {
      console.error('Forgot password error:', error);
      return undefined;
    }
  };

  const error = swrError ? errorMessage(swrError) : null;

  return {
    forgotPassword,
    error,
    isLoading: isMutating,
  };
}
