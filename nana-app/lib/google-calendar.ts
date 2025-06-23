import { google } from 'googleapis'

export interface CalendarEvent {
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  reminders: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export class GoogleCalendarService {
  private calendar: any
  private auth: any

  constructor(accessToken: string, refreshToken?: string) {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    this.auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    this.calendar = google.calendar({ version: 'v3', auth: this.auth })
  }

  private async refreshTokenIfNeeded(): Promise<{
    access_token?: string
    refresh_token?: string
  }> {
    try {
      // トークンの有効性をチェックし、必要に応じてリフレッシュ
      const { credentials } = await this.auth.refreshAccessToken()

      if (credentials.access_token) {
        // 新しいトークンでクレデンシャルを更新
        this.auth.setCredentials(credentials)

        return {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || undefined,
        }
      }

      return {}
    } catch (error) {
      throw new Error('認証トークンの更新に失敗しました')
    }
  }

  async createEvent(event: CalendarEvent): Promise<{
    eventId: string
    refreshedTokens?: { access_token: string; refresh_token?: string }
  }> {
    try {
      // まず通常のリクエストを試行
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      })

      return { eventId: response.data.id }
    } catch (error: any) {
      // 401エラーの場合、トークンをリフレッシュして再試行
      if (error.code === 401 || error.status === 401) {

        try {
          const refreshedTokens = await this.refreshTokenIfNeeded()

          // リフレッシュ後に再試行
          const retryResponse = await this.calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
          })

          return {
            eventId: retryResponse.data.id,
            refreshedTokens: refreshedTokens.access_token
              ? {
                  access_token: refreshedTokens.access_token,
                  refresh_token: refreshedTokens.refresh_token,
                }
              : undefined,
          }
        } catch (refreshError) {
          throw new Error('認証トークンの更新に失敗しました')
        }
      }

      throw new Error('カレンダーイベントの作成に失敗しました')
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    try {
      await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event,
      })
    } catch (error) {
      throw new Error('カレンダーイベントの更新に失敗しました')
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      })
    } catch (error) {
      throw new Error('カレンダーイベントの削除に失敗しました')
    }
  }
}

export function createAssignmentEvent(
  title: string,
  courseName: string,
  deadline: string,
  category?: string,
  customReminders?: Array<{ method: 'email' | 'popup'; minutes: number }>,
  duration?: number
): CalendarEvent {
  const deadlineDate = new Date(deadline)
  const eventTitle = `【課題】${title}`
  const eventDescription = `科目: ${courseName}${category ? `\n種別: ${category}` : ''}\n締切: ${deadlineDate.toLocaleString('ja-JP')}`

  // 指定された時間分、締切前に終了するイベントとして作成
  const eventDuration = duration || 30 // デフォルト30分
  const endTime = new Date(deadlineDate.getTime())
  const startTime = new Date(deadlineDate.getTime() - eventDuration * 60 * 1000)

  return {
    summary: eventTitle,
    description: eventDescription,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Asia/Tokyo',
    },
    reminders: {
      useDefault: false,
      overrides: customReminders || [
        { method: 'popup', minutes: 60 * 24 }, // 24時間前
        { method: 'popup', minutes: 180 }, // 3時間前
        { method: 'popup', minutes: 15 }, // 15分前
      ],
    },
  }
}

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
]

export const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!,
}
