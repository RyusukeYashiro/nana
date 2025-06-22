-- 授業テーブル
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 課題テーブル
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_event_id TEXT, -- Googleカレンダーイベント ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 講義テーブル
CREATE TABLE lectures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 授業視聴記録テーブル
CREATE TABLE lecture_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lecture_id)
);

-- ユーザートークンテーブル（OAuth トークン保存用）
CREATE TABLE user_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google_calendar' など
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- RLS（Row Level Security）を有効化
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- RLSポリシー設定
-- courses
CREATE POLICY "Users can view their own courses" ON courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own courses" ON courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own courses" ON courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own courses" ON courses FOR DELETE USING (auth.uid() = user_id);

-- assignments
CREATE POLICY "Users can view assignments of their courses" ON assignments FOR SELECT USING (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert assignments to their courses" ON assignments FOR INSERT WITH CHECK (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update assignments of their courses" ON assignments FOR UPDATE USING (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete assignments of their courses" ON assignments FOR DELETE USING (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
);

-- lectures
CREATE POLICY "Users can view lectures of their courses" ON lectures FOR SELECT USING (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert lectures to their courses" ON lectures FOR INSERT WITH CHECK (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update lectures of their courses" ON lectures FOR UPDATE USING (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete lectures of their courses" ON lectures FOR DELETE USING (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
);

-- lecture_views
CREATE POLICY "Users can view their own lecture views" ON lecture_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own lecture views" ON lecture_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lecture views" ON lecture_views FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lecture views" ON lecture_views FOR DELETE USING (auth.uid() = user_id);

-- user_tokens
CREATE POLICY "Users can view their own tokens" ON user_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tokens" ON user_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tokens" ON user_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tokens" ON user_tokens FOR DELETE USING (auth.uid() = user_id);