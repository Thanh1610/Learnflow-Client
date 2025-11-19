import { fetcher } from '@/lib/fetcher';
import useSWRMutation from 'swr/mutation';
import { errorMessage } from './errorMessage';

type RegisterApiRequestBody = {
  name: string;
  email: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type RegisterResponse =
  | {
      success: true;
      data: {
        id: string;
        email: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export function useRegisterApi() {
  const {
    trigger,
    isMutating,
    error: swrError,
  } = useSWRMutation<RegisterResponse, Error, string, RegisterPayload>(
    '/api/auth/register',
    async (_key, { arg }) => {
      return fetcher<RegisterResponse, RegisterApiRequestBody>(
        '/api/auth/register',
        {
          method: 'POST',
          body: {
            name: arg.username,
            email: arg.email,
            password: arg.password,
          },
        }
      );
    }
  );

  /**
   * Hàm đăng ký
   * @param payload - Thông tin username, email và password
   * @returns Response từ server hoặc undefined nếu có lỗi
   */
  const registerUser = async (
    payload: RegisterPayload
  ): Promise<RegisterResponse | undefined> => {
    try {
      return await trigger(payload);
    } catch (error) {
      console.error('Register error:', error);
      return undefined;
    }
  };

  const error = swrError ? errorMessage(swrError) : null;

  return {
    registerUser,
    isLoading: isMutating,
    error,
  };
}
