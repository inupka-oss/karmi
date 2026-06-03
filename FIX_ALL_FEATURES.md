# 🔧 ПОЛНОЕ ВОССТАНОВЛЕНИЕ ФУНКЦИОНАЛА

## ✅ ЧТО НАЙДЕНО В ПРОЕКТЕ:

| Компонент | Файл | Статус |
|-----------|------|--------|
| FriendsList | `src/components/FriendsList.tsx` | ✅ ЕСТЬ |
| WatchParty | `src/components/WatchParty.tsx` | ✅ ЕСТЬ (с кнопкой друзей) |
| CommentSection | `src/components/CommentSection.tsx` | ✅ ЕСТЬ |
| AnimeActions | `src/components/AnimeActions.tsx` | ✅ ЕСТЬ (с кнопкой "Смотреть с друзьями") |
| Profile Page | `src/app/profile/page.tsx` | ✅ FriendsList интегрирован |

---

## ❌ ПРОБЛЕМА: SQL МИГРАЦИИ НЕ ВЫПОЛНЕНЫ!

Все компоненты работают через Supabase, но таблиц нет в базе!

---

## 📋 ШАГ 1: Выполнить SQL миграции

### 1.1 Открой Supabase Dashboard
1. Зайди на https://supabase.com/dashboard
2. Выбери свой проект
3. Перейди в **SQL Editor** (левое меню)

### 1.2 Скопируй SQL из файла
Открой файл: `supabase/FRIENDS_MIGRATION_FIXED.sql`

**ИЛИ** выполни этот SQL по частям:

```sql
-- =====================================================
-- 1. Таблица друзей
-- =====================================================

CREATE TABLE IF NOT EXISTS user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_user_friends_user ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);

-- RLS для друзей
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friends"
  ON user_friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON user_friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend status"
  ON user_friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete friend requests"
  ON user_friends FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. View для друзей с никами
-- =====================================================

CREATE OR REPLACE VIEW user_friends_with_profiles AS
SELECT 
  uf.id,
  uf.user_id,
  uf.friend_id,
  uf.status,
  uf.created_at,
  up.nickname as friend_nickname,
  up.avatar as friend_avatar,
  up.stats as friend_stats
FROM user_friends uf
LEFT JOIN user_profiles up ON up.user_identifier = uf.friend_id::text;

CREATE OR REPLACE VIEW user_friends_full AS
SELECT 
  uf.id,
  uf.user_id,
  uf.friend_id,
  uf.status,
  uf.created_at,
  up_from.nickname as user_nickname,
  up_from.avatar as user_avatar,
  up_friend.nickname as friend_nickname,
  up_friend.avatar as friend_avatar,
  up_friend.stats as friend_stats
FROM user_friends uf
LEFT JOIN user_profiles up_from ON up_from.user_identifier = uf.user_id::text
LEFT JOIN user_profiles up_friend ON up_friend.user_identifier = uf.friend_id::text;

-- =====================================================
-- 3. Таблица comments (если нет)
-- =====================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_avatar TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  reports_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_anime ON comments(anime_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- RLS для comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. Триггер для updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Таблица уведомлений
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- RLS для notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. Функции
-- =====================================================

CREATE OR REPLACE FUNCTION send_watch_party_invite(
  p_user_id UUID,
  p_friend_id UUID,
  p_room_id TEXT,
  p_anime_title TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    p_friend_id,
    'watch_party_invite',
    'Приглашение на совместный просмотр',
    'Приглашает вас посмотреть "' || p_anime_title || '"',
    jsonb_build_object(
      'room_id', p_room_id,
      'invited_by', p_user_id
    )
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION accept_friend_request(p_request_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_friends
  SET status = 'accepted'
  WHERE id = p_request_id AND friend_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_friend_request(p_friend_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_friend_id UUID;
  v_request_id UUID;
BEGIN
  SELECT id INTO v_friend_id FROM auth.users WHERE email = p_friend_email LIMIT 1;
  
  IF v_friend_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь не найден';
  END IF;
  
  INSERT INTO user_friends (user_id, friend_id, status)
  VALUES (auth.uid(), v_friend_id, 'pending')
  RETURNING id INTO v_request_id;
  
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
-- 7. View для статистики
-- =====================================================

CREATE OR REPLACE VIEW user_friends_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE status = 'accepted') as friends_count,
  COUNT(*) FILTER (WHERE status = 'pending' AND user_id = auth.uid()) as pending_sent,
  COUNT(*) FILTER (WHERE status = 'pending' AND friend_id = auth.uid()) as pending_received
FROM user_friends
GROUP BY user_id;
```

