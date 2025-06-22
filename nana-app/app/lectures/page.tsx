'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { Play, CheckCircle, Circle, Calendar, BookOpen, Clock, User } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']
type Lecture = Database['public']['Tables']['lectures']['Row'] & {
  courses: { name: string; code: string | null }
  lecture_views: { watched_at: string }[]
}

export default function Lectures() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // 講義データを取得（視聴記録も含む）
      const { data: lectureData, error: lectureError } = await supabase
        .from('lectures')
        .select(`
          *,
          courses!inner (
            name,
            code
          ),
          lecture_views!left (
            watched_at
          )
        `)
        .order('date', { ascending: false })

      if (lectureError) throw lectureError

      // 科目データを取得
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .order('name')

      if (courseError) throw courseError

      setLectures(lectureData || [])
      setCourses(courseData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWatchStatus = async (lectureId: string, isWatched: boolean) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      if (isWatched) {
        // 視聴記録を削除
        const { error } = await supabase
          .from('lecture_views')
          .delete()
          .eq('user_id', userData.user.id)
          .eq('lecture_id', lectureId)

        if (error) throw error
      } else {
        // 視聴記録を追加
        const { error } = await supabase
          .from('lecture_views')
          .insert({
            user_id: userData.user.id,
            lecture_id: lectureId
          })

        if (error) throw error
      }

      // データを再取得
      fetchData()
    } catch (error) {
      console.error('Error toggling watch status:', error)
      alert('視聴記録の更新に失敗しました')
    }
  }

  const filteredLectures = lectures.filter(lecture => 
    selectedCourse === 'all' || lecture.course_id === selectedCourse
  )

  const watchedCount = filteredLectures.filter(l => l.lecture_views.length > 0).length
  const totalCount = filteredLectures.length

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">授業視聴管理</h1>
          <p className="text-gray-600">授業動画の視聴状況を管理しましょう</p>
        </header>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                <p className="text-gray-600">総授業数</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{watchedCount}</p>
                <p className="text-gray-600">視聴済み</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0}%
                </p>
                <p className="text-gray-600">進捗率</p>
              </div>
            </div>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">科目で絞り込み:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべての科目</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} {course.code && `(${course.code})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 授業一覧 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">授業一覧</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredLectures.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">授業がありません</h3>
                <p className="text-gray-600">授業データを追加してください。</p>
              </div>
            ) : (
              filteredLectures.map((lecture) => {
                const isWatched = lecture.lecture_views.length > 0
                const watchedDate = isWatched ? new Date(lecture.lecture_views[0].watched_at) : null

                return (
                  <div key={lecture.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleWatchStatus(lecture.id, isWatched)}
                          className="flex-shrink-0"
                        >
                          {isWatched ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{lecture.title}</h3>
                          <div className="mt-1 flex items-center text-sm text-gray-600 space-x-4">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                              {lecture.courses.name}
                              {lecture.courses.code && ` (${lecture.courses.code})`}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(lecture.date).toLocaleDateString('ja-JP')}
                            </span>
                            {isWatched && watchedDate && (
                              <span className="flex items-center text-green-600">
                                <User className="h-4 w-4 mr-1" />
                                {watchedDate.toLocaleDateString('ja-JP')} 視聴済み
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {lecture.video_url && (
                          <a
                            href={lecture.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            視聴
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* サンプルデータ追加ボタン（開発用） */}
        <div className="mt-8 text-center">
          <button
            onClick={async () => {
              try {
                const { data: userData } = await supabase.auth.getUser()
                if (!userData.user) return

                // サンプル科目を作成
                const { data: course, error: courseError } = await supabase
                  .from('courses')
                  .insert({
                    name: '情報社会論',
                    code: 'INFO101',
                    user_id: userData.user.id
                  })
                  .select()
                  .single()

                if (courseError) throw courseError

                // サンプル講義を作成
                const lectures = [
                  { title: '第1回: イントロダクション', date: '2024-04-10' },
                  { title: '第2回: インターネットの歴史', date: '2024-04-17' },
                  { title: '第3回: SNSと社会', date: '2024-04-24' }
                ]

                for (const lecture of lectures) {
                  await supabase
                    .from('lectures')
                    .insert({
                      course_id: course.id,
                      title: lecture.title,
                      date: lecture.date,
                      video_url: 'https://example.com/video'
                    })
                }

                fetchData()
                alert('サンプルデータを追加しました')
              } catch (error) {
                console.error('Error adding sample data:', error)
                alert('サンプルデータの追加に失敗しました')
              }
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            サンプルデータを追加（開発用）
          </button>
        </div>
      </div>
    </div>
  )
}