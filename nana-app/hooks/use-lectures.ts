import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { LectureWithCourse, Course } from '@/lib/types/database'

export function useLectures() {
  const [lectures, setLectures] = useState<LectureWithCourse[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLectures = async () => {
    try {
      setError(null)
      
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

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

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .order('name')

      if (courseError) throw courseError

      setLectures(lectureData || [])
      setCourses(courseData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '講義の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const toggleWatchStatus = async (lectureId: string, isWatched: boolean) => {
    try {
      setError(null)
      
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('認証が必要です')

      if (isWatched) {
        const { error } = await supabase
          .from('lecture_views')
          .delete()
          .eq('user_id', userData.user.id)
          .eq('lecture_id', lectureId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('lecture_views')
          .insert({
            user_id: userData.user.id,
            lecture_id: lectureId
          })

        if (error) throw error
      }

      await fetchLectures()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '視聴記録の更新に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const addSampleData = async () => {
    try {
      setError(null)
      
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('認証が必要です')

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

      await fetchLectures()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'サンプルデータの追加に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  useEffect(() => {
    fetchLectures()
  }, [])

  return {
    lectures,
    courses,
    loading,
    error,
    refetch: fetchLectures,
    toggleWatchStatus,
    addSampleData
  }
}