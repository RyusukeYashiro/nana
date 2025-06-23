import { z } from 'zod'
import { LIMITS, ERROR_MESSAGES, ASSIGNMENT_CATEGORIES } from '@/lib/constants'

export const assignmentSchema = z.object({
  title: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .transform(str => str.trim()),
  subject: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(LIMITS.SUBJECT_MAX_LENGTH, ERROR_MESSAGES.SUBJECT_TOO_LONG)
    .transform(str => str.trim()),
  category: z.enum(ASSIGNMENT_CATEGORIES, {
    errorMap: () => ({ message: '有効な種別を選択してください' }),
  }),
  deadline: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .refine(
      date => !isNaN(new Date(date).getTime()),
      ERROR_MESSAGES.INVALID_DATE
    )
    .refine(
      date => new Date(date) > new Date(),
      ERROR_MESSAGES.FUTURE_DATE_REQUIRED
    )
    .refine(date => {
      const inputDate = new Date(date)
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + 365) // 1年後まで
      return inputDate <= maxDate
    }, '締切日時は1年以内に設定してください'),
})

export const courseSchema = z.object({
  name: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(LIMITS.SUBJECT_MAX_LENGTH, ERROR_MESSAGES.SUBJECT_TOO_LONG)
    .transform(str => str.trim()),
  code: z
    .string()
    .max(LIMITS.CODE_MAX_LENGTH, ERROR_MESSAGES.CODE_TOO_LONG)
    .transform(str => str.trim())
    .optional()
    .or(z.literal('')),
})

export const lectureSchema = z.object({
  title: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .transform(str => str.trim()),
  courseId: z
    .string()
    .min(1, '科目を選択してください')
    .uuid('無効な科目IDです'),
  date: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .refine(
      date => !isNaN(new Date(date).getTime()),
      ERROR_MESSAGES.INVALID_DATE
    ),
  videoUrl: z
    .string()
    .max(LIMITS.URL_MAX_LENGTH, 'URLが長すぎます')
    .url(ERROR_MESSAGES.INVALID_URL)
    .optional()
    .or(z.literal(''))
    .transform(str => str?.trim() || ''),
})

export type AssignmentForm = z.infer<typeof assignmentSchema>
export type CourseForm = z.infer<typeof courseSchema>
export type LectureForm = z.infer<typeof lectureSchema>
