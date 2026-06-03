-- =====================================================
-- Karmi Improvements - Database Migrations
-- =====================================================
-- Этот файл нужно выполнить в Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Обновление таблицы комментариев
-- =====================================================

-- Добавляем поля для древовидной структуры и реакций
ALTER TABLE comments 
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dislikes INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reports_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Индекс для быстрых ответов
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_anime_parent ON comments(anime_id, parent_id);

-- =====================================================
-- 2. Таблица реакций на комментарии
-- =====================================================

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);

-- =====================================================
-- 3. Обновление таблицы user_profiles
-- =====================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"animeWatched":0,"episodesWatched":0,"hoursWatched":0,"commentsPosted":0,"reviewsWritten":0,"favoritesCount":0,"daysVisited":0,"level":1,"xp":0,"xpToNextLevel":100}',
  ADD COLUMN IF NOT EXISTS achievements TEXT[],
  ADD COLUMN IF NOT EXISTS badges TEXT[],
  ADD COLUMN IF NOT EXISTS avatar TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS progress JSONB,
  ADD COLUMN IF NOT EXISTS favorites TEXT[];

CREATE INDEX IF NOT EXISTS idx_user_profiles_stats_level ON user_profiles((stats->>'level'));
CREATE INDEX IF NOT EXISTS idx_user_profiles_stats_xp ON user_profiles((stats->>'xp'));

-- =====================================================
-- 4. Таблица достижений пользователей
-- =====================================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- =====================================================
-- 5. Таблица челленджей пользователей
-- =====================================================

CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  progress INT DEFAULT 0,
  target INT NOT NULL,
  reward INT NOT NULL,
  type TEXT CHECK (type IN ('daily', 'weekly', 'seasonal')),
  completed BOOLEAN DEFAULT FALSE,
  reset_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, reset_at)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_type ON user_challenges(type);

-- =====================================================
-- 6. Таблица коллекционных карточек
-- =====================================================

CREATE TABLE IF NOT EXISTS collection_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  obtained_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_cards_user ON collection_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_cards_anime ON collection_cards(anime_id);
CREATE INDEX IF NOT EXISTS idx_collection_cards_rarity ON collection_cards(rarity);

-- =====================================================
-- 7. Таблица жалоб на комментарии
-- =====================================================

CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);

-- =====================================================
-- 8. Таблица активности пользователей (для статистики)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at);

-- =====================================================
-- 9. Таблица для Watch Party (комнаты)
-- =====================================================

CREATE TABLE IF NOT EXISTS watch_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES auth.users(id),
  episode_id UUID REFERENCES episodes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_watch_parties_room ON watch_parties(room_id);

-- =====================================================
-- 10. Триггеры для автоматического обновления статистики
-- =====================================================

-- Функция для обновления статистики при просмотре аниме
CREATE OR REPLACE FUNCTION update_user_stats_on_watch()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles 
  SET stats = jsonb_set(
    COALESCE(stats, '{"animeWatched":0,"episodesWatched":0,"hoursWatched":0,"level":1,"xp":0,"xpToNextLevel":100}'),
    '{episodesWatched}',
    to_jsonb(COALESCE((stats->>'episodesWatched')::int, 0) + 1)
  ),
  last_active = NOW()
  WHERE user_identifier = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на добавление эпизода в прогресс
DROP TRIGGER IF EXISTS trg_update_stats_on_watch ON user_profiles;
CREATE TRIGGER trg_update_stats_on_watch
  AFTER UPDATE OF progress ON user_profiles
  FOR EACH ROW
  WHEN (NEW.progress IS DISTINCT FROM OLD.progress)
  EXECUTE FUNCTION update_user_stats_on_watch();

-- =====================================================
-- 11. Триггер для обновления last_active
-- =====================================================

CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_last_active ON user_profiles;
CREATE TRIGGER trg_update_last_active
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- =====================================================
-- 12. Триггер для подсчёта комментариев
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_stats_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles 
    SET stats = jsonb_set(
      COALESCE(stats, '{"commentsPosted":0}'),
      '{commentsPosted}',
      to_jsonb(COALESCE((stats->>'commentsPosted')::int, 0) + 1)
    ),
    last_active = NOW()
    WHERE user_id = NEW.user_id OR user_identifier = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_stats_on_comment ON comments;
CREATE TRIGGER trg_update_stats_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION update_user_stats_on_comment();

-- =====================================================
-- 13. Функция для проверки и выдачи достижений
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_stats JSONB;
  v_achievement TEXT;
