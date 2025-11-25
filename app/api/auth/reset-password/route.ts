import { hasura } from '@/lib/hasura';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { oobCode, newPassword, confirmPassword } = await req.json();

    // Validate required fields
    if (!oobCode || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
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

    // Find user by oobCode and validate expiry
    const escapedOobCode = JSON.stringify(oobCode);
    const currentTime = new Date().toISOString();
    const escapedCurrentTime = JSON.stringify(currentTime);

    const findUserQuery = `
      query FindUserByOobCode {
        User(
          where: {
            _and: [
              { oobCode: { _eq: ${escapedOobCode} } }
              { oobCodeExpiresAt: { _gte: ${escapedCurrentTime} } }
              { deletedAt: { _is_null: true } }
            ]
          }
        ) {
          id
          email
        }
      }
    `;

    const userResult = await hasura<{
      User: Array<{
        id: number;
        email: string;
      }>;
    }>(findUserQuery);

    if (!userResult.User || userResult.User.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset code',
        },
        { status: 400 }
      );
    }

    const user = userResult.User[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear oobCode
    const updatePasswordMutation = `
      mutation UpdatePasswordAndClearOobCode(
        $id: Int!
        $password: String!
      ) {
        update_User_by_pk(
          pk_columns: { id: $id }
          _set: {
            password: $password
            oobCode: null
            oobCodeExpiresAt: null
          }
        ) {
            id
        }
      }
    `;

    try {
      await hasura(updatePasswordMutation, {
        id: user.id,
        password: hashedPassword,
      });
    } catch (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process reset password request',
      },
      { status: 500 }
    );
  }
}
