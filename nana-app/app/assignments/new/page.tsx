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
  const [error, setError] = useState<string | null>(null)

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

  const validateFormat = (lines: string[]): { isValid: boolean; errorMessage?: string } => {
    // 4行セットの検証
    if (lines.length % 4 !== 0) {
      return {
        isValid: false,
        errorMessage: `入力データが不正です。4行セット（科目名→種別→タイトル→締切）で入力してください。現在の行数: ${lines.length}行`
      }
    }

    // 各セットの内容を検証
    for (let i = 0; i < lines.length; i += 4) {
      const subject = lines[i]?.trim()
      const category = lines[i + 1]?.trim()
      const title = lines[i + 2]?.trim()
      const deadline = lines[i + 3]?.trim()

      // 空行チェック
      if (!subject || !category || !title || !deadline) {
        return {
          isValid: false,
          errorMessage: `${Math.floor(i / 4) + 1}番目の課題データに空行があります。4行全てに内容を入力してください。`
        }
      }

      // 日付形式チェック
      const datePattern = /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}(\s+\d{1,2}:\d{2})?/
      if (!datePattern.test(deadline)) {
        return {
          isValid: false,
          errorMessage: `${Math.floor(i / 4) + 1}番目の課題の締切日時が正しい形式ではありません。"YYYY/MM/DD HH:MM" 形式で入力してください。例: 2025/06/24 22:00`
        }
      }

      // 種別チェック
      const validCategories = ['レポート', '小テスト', '課題', '発表', 'テスト', '試験']
      if (!validCategories.some(cat => category.includes(cat))) {
        return {
          isValid: false,
          errorMessage: `${Math.floor(i / 4) + 1}番目の課題の種別が認識できません。"${category}" → レポート、小テスト、課題、発表などの種別を含めてください。`
        }
      }
    }

    return { isValid: true }
  }

  const parseAssignments = () => {
    if (!rawText.trim()) {
      setError('課題データを入力してください。')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const lines = rawText.split('\n').filter(line => line.trim())
      
      // フォーマット検証
      const validation = validateFormat(lines)
      if (!validation.isValid) {
        setError(validation.errorMessage!)
        setLoading(false)
        return
      }

      const assignments: ParsedAssignment[] = []

      // 4行セットでパース（科目名→種別→タイトル→締切）
      for (let i = 0; i < lines.length; i += 4) {
        const subject = lines[i].trim()
        const category = lines[i + 1].trim()
        const title = lines[i + 2].trim()
        const deadlineText = lines[i + 3].trim()

        // 締切日時をパース
        let deadline = ''
        
        try {
          // YYYY/MM/DD HH:MM 形式を処理
          const dateTimeMatch = deadlineText.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})/)
          if (dateTimeMatch) {
            const year = parseInt(dateTimeMatch[1])
            const month = parseInt(dateTimeMatch[2])
            const day = parseInt(dateTimeMatch[3])
            const hour = parseInt(dateTimeMatch[4])
            const minute = parseInt(dateTimeMatch[5])
            
            const parsedDate = new Date(year, month - 1, day, hour, minute)
            if (isNaN(parsedDate.getTime())) {
              throw new Error(`無効な日付: ${deadlineText}`)
            }
            deadline = parsedDate.toISOString()
          } else {
            // その他の日付形式を試行
            const dateMatch = deadlineText.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
            if (dateMatch) {
              const year = parseInt(dateMatch[1])
              const month = parseInt(dateMatch[2])
              const day = parseInt(dateMatch[3])
              
              const parsedDate = new Date(year, month - 1, day, 23, 59)
              if (isNaN(parsedDate.getTime())) {
                throw new Error(`無効な日付: ${deadlineText}`)
              }
              deadline = parsedDate.toISOString()
            } else {
              throw new Error(`日付形式が認識できません: ${deadlineText}`)
            }
          }
        } catch (dateError) {
          setError(`${Math.floor(i / 4) + 1}番目の課題の日付解析エラー: ${dateError instanceof Error ? dateError.message : '不明なエラー'}`)
          setLoading(false)
          return
        }

        // 種別を正規化
        let normalizedCategory = category
        if (category.includes('小テスト') || category.includes('テスト') || category.includes('試験')) {
          normalizedCategory = '小テスト'
        } else if (category.includes('レポート')) {
          normalizedCategory = 'レポート'
        } else if (category.includes('課題')) {
          normalizedCategory = '課題'
        } else if (category.includes('発表')) {
          normalizedCategory = '発表'
        }

        assignments.push({
          subject: subject,
          title: title,
          category: normalizedCategory,
          deadline
        })
      }

      if (assignments.length === 0) {
        setError('有効な課題データが見つかりませんでした。正しいフォーマットで入力してください。')
        setLoading(false)
        return
      }

      setParsedAssignments(assignments)
      setError(null) // 成功時はエラーをクリア
    } catch (error) {
      console.error('Error parsing assignments:', error)
      setError(error instanceof Error ? error.message : '課題の解析中にエラーが発生しました。')
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
                  placeholder="4行セットで入力してください：&#10;情報社会論Ｂ&#10;レポート&#10;2025年度「情報社会論B」中間レポート課題（Part.1）&#10;2025/06/24 22:00&#10;&#10;ビジネスと法Ａ〔Ｍ〕&#10;小テスト&#10;第９回　小テスト&#10;2025/06/26 06:00"
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={8}
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
              
              {/* エラー表示 */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        入力エラー
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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