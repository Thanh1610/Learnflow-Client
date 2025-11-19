import { z } from 'zod';

type LoginSchemaMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMin: string;
};

export const createLoginSchema = (messages: LoginSchemaMessages) =>
  z.object({
    email: z
      .string()
      .min(1, { message: messages.emailRequired })
      .email({ message: messages.emailInvalid }),
    password: z
      .string()
      .min(1, { message: messages.passwordRequired })
      .min(8, { message: messages.passwordMin }),
  });

export type LoginFormSchema = ReturnType<typeof createLoginSchema>;
export type LoginFormValues = z.input<LoginFormSchema>;
export type LoginFormResult = z.output<LoginFormSchema>;
