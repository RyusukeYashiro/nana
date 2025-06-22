'use client'

import { Plus, Calendar, BookOpen, Clock } from 'lucide-react'
import Link from 'next/link'

import { useAssignments } from '@/hooks/use-assignments'
import { formatDeadline, getDeadlineColor, formatDate } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function DashboardPage() {
  const { assignments, courses, loading, error } = useAssignments()

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
    const days = Math.ceil((new Date(a.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days <= 3 && days >= 0
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">課題管理ダッシュボード</h1>
        <p className="text-gray-600 mt-2">締切の近い課題を確認しましょう</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">履修科目</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総課題数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">緊急課題</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentAssignments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>課題一覧</CardTitle>
            <CardDescription>締切の近い課題から表示されています</CardDescription>
          </div>
          <Button asChild>
            <Link href="/assignments/new">
              <Plus className="h-4 w-4 mr-2" />
              課題を追加
            </Link>
          </Button>
        </CardHeader>
        
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">課題がありません</h3>
              <p className="text-gray-600 mb-4">最初の課題を追加してみましょう</p>
              <Button asChild>
                <Link href="/assignments/new">
                  <Plus className="h-4 w-4 mr-2" />
                  課題を追加
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const deadlineColor = getDeadlineColor(assignment.deadline)
                const deadlineText = formatDeadline(assignment.deadline)
                
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {assignment.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                        <Badge variant="secondary">
                          {assignment.courses.name}
                          {assignment.courses.code && ` (${assignment.courses.code})`}
                        </Badge>
                        {assignment.category && (
                          <Badge variant="outline">
                            {assignment.category}
                          </Badge>
                        )}
                        <span className="text-gray-500">
                          {formatDate(assignment.deadline)}
                        </span>
                      </div>
                    </div>
                    
                    <Badge
                      variant={
                        deadlineText === '期限切れ' ? 'destructive' :
                        deadlineText === '今日' || deadlineText === '明日' ? 'urgent' :
                        deadlineText.includes('日後') && parseInt(deadlineText) <= 3 ? 'warning' :
                        'success'
                      }
                    >
                      {deadlineText}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}