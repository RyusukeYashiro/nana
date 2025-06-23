-- 授業テーブル
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  professor TEXT, -- 担当教授
  semester TEXT, -- 学期情報（例：2025年前期）
  credits INTEGER DEFAULT 1, -- 単位数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 課題テーブル
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('レポート', '小テスト', '課題', '発表', 'テスト', '試験')),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT, -- 課題の詳細説明
  status TEXT DEFAULT '未完了' CHECK (status IN ('未完了', '進行中', '完了')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 優先度（1:低 〜 5:高）
  calendar_event_id TEXT, -- Googleカレンダーイベント ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- インデックス作成（パフォーマンス向上）
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_deadline ON assignments(deadline);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_lectures_course_id ON lectures(course_id);
CREATE INDEX idx_lectures_date ON lectures(date);
CREATE INDEX idx_lecture_views_user_id ON lecture_views(user_id);
CREATE INDEX idx_lecture_views_lecture_id ON lecture_views(lecture_id);
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);

-- updated_at自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();