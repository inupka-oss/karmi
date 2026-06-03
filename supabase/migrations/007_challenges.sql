-- =====================================================
-- Челленджи пользователей (30)
-- =====================================================

-- Таблица для хранения прогресса челленджей
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(completed);

-- RLS политики
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

-- Все могут читать свои челленджи
CREATE POLICY "user_challenges_select_own" 
ON user_challenges FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Все могут читать челленджи других (для профилей)
CREATE POLICY "user_challenges_select_all" 
ON user_challenges FOR SELECT 
TO anon, authenticated 
USING (true);

-- Система может создавать/обновлять
CREATE POLICY "user_challenges_insert_system" 
ON user_challenges FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Обновление только своих
CREATE POLICY "user_challenges_update_own" 
ON user_challenges FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Удаление только своих
CREATE POLICY "user_challenges_delete_own" 
ON user_challenges FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- =====================================================
-- Триггеры для авто-обновления прогресса
-- =====================================================

-- Функция для обновления челленджей
CREATE OR REPLACE FUNCTION update_user_challenges()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_stats JSONB;
BEGIN
  -- Получаем user_id и статистику
  IF TG_TABLE_NAME = 'user_profiles' THEN
    v_user_id := (SELECT id FROM auth.users WHERE email = NEW.user_identifier::text);
    v_stats := NEW.stats;
  END IF;
  
  IF v_user_id IS NULL OR v_stats IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Ежедневные
  IF (v_stats->>'daysVisited')::INT >= 1 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'daily_login', 1, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 1, completed = true;
  END IF;
  
  IF (v_stats->>'episodesWatched')::INT >= 3 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'daily_3ep', LEAST((v_stats->>'episodesWatched')::INT, 3), true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = LEAST((v_stats->>'episodesWatched')::INT, 3), completed = true;
  END IF;
  
  IF (v_stats->>'commentsPosted')::INT >= 1 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'daily_comment', 1, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 1, completed = true;
  END IF;
  
  -- Еженедельные
  IF (v_stats->>'daysVisited')::INT >= 7 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'weekly_7days', 7, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 7, completed = true;
  END IF;
  
  IF (v_stats->>'episodesWatched')::INT >= 10 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'weekly_10ep', 10, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 10, completed = true;
  END IF;
  
  IF (v_stats->>'commentsPosted')::INT >= 10 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'weekly_5comments', 10, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 10, completed = true;
  END IF;
  
  IF (v_stats->>'reviewsWritten')::INT >= 1 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'weekly_review', 1, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 1, completed = true;
  END IF;
  
  -- Аниме
  IF (v_stats->>'animeWatched')::INT >= 1 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'anime_first', 1, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 1, completed = true;
  END IF;
  
  IF (v_stats->>'animeWatched')::INT >= 5 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'anime_5series', 5, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 5, completed = true;
  END IF;
  
  IF (v_stats->>'episodesWatched')::INT >= 10 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'anime_marathon', 10, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 10, completed = true;
  END IF;
  
  -- Социальные
  IF (v_stats->>'favoritesCount')::INT >= 1 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'social_friend', 1, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 1, completed = true;
  END IF;
  
  IF (v_stats->>'favoritesCount')::INT >= 5 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'social_5friends', 5, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 5, completed = true;
  END IF;
  
  IF (v_stats->>'commentsPosted')::INT >= 20 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'social_comment10', 20, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 20, completed = true;
  END IF;
  
  -- Особые
  IF (v_stats->>'level')::INT >= 10 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'special_level10', 1, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 1, completed = true;
  END IF;
  
  IF (v_stats->>'level')::INT >= 50 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'special_level50', 1, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 1, completed = true;
  END IF;
  
  IF (v_stats->>'daysVisited')::INT >= 30 THEN
    INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
    VALUES (v_user_id, 'special_streak30', 30, true) 
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET progress = 30, completed = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на обновление профиля
DROP TRIGGER IF EXISTS trg_update_challenges ON user_profiles;
CREATE TRIGGER trg_update_challenges
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_challenges();

-- =====================================================
-- Миграция завершена!
-- =====================================================
