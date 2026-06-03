-- =====================================================
-- Username для пользователей
-- =====================================================

-- Добавляем поле username в user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Создаём уникальный индекс
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username 
ON user_profiles(username) 
WHERE username IS NOT NULL;

-- RLS политики остаются теми же

-- Функция для проверки доступности username
CREATE OR REPLACE FUNCTION check_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count 
  FROM user_profiles 
  WHERE LOWER(username) = LOWER(p_username);
  
  RETURN v_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для поиска пользователя по username
CREATE OR REPLACE FUNCTION find_user_by_username(p_username TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  nickname TEXT,
  avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    up.username,
    COALESCE(up.nickname, SPLIT_PART(au.email, '@', 1)) as nickname,
    up.avatar
  FROM auth.users au
  LEFT JOIN user_profiles up ON up.user_identifier = au.email::text
  WHERE LOWER(up.username) = LOWER(p_username)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для отправки заявки в друзья по username
CREATE OR REPLACE FUNCTION send_friend_request_by_username(p_username TEXT)
RETURNS UUID AS $$
DECLARE
  v_friend_id UUID;
  v_friend_email TEXT;
  v_request_id UUID;
BEGIN
  -- Получаем email друга по username
  SELECT email INTO v_friend_email 
  FROM auth.users au
  JOIN user_profiles up ON up.user_identifier = au.email::text
  WHERE LOWER(up.username) = LOWER(p_username)
  LIMIT 1;
  
  IF v_friend_email IS NULL THEN
    RAISE EXCEPTION 'Пользователь с таким username не найден' USING ERRCODE = 'FND404';
  END IF;
  
  -- Получаем ID друга
  SELECT id INTO v_friend_id FROM auth.users WHERE email = v_friend_email LIMIT 1;
  
  IF v_friend_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь не найден';
  END IF;
  
  -- Проверяем, не добавлен ли уже в друзья
  IF EXISTS (
    SELECT 1 FROM user_friends 
    WHERE (user_id = auth.uid() AND friend_id = v_friend_id AND status = 'accepted')
       OR (user_id = v_friend_id AND friend_id = auth.uid() AND status = 'accepted')
  ) THEN
    RAISE EXCEPTION 'Этот пользователь уже в ваших друзьях' USING ERRCODE = 'FRD409';
  END IF;
  
  -- Проверяем, нет ли уже заявки
  IF EXISTS (
    SELECT 1 FROM user_friends 
    WHERE (user_id = auth.uid() AND friend_id = v_friend_id)
       OR (user_id = v_friend_id AND friend_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Заявка уже отправлена или получена' USING ERRCODE = 'FRD409';
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
-- Миграция завершена!
-- =====================================================
