-- =====================================================
-- Добавляем аватарки в комментарии
-- =====================================================

-- Создаём view для комментариев с аватарками
CREATE OR REPLACE VIEW comments_with_avatars AS
SELECT 
  c.*,
  up.avatar as user_avatar
FROM comments c
LEFT JOIN user_profiles up ON up.user_identifier = c.user_id::text;

-- RLS политики
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "comments_select_all" ON comments;
DROP POLICY IF EXISTS "comments_insert_all" ON comments;
DROP POLICY IF EXISTS "comments_update_admin_or_own" ON comments;
DROP POLICY IF EXISTS "comments_delete_admin_or_own" ON comments;

-- Создаём политики
CREATE POLICY "comments_select_all" 
ON comments FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "comments_insert_all" 
ON comments FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "comments_update_admin_or_own" 
ON comments FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = 'admin@karmi.ru');

CREATE POLICY "comments_delete_admin_or_own" 
ON comments FOR DELETE 
TO authenticated 
USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = 'admin@karmi.ru');

-- =====================================================
-- Миграция завершена!
-- =====================================================
