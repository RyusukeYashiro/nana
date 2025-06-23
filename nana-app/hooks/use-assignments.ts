import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { AssignmentWithCourse, Course } from '@/lib/types/database'

export function useAssignments() {
  const [assignments, setAssignments] = useState<AssignmentWithCourse[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = async (statusFilter?: string) => {
    try {
      setError(null)

      let query = supabase.from('assignments').select(`
          *,
          courses!inner (
            name,
            code
          )
        `)

      // ステータスフィルターがある場合は適用
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      } else {
        // デフォルトでは完了していない課題のみを表示
        query = query.neq('status', '完了')
      }

      const { data: assignmentData, error: assignmentError } =
        await query.order('deadline', { ascending: true })

      if (assignmentError) throw assignmentError

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .order('name')

      if (courseError) throw courseError

      setAssignments(assignmentData || [])
      setCourses(courseData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '課題の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async (data: {
    title: string
    subject: string
    category: string
    deadline: string
  }) => {
    try {
      setError(null)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('認証が必要です')

      // 科目を取得または作成
      let courseId = ''
      let existingCourse = courses.find(
        c => c.name === data.subject || c.code === data.subject
      )

      if (!existingCourse) {
        const { data: newCourse, error: courseError } = await supabase
          .from('courses')
          .insert({
            name: data.subject,
            user_id: userData.user.id,
          })
          .select()
          .single()

        if (courseError) throw courseError
        courseId = newCourse.id
      } else {
        courseId = existingCourse.id
      }

      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          course_id: courseId,
          title: data.title,
          category: data.category,
          deadline: data.deadline,
        })

      if (assignmentError) throw assignmentError

      // データを再取得
      await fetchAssignments()

      return { success: true }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '課題の作成に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  return {
    assignments,
    courses,
    loading,
    error,
    refetch: fetchAssignments,
    createAssignment,
  }
}
