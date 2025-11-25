import { verifyAuth } from '@/lib/auth';
import {
  deleteFromR2,
  extractKeyFromUrl,
  generateAvatarKey,
  uploadToR2,
} from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Upload avatar image to Cloudflare R2
 * POST /api/cloudflare/upload/avatar
 * Body: FormData with 'file' field
 * Returns: { success: true, data: { url: string } } or error
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = verifyAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.payload.sub;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const oldAvatarUrl = formData.get('oldAvatarUrl') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique file key
    const key = generateAvatarKey(userId, file.name);

    // Upload to R2
    const url = await uploadToR2(buffer, key, file.type);

    // Delete old avatar if provided
    if (oldAvatarUrl) {
      const oldKey = extractKeyFromUrl(oldAvatarUrl);
      if (oldKey) {
        // Delete old avatar asynchronously (don't wait for it)
        deleteFromR2(oldKey).catch(error => {
          console.error('Failed to delete old avatar:', error);
          // Don't throw error, just log it
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to upload avatar',
      },
      { status: 500 }
    );
  }
}
