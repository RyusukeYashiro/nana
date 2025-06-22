import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { GOOGLE_OAUTH_CONFIG, GOOGLE_CALENDAR_SCOPES } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_OAUTH_CONFIG.clientId,
      GOOGLE_OAUTH_CONFIG.clientSecret,
      GOOGLE_OAUTH_CONFIG.redirectUri
    )

    // 認可URLを生成
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_CALENDAR_SCOPES,
      prompt: 'consent'
    })

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json(
      { error: '認証URLの生成に失敗しました' },
      { status: 500 }
    )
  }
}