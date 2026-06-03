# 🔧 Исправление SQL ошибки (UUID vs TEXT)

## ❌ Ошибка:
```
ERROR: 42883: operator does not exist: text = uuid
LINE 12: LEFT JOIN user_profiles up ON up.user_identifier = uf.friend_id;
```

## ✅ Решение:

Проблема в том что `user_profiles.user_identifier` это **TEXT**, а `user_friends.friend_id` это **UUID**.

Нужно привести UUID к TEXT: `uf.friend_id::text`

---

## 📋 Что делать:

### Вариант 1: Выполнить исправленный SQL (РЕКОМЕНДУЕТСЯ)

1. Откройте **Supabase SQL Editor**
2. Скопируйте файл: `supabase/FRIENDS_MIGRATION_FIXED.sql`
3. Выполните весь SQL

**ИЛИ**

### Вариант 2: Исправить существующие VIEW

Если вы уже выполнили предыдущую миграцию, выполните только это:

```sql
-- Исправляем VIEW с правильным приведением типов
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
```

---

## ✅ Проверка:

После выполнения проверьте что VIEW работают:

```sql
-- Должно вернуть результат без ошибок
SELECT * FROM user_friends_full LIMIT 5;
```

---

## 📁 Файлы:

- `supabase/FRIENDS_MIGRATION_FIXED.sql` - Полный исправленный SQL
- `SQL_FIX_INSTRUCTION.md` - Эта инструкция

---

## 🎊 Готово!

Теперь система друзей будет работать корректно! 🚀
