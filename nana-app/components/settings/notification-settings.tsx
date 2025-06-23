'use client'

import { useState, useEffect } from 'react'
import { Bell, Save, Plus, Trash2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

interface NotificationSetting {
  id: string
  method: 'popup' | 'email'
  minutes: number
  label: string
}

const DEFAULT_NOTIFICATIONS: Omit<NotificationSetting, 'id'>[] = [
  { method: 'popup', minutes: 15, label: '15分前' },
  { method: 'popup', minutes: 180, label: '3時間前' },
  { method: 'popup', minutes: 60 * 24, label: '1日前' },
]

const PRESET_OPTIONS = [
  { minutes: 5, label: '5分前' },
  { minutes: 15, label: '15分前' },
  { minutes: 30, label: '30分前' },
  { minutes: 60, label: '1時間前' },
  { minutes: 120, label: '2時間前' },
  { minutes: 180, label: '3時間前' },
  { minutes: 360, label: '6時間前' },
  { minutes: 720, label: '12時間前' },
  { minutes: 60 * 24, label: '1日前' },
  { minutes: 60 * 24 * 2, label: '2日前' },
  { minutes: 60 * 24 * 3, label: '3日前' },
  { minutes: 60 * 24 * 7, label: '1週間前' },
]

export default function NotificationSettings() {
  const [notifications, setNotifications] = useState<NotificationSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // ユーザー設定を取得（user_tokensテーブルを拡張するか、新しいテーブルを作成）
      const { data } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'notification_settings')
        .single()

      if (data?.access_token) {
        const settings = JSON.parse(data.access_token) as NotificationSetting[]
        setNotifications(settings)
      } else {
        // デフォルト設定を適用
        const defaultSettings = DEFAULT_NOTIFICATIONS.map((setting, index) => ({
          ...setting,
          id: `default-${index}`,
        }))
        setNotifications(defaultSettings)
      }
    } catch (error) {
      // デフォルト設定にフォールバック
      const defaultSettings = DEFAULT_NOTIFICATIONS.map((setting, index) => ({
        ...setting,
        id: `default-${index}`,
      }))
      setNotifications(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // 設定を保存
      const { error } = await supabase.from('user_tokens').upsert({
        user_id: user.id,
        provider: 'notification_settings',
        access_token: JSON.stringify(notifications),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      // 成功メッセージを表示
      alert('通知設定を保存しました')
    } catch (error) {
      alert('設定の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const addNotification = (minutes: number, label: string) => {
    const newNotification: NotificationSetting = {
      id: `custom-${Date.now()}`,
      method: 'popup',
      minutes,
      label,
    }
    setNotifications([...notifications, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const toggleMethod = (id: string) => {
    setNotifications(
      notifications.map(n =>
        n.id === id
          ? { ...n, method: n.method === 'popup' ? 'email' : 'popup' }
          : n
      )
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          通知設定
        </CardTitle>
        <CardDescription>
          課題の締切前に受け取る通知のタイミングを設定できます
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 現在の通知設定 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            現在の通知設定
          </h3>
          <div className="space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      notification.method === 'popup' ? 'default' : 'secondary'
                    }
                  >
                    {notification.method === 'popup'
                      ? 'ポップアップ'
                      : 'メール'}
                  </Badge>
                  <span className="text-sm font-medium">
                    {notification.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMethod(notification.id)}
                    className="text-xs"
                  >
                    {notification.method === 'popup'
                      ? 'メールに変更'
                      : 'ポップアップに変更'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNotification(notification.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                通知設定がありません
              </div>
            )}
          </div>
        </div>

        {/* プリセット通知の追加 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">通知を追加</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {PRESET_OPTIONS.map(option => {
              const isAlreadyAdded = notifications.some(
                n => n.minutes === option.minutes
              )
              return (
                <Button
                  key={option.minutes}
                  variant="outline"
                  size="sm"
                  onClick={() => addNotification(option.minutes, option.label)}
                  disabled={isAlreadyAdded}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '設定を保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
