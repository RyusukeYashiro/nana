import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { GoogleCalendarService, createAssignmentEvent } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, title, courseName, deadline, category } = await request.json()

    // ユーザー認証確認
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザーのGoogleカレンダートークンを取得
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', userData.user.id)
      .eq('provider', 'google_calendar')
      .single()

    if (tokenError || !tokenData?.access_token) {
      return NextResponse.json(
        { error: 'Googleカレンダーとの連携が必要です' },
        { status: 400 }
      )
    }

    // Googleカレンダーイベントを作成
    const calendarService = new GoogleCalendarService(tokenData.access_token)
    const event = createAssignmentEvent(title, courseName, deadline, category)
    const eventId = await calendarService.createEvent(event)

    // 課題にイベントIDを保存
    const { error: updateError } = await supabase
      .from('assignments')
      .update({ calendar_event_id: eventId })
      .eq('id', assignmentId)
      .eq('course_id', assignmentId) // セキュリティのため、ユーザーの課題のみ更新可能にする追加チェックが必要

    if (updateError) {
      console.error('Error updating assignment with event ID:', updateError)
      // カレンダーイベントは作成されたが、DBの更新に失敗した場合の処理
      // 必要に応じてイベントを削除するか、ログに記録
    }

    return NextResponse.json({ success: true, eventId })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'カレンダーイベントの作成に失敗しました' },
      { status: 500 }
    )
  }
}