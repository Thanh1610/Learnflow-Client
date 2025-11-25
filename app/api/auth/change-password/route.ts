import { verifyAuth } from '@/lib/auth';
import { hasura } from '@/lib/hasura';
import { compare, hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = verifyAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.payload.sub;

    // Parse and validate request body
    const body = (await req.json()) as ChangePasswordBody;
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password must be different from current password',
        },
        { status: 400 }
      );
    }

    // Get user's current password hash
    const userIdNumber = Number(userId);
    if (!Number.isInteger(userIdNumber) || userIdNumber <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const getUserQuery = `
      query GetUserPassword($id: Int!) {
        User(where: { id: { _eq: $id } }) {
          id
          password
        }
      }
    `;

    const userResult = await hasura<{
      User: Array<{
        id: number;
        password: string | null;
      }>;
    }>(getUserQuery, { id: userIdNumber });

    const user = userResult.User?.[0];
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'User does not have a password set' },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password in database
    const updatePasswordMutation = `
      mutation UpdatePassword($id: Int!, $password: String!) {
        update_User(where: { id: { _eq: $id } }, _set: { password: $password }) {
          affected_rows
          returning {
            id
          }
        }
      }
    `;

    const updateResult = await hasura<{
      update_User: {
        affected_rows: number;
        returning: Array<{ id: number }>;
      };
    }>(updatePasswordMutation, { id: userIdNumber, password: hashedPassword });

    if (updateResult.update_User.affected_rows === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to change password',
      },
      { status: 500 }
    );
  }
}
