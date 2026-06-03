-- =====================================================
-- ИСПРАВЛЕНИЕ СОХРАНЕНИЯ USERNAME
-- Запустить в Supabase SQL Editor
-- =====================================================

-- 1. Проверяем существующие политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 2. Удаляем старые политики
DROP POLICY IF EXISTS "users_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "users_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "users_profiles_update" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_identifier" ON user_profiles;

-- 3. Создаём новые политики (разрешаем UPDATE по user_identifier)
-- SELECT - все могут читать
CREATE POLICY "users_profiles_select" 
ON user_profiles FOR SELECT 
TO anon, authenticated 
USING (true);

-- INSERT - могут создавать все (включая anon для гостей)
CREATE POLICY "users_profiles_insert" 
ON user_profiles FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- UPDATE - могут обновлять все по user_identifier
CREATE POLICY "users_profiles_update" 
ON user_profiles FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

-- 4. Проверяем что колонка username существует
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- 5. Создаём уникальный индекс (если не существует)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username 
ON user_profiles(username) 
WHERE username IS NOT NULL;

-- 6. Тестовая проверка - пробуем обновить username
-- Раскомментируй для теста, замени 'test@example.com' на свой email
/*
UPDATE user_profiles 
SET username = 'testuser123'
WHERE user_identifier = 'test@example.com';
*/

-- =====================================================
-- ГОТОВО!
-- =====================================================
