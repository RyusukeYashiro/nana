# Nana - 大学課題通知システム

大学生のための課題管理・通知システムです。課題の締切を忘れることなく、効率的に学業を管理できます。

## 機能

### 🎯 課題管理
- テキストの貼り付けで課題情報を自動抽出
- 締切日、科目、課題種別の管理
- 課題一覧の表示と絞り込み

### 📅 Googleカレンダー連携
- 課題登録時に自動でカレンダーイベント作成
- 締切前の通知設定（24時間前、3時間前、15分前）

### 📺 授業視聴管理
- オンライン授業の視聴状況記録
- 進捗率の可視化
- 科目別の視聴管理

### 🔐 認証機能
- Supabase Auth による安全な認証
- メール/パスワードログイン
- Google OAuth ログイン

## 技術スタック

- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + Edge Functions + Auth)
- **認証**: Supabase Auth
- **外部API**: Google Calendar API
- **デプロイ**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` を `.env.local` にコピーして、以下の値を設定してください：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

### 3. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. `supabase/schema.sql` のSQLスクリプトをSupabase SQLエディタで実行
3. Supabase設定画面でGoogle OAuthプロバイダーを有効化

### 4. Google Cloud Consoleの設定

1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクトを作成
2. Google Calendar APIを有効化
3. OAuth 2.0認証情報を作成
4. 承認済みリダイレクトURIに以下を追加：
   - `http://localhost:3000/api/google-calendar/callback` （開発環境）
   - `https://your-domain.vercel.app/api/google-calendar/callback` （本番環境）

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## データベーススキーマ

### テーブル構成

- **courses**: 授業情報
- **assignments**: 課題情報
- **lectures**: 講義情報
- **lecture_views**: 授業視聴記録
- **user_tokens**: OAuth トークン保存

### 主要な関係

```
users (Supabase Auth)
  └── courses
      ├── assignments
      └── lectures
              └── lecture_views
```

## Vercelデプロイ

### 1. Vercelプロジェクトの作成

```bash
vercel
```

### 2. 環境変数の設定

Vercel ダッシュボードで以下の環境変数を設定：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### 3. Google OAuthリダイレクトURIの更新

Google Cloud Consoleで本番環境のリダイレクトURIを追加してください。

## 主要なページ

- `/` - ランディングページ
- `/auth/login` - ログインページ
- `/auth/signup` - サインアップページ
- `/dashboard` - メインダッシュボード
- `/assignments/new` - 課題追加ページ
- `/lectures` - 授業視聴管理ページ

## API エンドポイント

- `/api/google-calendar/auth` - Google認証URL取得
- `/api/google-calendar/callback` - Google認証コールバック
- `/api/google-calendar/create-event` - カレンダーイベント作成

## ライセンス

MIT License

## 開発者

本プロジェクトは大学生の学業効率化を目的として開発されました。
