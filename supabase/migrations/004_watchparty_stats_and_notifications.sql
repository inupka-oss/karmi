-- =====================================================
-- Watch Party Statistics
-- =====================================================

-- Таблица для отслеживания кто смотрел
CREATE TABLE IF NOT EXISTS watch_party_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_nickname TEXT NOT NULL,
  user_avatar TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  watch_duration_seconds INT DEFAULT 0,
  anime_title TEXT,
  anime_id UUID
);

CREATE INDEX IF NOT EXISTS idx_watch_party_stats_room ON watch_party_stats(room_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_stats_user ON watch_party_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_stats_joined ON watch_party_stats(joined_at DESC);

-- RLS политики
ALTER TABLE watch_party_stats ENABLE ROW LEVEL SECURITY;

-- Все могут читать
CREATE POLICY "watch_party_stats_select_all" 
ON watch_party_stats FOR SELECT 
TO anon, authenticated 
USING (true);

-- Авторизованные могут создавать (запись при входе)
CREATE POLICY "watch_party_stats_insert_authenticated" 
ON watch_party_stats FOR INSERT 
TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

-- Обновление только своей записи (при выходе)
CREATE POLICY "watch_party_stats_update_own" 
ON watch_party_stats FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- =====================================================
-- Уведомления об ответах в комментариях
-- =====================================================

-- Добавляем тип уведомления 'comment_reply'
-- (таблица notifications уже существует)

-- Триггер для создания уведомления при ответе
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_comment RECORD;
  v_parent_author_id UUID;
BEGIN
  -- Получаем родительский комментарий
  SELECT * INTO v_parent_comment FROM comments WHERE id = NEW.parent_id;
  
  IF v_parent_comment IS NOT NULL THEN
    v_parent_author_id := v_parent_comment.user_id;
    
    -- Не создаём уведомление если отвечаешь сам себе
    IF v_parent_author_id IS NOT NULL AND v_parent_author_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        v_parent_author_id,
        'comment_reply',
        'Ответ на ваш комментарий',
        'Пользователь ' || NEW.user_name || ' ответил на ваш комментарий',
        jsonb_build_object(
          'comment_id', NEW.id,
          'anime_id', NEW.anime_id,
          'reply_content', NEW.content,
          'replier_name', NEW.user_name
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаём триггер
DROP TRIGGER IF EXISTS trg_comment_reply_notification ON comments;
CREATE TRIGGER trg_comment_reply_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION notify_comment_reply();

-- =====================================================
-- Миграция завершена!
-- =====================================================
