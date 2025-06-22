'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { ArrowLeft, Save, Sparkles } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']

interface ParsedAssignment {
  subject: string
  title: string
  category: string
  deadline: string
}

export default function NewAssignment() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [rawText, setRawText] = useState('')
  const [parsedAssignments, setParsedAssignments] = useState<ParsedAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const parseAssignments = () => {
    if (!rawText.trim()) return

    setLoading(true)
    try {
      // 簡単なパースロジック（実際のプロジェクトではより高度なパースが必要）
      const lines = rawText.split('\n').filter(line => line.trim())
      const assignments: ParsedAssignment[] = []

      for (const line of lines) {
        // 基本的なパターンマッチング
        let subject = ''
        let title = line.trim()
        let category = 'レポート'
        let deadline = ''

        // 科目名を抽出（括弧内または最初の単語）
        const subjectMatch = line.match(/【(.+?)】|「(.+?)」|［(.+?)］/)
        if (subjectMatch) {
          subject = subjectMatch[1] || subjectMatch[2] || subjectMatch[3]
          title = title.replace(subjectMatch[0], '').trim()
        }

        // 課題タイプを抽出
        if (line.includes('小テスト') || line.includes('quiz')) {
          category = '小テスト'
        } else if (line.includes('レポート') || line.includes('report')) {
          category = 'レポート'
        } else if (line.includes('課題') || line.includes('assignment')) {
          category = '課題'
        }

        // 締切日を抽出
        const dateMatch = line.match(/(\d{1,2})[\/\-月](\d{1,2})[\/\-日]?(\d{4})?|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)
        if (dateMatch) {
          const now = new Date()
          const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear()
          const month = parseInt(dateMatch[1])
          const day = parseInt(dateMatch[2])
          deadline = new Date(year, month - 1, day, 23, 59).toISOString()
        } else {
          // デフォルトで1週間後
          const nextWeek = new Date()
          nextWeek.setDate(nextWeek.getDate() + 7)
          deadline = nextWeek.toISOString()
        }

        assignments.push({
          subject: subject || '未分類',
          title: title || line.trim(),
          category,
          deadline
        })
      }

      setParsedAssignments(assignments)
    } catch (error) {
      console.error('Error parsing assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAssignment = (index: number, field: keyof ParsedAssignment, value: string) => {
    const updated = [...parsedAssignments]
    updated[index] = { ...updated[index], [field]: value }
    setParsedAssignments(updated)
  }

  const saveAssignments = async () => {
    setSaving(true)
    try {
      for (const assignment of parsedAssignments) {
        // 科目を取得または作成
        let courseId = ''
        let existingCourse = courses.find(c => 
          c.name === assignment.subject || 
          c.code === assignment.subject
        )

        if (!existingCourse) {
          const { data: userData } = await supabase.auth.getUser()
          if (!userData.user) throw new Error('認証が必要です')

          const { data: newCourse, error: courseError } = await supabase
            .from('courses')
            .insert({
              name: assignment.subject,
              user_id: userData.user.id
            })
            .select()
            .single()

          if (courseError) throw courseError
          courseId = newCourse.id
        } else {
          courseId = existingCourse.id
        }

        // 課題を作成
        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            course_id: courseId,
            title: assignment.title,
            category: assignment.category,
            deadline: assignment.deadline
          })

        if (assignmentError) throw assignmentError
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving assignments:', error)
      alert('課題の保存に失敗しました。再試行してください。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <header className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">課題を追加</h1>
          <p className="text-gray-600">シラバスや課題一覧をペーストして、自動的に課題を抽出します</p>
        </header>

        <div className="space-y-8">
          {/* 入力セクション */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">課題情報を入力</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  課題テキスト
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="例:&#10;【情報社会論】レポート課題 12/25まで&#10;【データベース】小テスト 12/20 23:59まで&#10;【プログラミング】課題提出 12/30"
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                />
              </div>
              <button
                onClick={parseAssignments}
                disabled={!rawText.trim() || loading}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? '解析中...' : '自動解析'}
              </button>
            </div>
          </div>

          {/* 解析結果セクション */}
          {parsedAssignments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">解析結果</h2>
              <div className="space-y-4">
                {parsedAssignments.map((assignment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          科目名
                        </label>
                        <input
                          type="text"
                          value={assignment.subject}
                          onChange={(e) => updateAssignment(index, 'subject', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          課題タイトル
                        </label>
                        <input
                          type="text"
                          value={assignment.title}
                          onChange={(e) => updateAssignment(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          種別
                        </label>
                        <select
                          value={assignment.category}
                          onChange={(e) => updateAssignment(index, 'category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="レポート">レポート</option>
                          <option value="小テスト">小テスト</option>
                          <option value="課題">課題</option>
                          <option value="発表">発表</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          締切日時
                        </label>
                        <input
                          type="datetime-local"
                          value={assignment.deadline.slice(0, 16)}
                          onChange={(e) => updateAssignment(index, 'deadline', new Date(e.target.value).toISOString())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveAssignments}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '課題を保存'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}