// Application constants
export const APP_NAME = 'Nana'
export const APP_DESCRIPTION = '大学課題通知システム'

// Assignment categories
export const ASSIGNMENT_CATEGORIES = [
  'レポート',
  '小テスト',
  '課題',
  '発表',
  'プロジェクト',
  'その他'
] as const

// Date constraints
export const MIN_DEADLINE_DAYS = 0 // 今日から
export const MAX_DEADLINE_DAYS = 365 // 1年後まで

// Validation limits
export const LIMITS = {
  TITLE_MAX_LENGTH: 200,
  SUBJECT_MAX_LENGTH: 100,
  CODE_MAX_LENGTH: 20,
  URL_MAX_LENGTH: 500,
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_MAX_LENGTH: 254
} as const

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'この項目は必須です',
  INVALID_EMAIL: '有効なメールアドレスを入力してください',
  PASSWORD_TOO_SHORT: `パスワードは${LIMITS.PASSWORD_MIN_LENGTH}文字以上で入力してください`,
  PASSWORD_MISMATCH: 'パスワードが一致しません',
  INVALID_DATE: '有効な日付を入力してください',
  FUTURE_DATE_REQUIRED: '締切日時は現在時刻より後に設定してください',
  INVALID_URL: '有効なURLを入力してください',
  TITLE_TOO_LONG: `タイトルは${LIMITS.TITLE_MAX_LENGTH}文字以内で入力してください`,
  SUBJECT_TOO_LONG: `科目名は${LIMITS.SUBJECT_MAX_LENGTH}文字以内で入力してください`,
  CODE_TOO_LONG: `科目コードは${LIMITS.CODE_MAX_LENGTH}文字以内で入力してください`,
  AUTHENTICATION_REQUIRED: '認証が必要です',
  UNAUTHORIZED: 'この操作を実行する権限がありません',
  SERVER_ERROR: 'サーバーエラーが発生しました'
} as const

// API rate limiting
export const RATE_LIMITS = {
  DEFAULT: 100, // requests per minute
  AUTH: 10, // login/signup attempts per minute
  SEARCH: 50 // search requests per minute
} as const