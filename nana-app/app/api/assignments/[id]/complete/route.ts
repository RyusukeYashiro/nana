import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })

    // ユーザー認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const assignmentId = params.id

    // 課題の存在確認とユーザー権限チェック
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, course_id, courses(user_id)')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json(
        { error: '課題が見つかりません' },
        { status: 404 }
      )
    }

    // ユーザーの課題かどうかチェック
    if (assignment.courses?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'アクセス権限がありません' },
        { status: 403 }
      )
    }

    // 課題を完了状態に更新
    const { data, error } = await supabase
      .from('assignments')
      .update({
        status: '完了',
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()

    if (error) {
      return NextResponse.json(
        { error: '課題の完了処理に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '課題を完了しました',
      assignment: data[0],
    })
  } catch (error) {
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 })
  }
}