BEGIN
  -- Получаем статистику пользователя
  SELECT stats INTO v_stats FROM user_profiles 
  WHERE user_id = p_user_id OR user_identifier = p_user_id;
  
  IF v_stats IS NULL THEN
    RETURN;
  END IF;
  
  -- Достижение: Первое аниме
  IF (v_stats->>'animeWatched')::int >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'first_anime')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Достижение: 10 аниме
  IF (v_stats->>'animeWatched')::int >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, '10_anime')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Достижение: 50 аниме
  IF (v_stats->>'animeWatched')::int >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, '50_anime')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Достижение: 100 аниме
  IF (v_stats->>'animeWatched')::int >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, '100_anime')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Достижение: Первый комментарий
  IF (v_stats->>'commentsPosted')::int >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'first_comment')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Достижение: 10 комментариев
  IF (v_stats->>'commentsPosted')::int >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, '10_comments')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Достижение: Коллекционер (20 в избранном)
  IF jsonb_array_length(COALESCE((SELECT favorites FROM user_profiles WHERE user_id = p_user_id), '[]'::text[])) >= 20 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'collector')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 14. RLS (Row Level Security) Policies
-- =====================================================

-- Включаем RLS для новых таблиц
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;

-- Policies для comment_reactions
CREATE POLICY "Users can view all reactions"
  ON comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own reactions"
  ON comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions"
  ON comment_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Policies для user_achievements
CREATE POLICY "Users can view all achievements"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- Policies для user_challenges
CREATE POLICY "Users can view own challenges"
  ON user_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can update challenges"
  ON user_challenges FOR ALL
  USING (true);

-- Policies для collection_cards
CREATE POLICY "Users can view own cards"
  ON collection_cards FOR SELECT
  USING (auth.uid() = user_id OR true); -- Публичный просмотр

CREATE POLICY "System can insert cards"
  ON collection_cards FOR INSERT
  WITH CHECK (true);

-- Policies для comment_reports
CREATE POLICY "Users can view own reports"
  ON comment_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
  ON comment_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update reports"
  ON comment_reports FOR UPDATE
  USING (true);

-- Policies для watch_parties
CREATE POLICY "Anyone can view active parties"
  ON watch_parties FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create parties"
  ON watch_parties FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- =====================================================
-- 15. Начальные данные для челленджей
-- =====================================================

-- Вставляем дефолтные челленджи (можно хранить в отдельной таблице или в коде)
-- Для примера создадим view с доступными челленджами
CREATE OR REPLACE VIEW available_challenges AS
SELECT 'daily_watch' AS challenge_id, 'Ежедневный просмотр' AS name, 'Посмотреть 3 серии сегодня' AS description, 3 AS target, 50 AS reward, 'daily' AS type
UNION ALL
SELECT 'daily_comment', 'Активный зритель', 'Оставить 2 комментария', 2, 30, 'daily'
UNION ALL
SELECT 'weekly_anime', 'Исследователь', 'Начать смотреть 2 новых аниме', 2, 200, 'weekly'
UNION ALL
SELECT 'weekly_rating', 'Критик', 'Оценить 5 аниме', 5, 100, 'weekly'
UNION ALL
SELECT 'seasonal_ongoing', 'В тренде', 'Смотреть 5 онгоингов сезона', 5, 500, 'seasonal';

-- =====================================================
-- 16. Функция для сброса ежедневных челленджей
-- =====================================================

CREATE OR REPLACE FUNCTION reset_daily_challenges()
RETURNS VOID AS $$
BEGIN
  -- Сбрасываем прогресс ежедневных челленджей
  UPDATE user_challenges
  SET progress = 0,
      completed = FALSE,
      reset_at = NOW()
  WHERE type = 'daily'
    AND (reset_at IS NULL OR reset_at < NOW() - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 17. Функция для сброса еженедельных челленджей
-- =====================================================

CREATE OR REPLACE FUNCTION reset_weekly_challenges()
RETURNS VOID AS $$
BEGIN
  UPDATE user_challenges
  SET progress = 0,
      completed = FALSE,
      reset_at = NOW()
  WHERE type = 'weekly'
    AND (reset_at IS NULL OR reset_at < NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 18. Индексы для производительности
-- =====================================================

-- Дополнительные индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_anime_rating ON anime(rating DESC);
CREATE INDEX IF NOT EXISTS idx_anime_views ON anime(views DESC);
CREATE INDEX IF NOT EXISTS idx_anime_created ON anime(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anime_status ON anime(status);
CREATE INDEX IF NOT EXISTS idx_episodes_anime ON episodes(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_genres_anime ON anime_genres(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_genres_genre ON anime_genres(genre_id);

-- =====================================================
-- 19. View для статистики админа
-- =====================================================

CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM anime) AS total_anime,
  (SELECT COUNT(*) FROM episodes) AS total_episodes,
  (SELECT COUNT(*) FROM user_profiles) AS total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE last_active > NOW() - INTERVAL '7 days') AS active_users,
  (SELECT COALESCE(SUM(views), 0) FROM anime) AS total_views,
  (SELECT COUNT(*) FROM comments) AS total_comments,
  (SELECT COUNT(*) FROM comments WHERE is_deleted = true) AS deleted_comments,
  (SELECT COUNT(*) FROM comment_reports WHERE resolved = false) AS pending_reports;

-- =====================================================
-- 20. Гранты для сервисной роли (опционально)
-- =====================================================

-- Если нужно дать доступ сервисной роли
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- Миграция завершена!
-- =====================================================
