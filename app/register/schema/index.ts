import { z } from 'zod';

type RegisterSchemaMessages = {
  usernameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMin: string;
  confirmPasswordRequired: string;
  confirmPasswordMismatch: string;
  termsRequired: string;
};

export const createRegisterSchema = (messages: RegisterSchemaMessages) =>
  z
    .object({
      username: z.string().min(1, { message: messages.usernameRequired }),
      email: z
        .string()
        .min(1, { message: messages.emailRequired })
        .email({ message: messages.emailInvalid }),
      password: z
        .string()
        .min(1, { message: messages.passwordRequired })
        .min(8, { message: messages.passwordMin }),
      confirmPassword: z
        .string()
        .min(1, { message: messages.confirmPasswordRequired }),
      agreeWithTerms: z
        .boolean()
        .refine(value => value, { message: messages.termsRequired }),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: messages.confirmPasswordMismatch,
      path: ['confirmPassword'],
    });

export type RegisterFormSchema = ReturnType<typeof createRegisterSchema>;
export type RegisterFormValues = z.input<RegisterFormSchema>;
export type RegisterFormResult = z.output<RegisterFormSchema>;
