import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDeadline(deadline: string): string {
  const date = new Date(deadline)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return '期限終了'
  if (days === 0) return '今日'
  if (days === 1) return '明日'
  return `${days}日後`
}

export function getDeadlineColor(deadline: string): string {
  const date = new Date(deadline)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return 'text-red-600 bg-red-50'
  if (days <= 1) return 'text-orange-600 bg-orange-50'
  if (days <= 3) return 'text-yellow-600 bg-yellow-50'
  return 'text-green-600 bg-green-50'
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
