-- =====================================================
-- Karmi - Друзья и исправления (ВЕРСИЯ 3 - С DROP VIEW)
-- =====================================================

-- =====================================================
-- 1. Сначала удаляем старые VIEW
-- =====================================================

DROP VIEW IF EXISTS user_friends_full CASCADE;
DROP VIEW IF EXISTS user_friends_with_profiles CASCADE;
DROP VIEW IF EXISTS user_friends_stats CASCADE;

-- =====================================================
-- 2. Таблица друзей (если нет)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_user_friends_user ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);

-- Включаем RLS
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Users can view own friends" ON user_friends;
DROP POLICY IF EXISTS "Users can send friend requests" ON user_friends;
DROP POLICY IF EXISTS "Users can update friend status" ON user_friends;
DROP POLICY IF EXISTS "Users can delete friend requests" ON user_friends;

-- Создаём политики заново
CREATE POLICY "Users can view own friends"
  ON user_friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON user_friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend status"
  ON user_friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete friend requests"
  ON user_friends FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. View для друзей с никами (ПЕРЕСОЗДАЁМ)
-- =====================================================

CREATE VIEW user_friends_with_profiles AS
SELECT 
  uf.id,
  uf.user_id,
  uf.friend_id,
  uf.status,
  uf.created_at,
  up.nickname as friend_nickname,
  up.avatar as friend_avatar,
  up.stats as friend_stats
FROM user_friends uf
LEFT JOIN user_profiles up ON up.user_identifier = uf.friend_id::text;

CREATE VIEW user_friends_full AS
SELECT 
  uf.id,
  uf.user_id,
  uf.friend_id,
  uf.status,
  uf.created_at,
  up_from.nickname as user_nickname,
  up_from.avatar as user_avatar,
  up_friend.nickname as friend_nickname,
  up_friend.avatar as friend_avatar,
  up_friend.stats as friend_stats
FROM user_friends uf
LEFT JOIN user_profiles up_from ON up_from.user_identifier = uf.user_id::text
LEFT JOIN user_profiles up_friend ON up_friend.user_identifier = uf.friend_id::text;

-- =====================================================
-- 4. Таблица comments (если нет)
-- =====================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_avatar TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  reports_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_anime ON comments(anime_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- Включаем RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Создаём политики
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. Триггер для updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. Таблица notifications (если нет)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Включаем RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Создаём политики
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. Функции (пересоздаём)
-- =====================================================

-- Функция для приглашения в Watch Party
CREATE OR REPLACE FUNCTION send_watch_party_invite(
  p_user_id UUID,
  p_friend_id UUID,
  p_room_id TEXT,
  p_anime_title TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    p_friend_id,
    'watch_party_invite',
    'Приглашение на совместный просмотр',
    'Приглашает вас посмотреть "' || p_anime_title || '"',
    jsonb_build_object(
      'room_id', p_room_id,
      'invited_by', p_user_id
    )
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для принятия заявки в друзья
CREATE OR REPLACE FUNCTION accept_friend_request(p_request_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_friends
  SET status = 'accepted'
  WHERE id = p_request_id AND friend_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для отправки заявки в друзья
CREATE OR REPLACE FUNCTION send_friend_request(p_friend_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_friend_id UUID;
  v_request_id UUID;
BEGIN
  -- Получаем ID друга по email
  SELECT id INTO v_friend_id FROM auth.users WHERE email = p_friend_email LIMIT 1;
  
  IF v_friend_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь не найден';
  END IF;
  
  -- Создаём заявку
  INSERT INTO user_friends (user_id, friend_id, status)
  VALUES (auth.uid(), v_friend_id, 'pending')
  RETURNING id INTO v_request_id;
  
  -- Отправляем уведомление
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_friend_id,
    'friend_request',
    'Новая заявка в друзья',
    'Пользователь хочет добавить вас в друзья',
    jsonb_build_object('request_id', v_request_id)
  );
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. View для статистики друзей
-- =====================================================

CREATE VIEW user_friends_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE status = 'accepted') as friends_count,
  COUNT(*) FILTER (WHERE status = 'pending' AND user_id = auth.uid()) as pending_sent,
  COUNT(*) FILTER (WHERE status = 'pending' AND friend_id = auth.uid()) as pending_received
FROM user_friends
GROUP BY user_id;

-- =====================================================
-- Миграция завершена!
-- =====================================================
