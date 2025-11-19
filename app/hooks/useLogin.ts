import { fetcher } from '@/lib/fetcher';
import useSWRMutation from 'swr/mutation';
import { errorMessage } from './errorMessage';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  token?: string;
  error?: string;
  data?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
};

export function useLogin() {
  const {
    trigger,
    isMutating,
    error: swrError,
  } = useSWRMutation<LoginResponse, Error, string, LoginPayload>(
    '/api/auth/login',
    async (_key, { arg }) => {
      return fetcher<LoginResponse, LoginPayload>('/api/auth/login', {
        method: 'POST',
        body: arg,
      });
    }
  );

  /**
   * Hàm đăng nhập
   * @param payload - Thông tin email và password
   * @returns Response từ server hoặc undefined nếu có lỗi
   */
  const login = async (
    payload: LoginPayload
  ): Promise<LoginResponse | undefined> => {
    try {
      // trigger(payload) sẽ:
      // 1. Gọi hàm async ở trên với arg = payload
      // 2. Tự động set isMutating = true (loading)
      // 3. Tự động set error nếu có lỗi
      // 4. Trả về kết quả từ API
      return await trigger(payload);
    } catch (error) {
      console.error('Login error:', error);
      return undefined;
    }
  };

  const error = swrError ? errorMessage(swrError) : null;

  return {
    login,
    error,
    isLoading: isMutating,
  };
}
