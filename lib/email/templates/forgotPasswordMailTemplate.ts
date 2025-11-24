import { LANGUAGE_TYPE } from '@/config/constants';

type ForgotPasswordMailData = {
  name: string;
  resetLink: string;
  expiryTime?: string; // Thời gian hết hạn (ví dụ: "15 phút", "15 minutes")
};

type ForgotPasswordTemplate = {
  greeting: (name: string) => string;
  subject: string;
  intro: string;
  instruction: string;
  buttonText: string;
  warning: string;
  expiryNote: (time: string) => string;
  closing: string;
  signature: string;
  linkNote: string;
};

const forgotPasswordTemplates: Record<string, ForgotPasswordTemplate> = {
  [LANGUAGE_TYPE.EN]: {
    greeting: (name: string) => `Hello ${name}`,
    subject: 'Reset Your Password',
    intro:
      'We received a request to reset your password for your Learnflow account.',
    instruction: 'Click the button below to reset your password:',
    buttonText: 'Reset Password',
    warning:
      'If you did not request a password reset, please ignore this email or contact support if you have concerns.',
    expiryNote: (time: string) => `This link will expire in ${time}.`,
    closing: 'Best regards',
    signature: 'Learnflow Team',
    linkNote:
      'Note: If the button does not work, you can copy and paste the following link into your browser:',
  },
  [LANGUAGE_TYPE.VI]: {
    greeting: (name: string) => `Xin chào ${name}`,
    subject: 'Đặt lại mật khẩu của bạn',
    intro:
      'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Learnflow của bạn.',
    instruction: 'Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:',
    buttonText: 'Đặt lại mật khẩu',
    warning:
      'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ nếu bạn có lo ngại.',
    expiryNote: (time: string) => `Liên kết này sẽ hết hạn sau ${time}.`,
    closing: 'Trân trọng',
    signature: 'Đội ngũ Learnflow',
    linkNote:
      'Lưu ý: Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:',
  },
};

/**
 * Tạo template email cho việc quên mật khẩu
 * @param data - Dữ liệu (name, resetLink, expiryTime)
 * @param locale - Ngôn ngữ (vi, en)
 * @returns HTML content của email
 */
export const forgotPasswordMailTemplate = (
  data: ForgotPasswordMailData,
  locale: string
): string => {
  const code = (locale || LANGUAGE_TYPE.EN).toLowerCase();
  const template =
    forgotPasswordTemplates[code] || forgotPasswordTemplates[LANGUAGE_TYPE.EN];

  const expiryText = data.expiryTime
    ? `<p style="color: #666; font-size: 14px;">${template.expiryNote(
        data.expiryTime
      )}</p>`
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
        ${template.greeting(data.name)}
      </h1>
      
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        ${template.intro}
      </p>
      
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        ${template.instruction}
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a 
          href="${data.resetLink}" 
          style="
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
          "
        >
          ${template.buttonText}
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
        ${template.warning}
      </p>
      
      ${expiryText}
      
      <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        ${template.closing},<br/>
        ${template.signature}
      </p>
      
      <p style="color: #999; font-size: 12px; margin-top: 20px;">
        <strong>${template.linkNote}</strong><br/>
        <a href="${data.resetLink}" style="color: #007bff; word-break: break-all;">${data.resetLink}</a>
      </p>
    </div>
  `;
};

export type { ForgotPasswordMailData };
