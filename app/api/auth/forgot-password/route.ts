import { forgotPasswordMailTemplate } from '@/lib/email/templates/forgotPasswordMailTemplate';
import { hasura } from '@/lib/hasura';
import { sendMail } from '@/lib/send-mail';
import { randomBytes } from 'crypto';
import { getLocale, getMessages } from 'next-intl/server';
import { NextResponse } from 'next/server';

const OOB_CODE_EXPIRES_IN_HOURS = 1; // 1 hour

/**
 * Gửi email reset password sử dụng template
 */
async function sendResetPasswordEmail(
  email: string,
  name: string | null,
  resetLink: string,
  locale: string,
  messages: {
    Email: {
      forgotPassword: {
        subject: string;
        expiryTime: string;
        text: string;
      };
    };
  }
): Promise<void> {
  const expiryTime = messages.Email.forgotPassword.expiryTime;
  const userName = name || email.split('@')[0];

  const html = forgotPasswordMailTemplate(
    {
      name: userName,
      resetLink,
      expiryTime,
    },
    locale
  );

  // Lấy subject và text từ messages
  const subject = messages.Email.forgotPassword.subject;
  const text = messages.Email.forgotPassword.text.replace(
    '{{resetLink}}',
    resetLink
  );

  // Gửi email sử dụng sendMail service
  const fromEmail = process.env.SMTP_SERVER_USERNAME || 'noreply@learnflow.com';

  await sendMail({
    email: fromEmail,
    sendTo: email,
    subject,
    text,
    html,
  });
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Lấy locale và messages từ next-intl
    const locale = await getLocale();
    const messages = await getMessages();

    // Tìm user theo email (chỉ user chưa bị xóa)
    const emailString = String(email).trim().toLowerCase();
    const escapedEmail = JSON.stringify(emailString);

    const findUserQuery = `
      query FindUserByEmail {
        User(where: { _and: [{ email: { _eq: ${escapedEmail} } }, { deletedAt: { _is_null: true } }] }) {
          id
          email
          name
        }
      }
    `;

    const userResult = await hasura<{
      User: Array<{
        id: number;
        email: string;
        name: string | null;
      }>;
    }>(findUserQuery);

    // Không tiết lộ thông tin về việc email có tồn tại hay không (security best practice)
    if (!userResult.User || userResult.User.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a reset link has been sent.',
      });
    }

    const user = userResult.User[0];

    // Tạo oobCode (out-of-band code)
    const oobCode = randomBytes(32).toString('hex');
    const oobCodeExpiresAt = new Date(
      Date.now() + OOB_CODE_EXPIRES_IN_HOURS * 60 * 60 * 1000
    ).toISOString();

    // Cập nhật oobCode vào database
    const updateUserMutation = `
      mutation UpdateUserOobCode(
        $id: Int!
        $oobCode: String!
        $expiresAt: timestamptz!
      ) {
        update_User_by_pk(
          pk_columns: { id: $id }
          _set: { oobCode: $oobCode, oobCodeExpiresAt: $expiresAt }
        ) {
          id
        }
      }
    `;

    try {
      await hasura(updateUserMutation, {
        id: user.id,
        oobCode,
        expiresAt: oobCodeExpiresAt,
      });
    } catch (updateError) {
      console.error('Failed to update oobCode:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate reset code' },
        { status: 500 }
      );
    }

    // Tạo reset link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4001';
    const resetLink = `${clientUrl}/auth/reset-password?oobCode=${oobCode}`;

    // Gửi email
    try {
      await sendResetPasswordEmail(
        user.email,
        user.name,
        resetLink,
        locale,
        messages as {
          Email: {
            forgotPassword: {
              subject: string;
              expiryTime: string;
              text: string;
            };
          };
        }
      );
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process forgot password request',
      },
      { status: 500 }
    );
  }
}
