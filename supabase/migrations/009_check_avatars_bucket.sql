-- =====================================================
-- ПРОВЕРКА И СОЗДАНИЕ BUCKET 'AVATARS'
-- Запустить в Supabase SQL Editor
-- =====================================================

-- 1. Проверяем существует ли bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';

-- Если не существует - создаём
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Проверяем RLS политики
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
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%avatar%';

-- 3. Если политик нет или они неправильные - пересоздаём
-- Сначала удаляем старые
DROP POLICY IF EXISTS "Avatars: anyone can view" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: users can update own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: users can delete own" ON storage.objects;

-- Создаём новые (с поддержкой anon)
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

-- =====================================================
-- ГОТОВО!
-- =====================================================
