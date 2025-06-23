import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { LoginForm, SignupForm } from '@/lib/validations/auth'

export function useAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (data: LoginForm) => {
    try {
      setLoading(true)
      setError(null)

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      if (authData.user) {
        router.push('/dashboard')
        router.refresh()
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (data: SignupForm) => {
    try {
      setLoading(true)
      setError(null)

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      if (authData.user && !authData.user.email_confirmed_at) {
        return { 
          success: true, 
          message: '確認メールを送信しました。メールのリンクをクリックしてアカウントを有効化してください。' 
        }
      } else if (authData.user) {
        router.push('/dashboard')
        router.refresh()
        return { success: true }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アカウント作成に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      })

      if (error) throw error

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Googleログインに失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      router.push('/')
      router.refresh()

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログアウトに失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    login,
    signup,
    loginWithGoogle,
    logout
  }
}