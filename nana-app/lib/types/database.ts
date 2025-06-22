export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          user_id: string
          name: string
          code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          code?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          category: string | null
          deadline: string
          calendar_event_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          category?: string | null
          deadline: string
          calendar_event_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          category?: string | null
          deadline?: string
          calendar_event_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      lectures: {
        Row: {
          id: string
          course_id: string
          title: string
          date: string
          video_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          date: string
          video_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          date?: string
          video_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lectures_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      lecture_views: {
        Row: {
          id: string
          user_id: string
          lecture_id: string
          watched_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lecture_id: string
          watched_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lecture_id?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecture_views_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          }
        ]
      }
      user_tokens: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Course = Database['public']['Tables']['courses']['Row']
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type Lecture = Database['public']['Tables']['lectures']['Row']
export type LectureView = Database['public']['Tables']['lecture_views']['Row']
export type UserToken = Database['public']['Tables']['user_tokens']['Row']

// Extended types with relationships
export type AssignmentWithCourse = Assignment & {
  courses: Pick<Course, 'name' | 'code'>
}

export type LectureWithCourse = Lecture & {
  courses: Pick<Course, 'name' | 'code'>
  lecture_views: Pick<LectureView, 'watched_at'>[]
}