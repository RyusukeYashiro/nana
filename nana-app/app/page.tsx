'use client'

import Link from 'next/link'
import { BookOpen, Calendar, Bell, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初回チェック
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      setUser(user)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && session?.user) {
        // ログイン成功時にダッシュボードへリダイレクト
        window.location.href = '/dashboard'
      }
    })

    return () => subscription.unsubscribe()
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="pt-6 pb-8">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Nana</span>
            </div>
            <div className="space-x-4">
              {loading ? (
                <div className="text-gray-500">読み込み中...</div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">ようこそ、{user.email}</span>
                  <Link
                    href="/dashboard"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                  >
                    ダッシュボード
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                  >
                    始める
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main>
          {/* Hero Section */}
          <div className="text-center py-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              大学課題を
              <span className="text-blue-600">もっとスマートに</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              課題の締切を忘れる心配はもうありません。Nanaで課題管理を効率化し、
              学業に集中できる環境を作りましょう。
            </p>
            <div className="space-x-4">
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                無料で始める
              </Link>
              <Link
                href="#features"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                機能を見る
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <section id="features" className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                主な機能
              </h2>
              <p className="text-lg text-gray-600">
                大学生の学業管理に必要な機能を全て集約
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  課題管理
                </h3>
                <p className="text-gray-600">
                  課題の締切や種類を一括管理。テキストをペーストするだけで自動的に課題情報を抽出します。
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  スマート通知
                </h3>
                <p className="text-gray-600">
                  Googleカレンダーと連携し、締切前に自動で通知。もう課題を忘れる心配はありません。
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  授業視聴管理
                </h3>
                <p className="text-gray-600">
                  オンライン授業の視聴状況を記録。進捗を可視化して学習計画を立てやすくします。
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  マルチデバイス
                </h3>
                <p className="text-gray-600">
                  スマホ・PC・タブレットからいつでもアクセス。外出先でも課題状況を確認できます。
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 text-center">
            <div className="bg-blue-600 rounded-2xl px-8 py-12 text-white">
              <h2 className="text-3xl font-bold mb-4">今すぐ始めよう</h2>
              <p className="text-xl mb-8 text-blue-100">
                無料でアカウントを作成して、課題管理を効率化しましょう
              </p>
              <Link
                href="/auth/signup"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                無料でアカウント作成
              </Link>
            </div>
          </section>
        </main>

        <footer className="py-8 text-center text-gray-600">
          <p>&copy; 2024 Nana. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
