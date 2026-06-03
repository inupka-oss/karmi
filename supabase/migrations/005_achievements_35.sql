-- =====================================================
-- Достижения пользователей (35+)
-- =====================================================

-- Таблица для хранения достижений пользователей
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- RLS политики
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Все могут читать достижения (для публичных профилей)
CREATE POLICY "user_achievements_select_all" 
ON user_achievements FOR SELECT 
TO anon, authenticated 
USING (true);

-- Система может создавать достижения
CREATE POLICY "user_achievements_insert_system" 
ON user_achievements FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Обновление только своих
CREATE POLICY "user_achievements_update_own" 
ON user_achievements FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Удаление только своих
CREATE POLICY "user_achievements_delete_own" 
ON user_achievements FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- View для публичного просмотра достижений (для профилей других пользователей)
CREATE OR REPLACE VIEW user_achievements_public AS
SELECT 
  ua.user_id,
  ua.achievement_id,
  ua.unlocked_at
FROM user_achievements ua;

-- Для views RLS настраивается через базовую таблицу
-- View наследует политики от user_achievements

-- =====================================================
-- Триггеры для авто-разблокировки достижений
-- =====================================================

-- Функция для проверки и разблокировки достижений
CREATE OR REPLACE FUNCTION check_and_unlock_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_stats JSONB;
  v_achievement_count INT;
BEGIN
  -- Определяем user_id из новой записи
  IF TG_TABLE_NAME = 'user_profiles' THEN
    v_user_id := (SELECT id FROM auth.users WHERE email = NEW.user_identifier::text);
    v_stats := NEW.stats;
  END IF;
  
  IF v_user_id IS NULL OR v_stats IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Проверяем различные достижения
  -- Аниме
  IF (v_stats->>'animeWatched')::INT >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, 'first_anime') ON CONFLICT DO NOTHING;
  END IF;
  IF (v_stats->>'animeWatched')::INT >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, '10_anime') ON CONFLICT DO NOTHING;
  END IF;
  IF (v_stats->>'animeWatched')::INT >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, '50_anime') ON CONFLICT DO NOTHING;
  END IF;
  IF (v_stats->>'animeWatched')::INT >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, '100_anime') ON CONFLICT DO NOTHING;
  END IF;
  
  -- Эпизоды
  IF (v_stats->>'episodesWatched')::INT >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, '10_episodes') ON CONFLICT DO NOTHING;
  END IF;
  IF (v_stats->>'episodesWatched')::INT >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, '100_episodes') ON CONFLICT DO NOTHING;
  END IF;
  
  -- Комментарии
  IF (v_stats->>'commentsPosted')::INT >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, 'first_comment') ON CONFLICT DO NOTHING;
  END IF;
  IF (v_stats->>'commentsPosted')::INT >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, '10_comments') ON CONFLICT DO NOTHING;
  END IF;
  
  -- Избранное
  IF (v_stats->>'favoritesCount')::INT >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, '10_favorites') ON CONFLICT DO NOTHING;
  END IF;
  IF (v_stats->>'favoritesCount')::INT >= 25 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, '25_favorites') ON CONFLICT DO NOTHING;
  END IF;
  
  -- Уровень
  IF (v_stats->>'level')::INT >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, 'level_10') ON CONFLICT DO NOTHING;
  END IF;
  IF (v_stats->>'level')::INT >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, 'level_50') ON CONFLICT DO NOTHING;
  END IF;
  
  -- Подсчитываем количество разблокированных достижений
  SELECT COUNT(*) INTO v_achievement_count 
  FROM user_achievements 
  WHERE user_id = v_user_id;
  
  IF v_achievement_count >= 25 THEN
    INSERT INTO user_achievements (user_id, achievement_id) 
    VALUES (v_user_id, 'completionist') ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на обновление профиля
DROP TRIGGER IF EXISTS trg_check_achievements ON user_profiles;
CREATE TRIGGER trg_check_achievements
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_and_unlock_achievements();

-- =====================================================
-- Миграция завершена!
-- =====================================================
