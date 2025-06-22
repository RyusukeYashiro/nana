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

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    this.calendar = google.calendar({ version: 'v3', auth })
  }

  async createEvent(event: CalendarEvent): Promise<string> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      })
      
      return response.data.id
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw new Error('カレンダーイベントの作成に失敗しました')
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    try {
      await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event
      })
    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw new Error('カレンダーイベントの更新に失敗しました')
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      })
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      throw new Error('カレンダーイベントの削除に失敗しました')
    }
  }
}

export function createAssignmentEvent(
  title: string,
  courseName: string,
  deadline: string,
  category?: string
): CalendarEvent {
  const deadlineDate = new Date(deadline)
  const eventTitle = `【課題】${title}`
  const eventDescription = `科目: ${courseName}${category ? `\n種別: ${category}` : ''}\n締切: ${deadlineDate.toLocaleString('ja-JP')}`

  // 締切の15分前に終了するイベントとして作成
  const endTime = new Date(deadlineDate.getTime())
  const startTime = new Date(deadlineDate.getTime() - 15 * 60 * 1000)

  return {
    summary: eventTitle,
    description: eventDescription,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Asia/Tokyo'
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Asia/Tokyo'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 * 24 }, // 24時間前
        { method: 'popup', minutes: 180 }, // 3時間前
        { method: 'popup', minutes: 15 } // 15分前
      ]
    }
  }
}

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar'
]

export const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!
}