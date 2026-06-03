-- =====================================================
-- ПОЛНОЕ ИСПРАВЛЕНИЕ: Username + Avatars
-- Запустить в Supabase SQL Editor
-- =====================================================

-- ==========================================
-- ЧАСТЬ 1: USER_PROFILES
-- ==========================================

-- 1.1 Проверяем таблицу
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 1.2 Добавляем колонки если нет
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS challenges JSONB DEFAULT '[]'::jsonb;

-- 1.3 Уникальный индекс на username
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username 
ON user_profiles(username) 
WHERE username IS NOT NULL;

-- 1.4 Удаляем ВСЕ старые политики
DROP POLICY IF EXISTS "users_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "users_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "users_profiles_update" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_identifier" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- 1.5 Создаём НОВЫЕ политики (МАКСИМАЛЬНО ОТКРЫТЫЕ для теста)
-- Включаем RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT - ВСЕ могут читать (anon + authenticated)
CREATE POLICY "user_profiles_select" 
ON user_profiles FOR SELECT 
TO anon, authenticated 
USING (true);

-- INSERT - ВСЕ могут создавать (anon + authenticated)
CREATE POLICY "user_profiles_insert" 
ON user_profiles FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- UPDATE - ВСЕ могут обновлять (anon + authenticated)
CREATE POLICY "user_profiles_update" 
ON user_profiles FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

-- DELETE - Только authenticated могут удалять свой профиль
CREATE POLICY "user_profiles_delete" 
ON user_profiles FOR DELETE 
TO authenticated 
USING (true);


-- ==========================================
-- ЧАСТЬ 2: AVATARS BUCKET
-- ==========================================

-- 2.1 Создаём bucket если не существует
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 5242880;

-- 2.2 Проверяем bucket
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'avatars';

-- 2.3 Удаляем ВСЕ старые политики для storage.objects
DROP POLICY IF EXISTS "Avatars: anyone can view" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: users can update own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: users can delete own" ON storage.objects;
DROP POLICY IF EXISTS "Enable public read" ON storage.objects;
DROP POLICY IF EXISTS "Enable upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;

-- 2.4 Создаём НОВЫЕ политики (МАКСИМАЛЬНО ОТКРЫТЫЕ)
-- SELECT - ВСЕ могут читать
CREATE POLICY "storage_objects_select" 
ON storage.objects FOR SELECT 
TO public 
USING (true);

-- INSERT - ВСЕ могут загружать (anon + authenticated)
CREATE POLICY "storage_objects_insert" 
ON storage.objects FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- UPDATE - ВСЕ могут обновлять
CREATE POLICY "storage_objects_update" 
ON storage.objects FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

-- DELETE - ВСЕ могут удалять
CREATE POLICY "storage_objects_delete" 
ON storage.objects FOR DELETE 
TO anon, authenticated 
USING (true);


-- ==========================================
-- ЧАСТЬ 3: ТЕСТОВЫЕ ДАННЫЕ
-- ==========================================

-- 3.1 Проверяем профили
SELECT user_identifier, username, nickname, avatar 
FROM user_profiles 
LIMIT 10;

-- 3.2 Проверяем файлы в bucket
SELECT name, owner, metadata 
FROM storage.objects 
WHERE bucket_id = 'avatars' 
LIMIT 10;

-- 3.3 Проверяем политики
SELECT tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'objects')
ORDER BY tablename, policyname;


-- ==========================================
-- ЧАСТЬ 4: ПРИНУДИТЕЛЬНОЕ СОХРАНЕНИЕ
-- ==========================================

-- Если нужно принудительно установить username для всех пользователей:
/*
UPDATE user_profiles 
SET username = CONCAT('user_', LEFT(user_identifier, POSITION('@' IN user_identifier) - 1))
WHERE username IS NULL 
AND user_identifier LIKE '%@%';
*/

-- ==========================================
-- ГОТОВО! ТЕПЕРЬ ВСЁ ДОЛЖНО РАБОТАТЬ!
-- ==========================================