---

## 📋 ШАГ 2: Включить Realtime

В **Supabase Dashboard**:

1. Перейди в **Database** → **Replication**
2. Включи Realtime для таблиц:
   - ✅ `user_friends`
   - ✅ `notifications`
   - ✅ `watch_parties`
   - ✅ `comments`

Или выполни SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_friends;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE watch_parties;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```

---

## 📋 ШАГ 3: Проверка

### 3.1 Проверь что таблицы созданы:

```sql
-- Должны показать результат
SELECT * FROM user_friends LIMIT 1;
SELECT * FROM user_friends_full LIMIT 1;
SELECT * FROM comments LIMIT 1;
SELECT * FROM notifications LIMIT 1;
```

### 3.2 Проверь что функции работают:

```sql
-- Проверка функций (вернёт ошибку если не найдены)
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
  AND routine_schema = 'public'
  AND routine_name IN (
    'send_friend_request',
    'accept_friend_request',
    'send_watch_party_invite'
  );
```

---

## 📋 ШАГ 4: Тестирование

### 4.1 Друзья:
1. Открой `/profile`
2. Найди блок "**👥 Друзья**"
3. Нажми "**➕ Добавить**"
4. Введи email друга
5. Должна прийти заявка!

### 4.2 Комментарии:
1. Открой страницу любого аниме
2. Прокрути вниз до комментариев
3. Введи текст и нажми "Отправить"
4. Должен появиться комментарий!

### 4.3 Watch Party:
1. Открой страницу аниме
2. Найди кнопку "**🎉 Смотреть с друзьями**"
3. Нажми, введи имя
4. Нажми "**🎬 Создать комнату**"
5. Должна появиться кнопка "**👥 Друзья**"

---

## 🐛 ЕСЛИ ВСЁ ЕЩЁ НЕ РАБОТАЕТ:

### Проверь Environment Variables на Vercel:

1. Зайди на https://vercel.com/dashboard
2. Выбери проект
3. **Settings** → **Environment Variables**
4. Проверь что есть:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Перезадеплой проект:

```powershell
cd C:\Users\Administrator\Desktop\karmi

# Пустой коммит для триггера деплоя
git commit --allow-empty -m "force redeploy"
git push origin main
```

---

## 📁 ФАЙЛЫ КОТОРЫЕ УЖЕ ЕСТЬ:

```
src/components/FriendsList.tsx          ✅
src/components/WatchParty.tsx           ✅
src/components/CommentSection.tsx       ✅
src/components/AnimeActions.tsx         ✅
src/app/profile/page.tsx                ✅ (FriendsList интегрирован)
supabase/FRIENDS_MIGRATION_FIXED.sql    ✅
```

---

## 🎯 ГЛАВНАЯ ПРОБЛЕМА:

**SQL миграции не выполнены в Supabase!**

Компоненты работают через API к Supabase, но таблиц нет в базе.

**РЕШЕНИЕ:** Выполни SQL из ШАГА 1 в Supabase SQL Editor.

---

## ✅ ПОСЛЕ ВЫПОЛНЕНИЯ SQL:

1. ✅ Друзья появятся в профиле
2. ✅ Комментарии начнут работать
3. ✅ Кнопка "Друзья" появится в Watch Party
4. ✅ Можно будет приглашать друзей

---

**ВЫПОЛНИ SQL И ВСЁ ЗАРАБОТАЕТ!** 🚀
