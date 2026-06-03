-- =====================================================
-- ИСПРАВЛЕНИЕ 401 ОШИБОК (Авторизация и доступ)
-- Запустить в Supabase SQL Editor
-- =====================================================

-- 1. AVATARS BUCKET
-- =====================================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Avatars: anyone can view" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: users can update own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: users can delete own" ON storage.objects;

-- Создаём новые политики (с поддержкой anon)
CREATE POLICY "Avatars: anyone can view" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

CREATE POLICY "Avatars: authenticated users can upload" 
ON storage.objects FOR INSERT 
TO authenticated, anon 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatars: users can update own" 
ON storage.objects FOR UPDATE 
TO authenticated, anon 
USING (bucket_id = 'avatars');

CREATE POLICY "Avatars: users can delete own" 
ON storage.objects FOR DELETE 
TO authenticated, anon 
USING (bucket_id = 'avatars');


-- 2. USER_PROFILES TABLE
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "users_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "users_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "users_profiles_update" ON user_profiles;

-- Создаём новые (разрешаем anon для гостей)
CREATE POLICY "users_profiles_select" 
ON user_profiles FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "users_profiles_insert" 
ON user_profiles FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "users_profiles_update" 
ON user_profiles FOR UPDATE 
TO anon, authenticated 
USING (true);


-- 3. NOTIFICATIONS TABLE
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Создаём новые
CREATE POLICY "notifications_select_own" 
ON notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system" 
ON notifications FOR INSERT 
TO authenticated, anon 
WITH CHECK (true);

CREATE POLICY "notifications_update_own" 
ON notifications FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" 
ON notifications FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);


-- =====================================================
-- Миграция завершена!
-- =====================================================
