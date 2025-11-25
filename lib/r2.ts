import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

// Cấu hình Cloudflare R2
const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

if (
  !accountId ||
  !accessKeyId ||
  !secretAccessKey ||
  !bucketName ||
  !publicUrl
) {
  console.warn(
    'Cloudflare R2 environment variables are not fully configured. File uploads will not work.'
  );
}

// Khởi tạo client S3 cho Cloudflare R2
// R2 là S3-compatible, nên chúng ta có thể sử dụng AWS SDK để upload file
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

/**
 * Upload file lên Cloudflare R2
 * @param file Buffer hoặc Uint8Array của file
 * @param key Khóa đối tượng (đường dẫn) trong bucket
 * @param contentType Loại MIME của file
 * @returns URL công khai của file đã upload
 */
export async function uploadToR2(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicUrl
  ) {
    throw new Error('Cloudflare R2 is not configured');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return public URL
  const url = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
  return `${url}${key}`;
}

/**
 * Tạo khóa file duy nhất cho upload ảnh đại diện
 * @param userId ID của user
 * @param originalFileName Tên file gốc
 * @returns Khóa file duy nhất
 */
export function generateAvatarKey(
  userId: number,
  originalFileName: string
): string {
  const timestamp = Date.now();
  const extension = originalFileName.split('.').pop() || 'jpg';
  const sanitizedExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `avatars/${userId}/${timestamp}.${sanitizedExtension}`;
}

/**
 * Lấy khóa đối tượng từ URL công khai của R2
 * @param url URL công khai của file
 * @returns Khóa đối tượng hoặc null nếu URL không hợp lệ
 */
export function extractKeyFromUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;

  try {
    // Nếu URL chứa URL công khai, lấy khóa sau đó
    if (publicUrl) {
      const baseUrl = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
      if (url.startsWith(baseUrl)) {
        return url.replace(baseUrl, '');
      }
    }

    // Thử lấy khóa từ URL đầy đủ
    const urlObj = new URL(url);
    // Xóa dấu gạch ngang đầu tiên từ pathname
    const key = urlObj.pathname.startsWith('/')
      ? urlObj.pathname.slice(1)
      : urlObj.pathname;

    // Chỉ trả về nếu nó trông giống như khóa ảnh đại diện (bắt đầu với avatars/)
    if (key.startsWith('avatars/')) {
      return key;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Xóa file từ Cloudflare R2
 * @param key Khóa đối tượng (đường dẫn) trong bucket
 * @returns true nếu thành công, false nếu không
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicUrl
  ) {
    throw new Error('Cloudflare R2 is not configured');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    return false;
  }
}
