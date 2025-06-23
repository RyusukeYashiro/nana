import { z } from 'zod'
import { LIMITS, ERROR_MESSAGES } from '@/lib/constants'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(LIMITS.EMAIL_MAX_LENGTH, 'メールアドレスが長すぎます')
    .email(ERROR_MESSAGES.INVALID_EMAIL)
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .min(LIMITS.PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT),
})

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
      .max(LIMITS.EMAIL_MAX_LENGTH, 'メールアドレスが長すぎます')
      .email(ERROR_MESSAGES.INVALID_EMAIL)
      .transform(email => email.toLowerCase().trim()),
    password: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
      .min(LIMITS.PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'パスワードは大文字、小文字、数字を含む必要があります'
      )
      .regex(
        /^[A-Za-z\d@$!%*?&]*$/,
        'パスワードに使用できない文字が含まれています'
      ),
    confirmPassword: z.string().min(1, 'パスワード（確認）を入力してください'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: ERROR_MESSAGES.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  })

export type LoginForm = z.infer<typeof loginSchema>
export type SignupForm = z.infer<typeof signupSchema>
