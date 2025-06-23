'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Calendar,
  BookOpen,
  ExternalLink,
  CheckCircle,
  ChevronDown,
  Target,
  Zap,
  Filter,
} from 'lucide-react'
import Link from 'next/link'

import { useAssignments } from '@/hooks/use-assignments'
import { formatDeadline, formatDate } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import NotificationSettings from '@/components/settings/notification-settings'

export default function DashboardPage() {
  const { assignments, courses, loading, error, refetch } = useAssignments()
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [connectingCalendar, setConnectingCalendar] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  // Google Calendar連携状態をチェック
  useEffect(() => {
    checkCalendarConnection()

    // URLパラメータから連携成功メッセージを確認
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'calendar_connected') {
      setCalendarConnected(true)
      // URLをクリーンアップ
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const checkCalendarConnection = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .single()

      setCalendarConnected(!!data)
    } catch (error) {
      // Silent error handling
    }
  }

  const connectGoogleCalendar = async () => {
    try {
      setConnectingCalendar(true)
      const response = await fetch('/api/google-calendar/auth')
      const data = await response.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setConnectingCalendar(false)
    }
  }

  const createCalendarEvent = async (assignment: any, duration?: number) => {
    try {
      const response = await fetch('/api/google-calendar/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: assignment.id,
          title: assignment.title,
          courseName: assignment.courses.name,
          deadline: assignment.deadline,
          category: assignment.category,
          duration: duration || 30, // デフォルト30分
        }),
      })

      const responseData = await response.json()

      if (response.ok) {
        alert(
          `Googleカレンダーにイベントを追加しました！（${duration || 30}分間）`
        )
        // 課題リストを再読み込み
        window.location.reload()
      } else {
        alert(
          `カレンダーイベントの作成に失敗しました: ${responseData.error || 'Unknown error'}`
        )
      }
    } catch (error) {
      alert('カレンダーイベントの作成に失敗しました')
    }
  }

  const completeAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/complete`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        alert('課題を完了しました！')
        // 課題リストを再読み込み
        refetch()
      } else {
        const data = await response.json()
        alert(`課題の完了処理に失敗しました: ${data.error}`)
      }
    } catch (error) {
      alert('課題の完了処理に失敗しました')
    }
  }

  const createBulkCalendarEvents = async () => {
    if (assignments.length === 0) {
      alert('追加する課題がありません')
      return
    }

    const confirmMessage = `${assignments.length}件の課題を一括でカレンダーに追加します（各30分間）。よろしいですか？`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      let successCount = 0
      let errorCount = 0

      for (const assignment of assignments) {
        try {
          const response = await fetch('/api/google-calendar/create-event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assignmentId: assignment.id,
              title: assignment.title,
              courseName: assignment.courses.name,
              deadline: assignment.deadline,
              category: assignment.category,
              duration: 30,
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      if (errorCount === 0) {
        alert(`✅ ${successCount}件の課題をカレンダーに追加しました！`)
      } else {
        alert(`⚠️ ${successCount}件成功、${errorCount}件失敗しました`)
      }

      // 課題リストを再読み込み
      window.location.reload()
    } catch (error) {
      alert('一括カレンダー追加に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        <p>エラーが発生しました: {error}</p>
      </div>
    )
  }

  const urgentAssignments = assignments.filter(a => {
    const days = Math.ceil(
      (new Date(a.deadline).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
    return days <= 3 && days >= 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            課題管理ダッシュボード
          </h1>
          <p className="text-slate-600 text-xl">
            締切の近い課題を確認しましょう ✨
          </p>
        </div>

        {/* Google Calendar Integration */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              Googleカレンダー連携
            </CardTitle>
            <CardDescription className="text-slate-600">
              課題の締切をGoogleカレンダーに自動で追加できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calendarConnected ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-green-700 font-medium">
                  Googleカレンダーと連携済み
                </span>
              </div>
            ) : (
              <Button
                onClick={connectGoogleCalendar}
                disabled={connectingCalendar}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {connectingCalendar
                  ? '接続中...'
                  : 'Googleカレンダーと連携する'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings - only show if calendar is connected */}
        {calendarConnected && (
          <div className="mb-6">
            <NotificationSettings />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-blue-800">
                  履修科目
                </CardTitle>
                <p className="text-blue-600 text-sm mt-1">現在受講中</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {courses.length}
              </div>
              <p className="text-blue-600 text-sm mt-1">科目</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-green-800">
                  総課題数
                </CardTitle>
                <p className="text-green-600 text-sm mt-1">管理中の課題</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {assignments.length}
              </div>
              <p className="text-green-600 text-sm mt-1">件</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-orange-800">
                  緊急課題
                </CardTitle>
                <p className="text-orange-600 text-sm mt-1">3日以内の締切</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {urgentAssignments.length}
              </div>
              <p className="text-orange-600 text-sm mt-1">件</p>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                課題一覧
              </CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                {showCompleted
                  ? '✅ 完了した課題を表示しています'
                  : '📅 締切の近い課題から表示されています'}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowCompleted(!showCompleted)
                  refetch(showCompleted ? undefined : '完了')
                }}
                variant="outline"
                className="border-2 hover:bg-slate-50 transition-colors duration-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showCompleted ? '未完了課題を表示' : '完了課題を表示'}
              </Button>
              {calendarConnected &&
                assignments.length > 0 &&
                !showCompleted && (
                  <Button
                    onClick={createBulkCalendarEvents}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    一括追加
                  </Button>
                )}
              <Button
                asChild
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/assignments/new">
                  <Plus className="h-4 w-4 mr-2" />
                  課題を追加
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">
                  {showCompleted
                    ? '完了した課題がありません'
                    : '課題がありません'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {showCompleted
                    ? '課題を完了すると、こちらに表示されます'
                    : '最初の課題を追加してみましょう'}
                </p>
                {!showCompleted && (
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link href="/assignments/new">
                      <Plus className="h-4 w-4 mr-2" />
                      課題を追加
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {assignments.map(assignment => {
                  const deadlineText = formatDeadline(assignment.deadline)

                  return (
                    <div
                      key={assignment.id}
                      className="group p-6 border-0 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200 truncate">
                            {assignment.title}
                          </h3>
                          <div className="mt-3 flex items-center gap-3 text-sm">
                            <Badge
                              variant="secondary"
                              className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {assignment.courses.name}
                              {assignment.courses.code &&
                                ` (${assignment.courses.code})`}
                            </Badge>
                            {assignment.category && (
                              <Badge
                                variant="outline"
                                className="px-3 py-1 bg-slate-50 text-slate-700"
                              >
                                {assignment.category}
                              </Badge>
                            )}
                            <span className="text-slate-500 font-medium">
                              📅 {formatDate(assignment.deadline)}
                            </span>
                            {assignment.calendar_event_id && (
                              <Badge
                                variant="outline"
                                className="px-3 py-1 text-green-600 border-green-200 bg-green-50"
                              >
                                ✅ カレンダー連携済み
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {!showCompleted && (
                            <>
                              {calendarConnected &&
                                !assignment.calendar_event_id && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-sm font-medium border-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                                      >
                                        📅 カレンダーに追加
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-48"
                                    >
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 15)
                                        }
                                        className="py-2"
                                      >
                                        15分間
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 30)
                                        }
                                        className="py-2"
                                      >
                                        30分間
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 45)
                                        }
                                        className="py-2"
                                      >
                                        45分間
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 60)
                                        }
                                        className="py-2"
                                      >
                                        1時間
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 90)
                                        }
                                        className="py-2"
                                      >
                                        1時間30分
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 120)
                                        }
                                        className="py-2"
                                      >
                                        2時間
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 180)
                                        }
                                        className="py-2"
                                      >
                                        3時間
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 240)
                                        }
                                        className="py-2"
                                      >
                                        4時間
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 300)
                                        }
                                        className="py-2"
                                      >
                                        5時間
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          createCalendarEvent(assignment, 360)
                                        }
                                        className="py-2"
                                      >
                                        6時間
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              <Button
                                onClick={() =>
                                  completeAssignment(assignment.id)
                                }
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                                size="sm"
                              >
                                ✅ 完了
                              </Button>
                            </>
                          )}
                          {showCompleted ? (
                            <Badge className="px-4 py-2 bg-green-100 text-green-800 border-green-200 font-medium">
                              ✅ 完了済み
                            </Badge>
                          ) : (
                            <Badge
                              className={`px-4 py-2 font-medium ${
                                deadlineText === '期限切れ'
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : deadlineText === '今日' ||
                                      deadlineText === '明日'
                                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                                    : deadlineText.includes('日後') &&
                                        parseInt(deadlineText) <= 3
                                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                      : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}
                            >
                              {deadlineText}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
