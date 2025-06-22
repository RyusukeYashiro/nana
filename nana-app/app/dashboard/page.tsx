'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { Plus, Calendar, BookOpen, Clock } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']
type Assignment = Database['public']['Tables']['assignments']['Row'] & {
  courses: { name: string; code: string | null }
}

export default function Dashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 課題データを取得（科目情報も含む）
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          courses!inner (
            name,
            code
          )
        `)
        .order('deadline', { ascending: true })

      if (assignmentError) throw assignmentError

      // 科目データを取得
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .order('name')

      if (courseError) throw courseError

      setAssignments(assignmentData || [])
      setCourses(courseData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) return '期限切れ'
    if (days === 0) return '今日'
    if (days === 1) return '明日'
    return `${days}日後`
  }

  const getDeadlineColor = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) return 'text-red-600 bg-red-50'
    if (days <= 1) return 'text-orange-600 bg-orange-50'
    if (days <= 3) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">課題管理ダッシュボード</h1>
          <p className="text-gray-600">締切の近い課題を確認しましょう</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                <p className="text-gray-600">履修科目</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                <p className="text-gray-600">総課題数</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => {
                    const days = Math.ceil((new Date(a.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return days <= 3 && days >= 0
                  }).length}
                </p>
                <p className="text-gray-600">緊急課題</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">課題一覧</h2>
            <a 
              href="/assignments/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              課題を追加
            </a>
          </div>
          
          <div className="divide-y divide-gray-200">
            {assignments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">課題がありません</h3>
                <p className="text-gray-600 mb-4">最初の課題を追加してみましょう</p>
                <a 
                  href="/assignments/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  課題を追加
                </a>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium mr-3">
                          {assignment.courses.name}
                          {assignment.courses.code && ` (${assignment.courses.code})`}
                        </span>
                        {assignment.category && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-3">
                            {assignment.category}
                          </span>
                        )}
                        <span className="text-gray-500">
                          {new Date(assignment.deadline).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDeadlineColor(assignment.deadline)}`}>
                      {formatDeadline(assignment.deadline)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}