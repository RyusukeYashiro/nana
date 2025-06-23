import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  GoogleCalendarService,
  createAssignmentEvent,
} from '@/lib/google-calendar'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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
    const { assignmentId, title, courseName, deadline, category, duration } =
      await request.json()

    // ユーザー認証確認
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザーのGoogleカレンダートークンを取得
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', userData.user.id)
      .eq('provider', 'google_calendar')
      .single()


    if (tokenError || !tokenData?.access_token) {
      return NextResponse.json(
        { error: 'Googleカレンダーとの連携が必要です' },
        { status: 400 }
      )
    }

    // ユーザーの通知設定を取得
    const { data: notificationData } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', userData.user.id)
      .eq('provider', 'notification_settings')
      .single()

    let customReminders = undefined
    if (notificationData?.access_token) {
      try {
        const notificationSettings = JSON.parse(notificationData.access_token)
        customReminders = notificationSettings.map((setting: any) => ({
          method: setting.method,
          minutes: setting.minutes,
        }))
      } catch (e) {
        // Failed to parse notification settings, using defaults
      }
    }

    // Googleカレンダーイベントを作成

    try {
      const calendarService = new GoogleCalendarService(
        tokenData.access_token,
        tokenData.refresh_token
      )
      const event = createAssignmentEvent(
        title,
        courseName,
        deadline,
        category,
        customReminders,
        duration
      )


      const result = await calendarService.createEvent(event)

      // トークンがリフレッシュされた場合、データベースを更新
      if (result.refreshedTokens) {
        const { error: tokenUpdateError } = await supabase
          .from('user_tokens')
          .update({
            access_token: result.refreshedTokens.access_token,
            refresh_token:
              result.refreshedTokens.refresh_token || tokenData.refresh_token,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userData.user.id)
          .eq('provider', 'google_calendar')

        if (tokenUpdateError) {
          // Error updating refreshed tokens
        }
      }

      // 課題にイベントIDを保存
      const { error: updateError } = await supabase
        .from('assignments')
        .update({ calendar_event_id: result.eventId })
        .eq('id', assignmentId)

      if (updateError) {
        // カレンダーイベントは作成されたが、DBの更新に失敗した場合の処理
        return NextResponse.json(
          {
            error:
              'カレンダーイベントは作成されましたが、データベースの更新に失敗しました',
          },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, eventId: result.eventId })
    } catch (calendarError) {
      return NextResponse.json(
        {
          error: 'Googleカレンダーイベントの作成に失敗しました',
          details:
            calendarError instanceof Error
              ? calendarError.message
              : String(calendarError),
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'カレンダーイベントの作成に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
