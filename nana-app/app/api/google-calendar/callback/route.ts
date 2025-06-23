import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createServerClient } from '@supabase/ssr'
import { GOOGLE_OAUTH_CONFIG } from '@/lib/google-calendar'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()

  // サーバー側でユーザーセッションを取得
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, _options: any) {
          cookieStore.delete(name)
        },
      },
    }
  )

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?error=access_denied`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?error=no_code`
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_OAUTH_CONFIG.clientId,
      GOOGLE_OAUTH_CONFIG.clientSecret,
      GOOGLE_OAUTH_CONFIG.redirectUri
    )

    // 認可コードをアクセストークンに交換
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?error=no_token`
      )
    }

    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?error=auth_required`
      )
    }

    // トークンをSupabaseに保存（ユーザープロファイルまたは別テーブル）
    // 注意: 実際のプロダクションでは、トークンは暗号化して保存することを推奨
    const { error: updateError } = await supabase.from('user_tokens').upsert({
      user_id: userData.user.id,
      provider: 'google_calendar',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    })

    if (updateError) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard?error=save_failed`
      )
    }

    const response = NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard?success=calendar_connected`
    )

    // クッキーを正しく設定するため
    return response
  } catch (error) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard?error=callback_failed`
    )
  }
}
