import { fetcher } from '@/lib/fetcher';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import useSWRMutation from 'swr/mutation';

export type UploadAvatarResponse = {
  success: boolean;
  data?: { url: string };
  error?: string;
};

export function useUploadAvatar() {
  const t = useTranslations('ProfilePage');
  const {
    trigger,
    isMutating,
    error: swrError,
  } = useSWRMutation<
    UploadAvatarResponse,
    Error,
    string,
    { file: File; oldAvatarUrl?: string | null }
  >('/api/cloudflare/upload/avatar', async (_key, { arg }) => {
    const { file, oldAvatarUrl } = arg;
    const formData = new FormData();
    formData.append('file', file);
    if (oldAvatarUrl) {
      formData.append('oldAvatarUrl', oldAvatarUrl);
    }

    return fetcher<UploadAvatarResponse>('/api/cloudflare/upload/avatar', {
      method: 'POST',
      body: formData,
    });
  });

  /**
   * Upload avatar image to Cloudflare R2
   * @param file File object to upload
   * @param oldAvatarUrl Optional URL of old avatar to delete
   * @returns Response với URL của ảnh đã upload hoặc undefined nếu có lỗi
   */
  const uploadAvatar = async (
    file: File,
    oldAvatarUrl?: string | null
  ): Promise<UploadAvatarResponse | undefined> => {
    try {
      const response = await trigger({ file, oldAvatarUrl });
      if (!response?.success) {
        // Only show toast on error, success will be handled by the form
        toast.error(response?.error || t('form.uploadFailed'));
      }
      return response;
    } catch (error) {
      console.error('Upload avatar error:', error);
      toast.error(t('form.uploadFailed'));
      return undefined;
    }
  };

  return {
    uploadAvatar,
    isLoading: isMutating,
    error: swrError,
  };
}
