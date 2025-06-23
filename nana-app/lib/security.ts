import { NextRequest } from 'next/server'

/**
 * セキュリティヘッダーの設定
 */
export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

/**
 * CSP (Content Security Policy) ヘッダーの生成
 */
export function generateCSPHeader(): string {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  return csp
}

/**
 * リクエストの検証
 */
export function validateRequest(request: NextRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Content-Type の検証（POST, PUT, PATCH リクエストの場合）
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      errors.push('Invalid Content-Type')
    }
  }

  // User-Agent の検証
  const userAgent = request.headers.get('user-agent')
  if (!userAgent) {
    errors.push('Missing User-Agent')
  }

  // リクエストサイズの制限（10MB）
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    errors.push('Request too large')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 入力のサニタイゼーション
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // 基本的なXSS対策
    .substring(0, 1000) // 長すぎる入力を制限
}

/**
 * SQLインジェクション対策のための基本的なチェック
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
    /(--|\/\*|\*\/)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * レート制限のためのIPアドレス取得
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return request.ip || 'unknown'
}
