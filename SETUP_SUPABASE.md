# 📋 Полная инструкция по настройке Supabase

## ✅ Шаг 1: Выполнить SQL миграции

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (в левом меню)
4. Нажмите **New Query**
5. Скопируйте содержимое файла `supabase/migrations/001_karmi_improvements.sql`
6. Вставьте в редактор и нажмите **Run**

**Готово!** Все таблицы, индексы и триггеры созданы.

---

## ✅ Шаг 2: Включить Supabase Realtime (для Watch Party)

1. В Dashboard перейдите в **Database** → **Replication**
2. Найдите таблицу `watch_parties`
3. Включите toggle **Enable Realtime** ✅
4. Повторите для таблиц:
   - `user_profiles`
   - `comments`
   - `collection_cards`

Или выполните SQL:

```sql
-- Включаем Realtime для нужных таблиц
ALTER PUBLICATION supabase_realtime ADD TABLE watch_parties;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE collection_cards;
```

---

## ✅ Шаг 3: Настроить Storage (для аватаров и карточек)

1. Перейдите в **Storage** (в левом меню)
2. Нажмите **New Bucket**
3. Создайте бакет с именем: `avatars`
4. Settings:
   - Public: ✅ Yes
   - File size limit: `5242880` (5 MB)
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

5. Создайте бакет `collection-cards` (опционально):
   - Public: ✅ Yes
   - File size limit: `10485760` (10 MB)

### Policies для Storage

Для бакета `avatars`:

```sql
-- Разрешить всем читать аватары
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Разрешить пользователям загружать свои аватары
CREATE POLICY "User Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Разрешить пользователям обновлять свои аватары
CREATE POLICY "User Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## ✅ Шаг 4: Обновить переменные окружения

Проверьте файл `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Где взять:**
- Dashboard → **Settings** → **API**
- Скопируйте **Project URL** и **anon public** ключ

---

## ✅ Шаг 5: Создать PWA иконки

### Вариант 1: Онлайн генератор
1. Перейдите на [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Загрузите логотип Karmi (минимум 512x512)
3. Скачайте пакет иконок
4. Поместите в `public/`:
   - `icon-192.png`
   - `icon-512.png`
   - `favicon.svg` (если нет)

### Вариант 2: Быстро через Placeholder
Если нет логотипа, создайте простые иконки:

```bash
# В терминале (требуется ImageMagick)
convert -size 512x512 xc:'#ff2e63' -font Arial -pointsize 200 -fill white -gravity center -annotate 0 'K' public/icon-512.png
convert -size 192x192 xc:'#ff2e63' -font Arial -pointsize 80 -fill white -gravity center -annotate 0 'K' public/icon-192.png
```

Или просто нарисуйте в Figma/Photoshop и экспортируйте.

---

## ✅ Шаг 6: Проверка работы

### 1. Проверка таблиц
```sql
-- Проверка создания таблиц
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'comment_reactions', 'user_achievements', 'user_challenges',
  'collection_cards', 'comment_reports', 'user_activity', 'watch_parties'
);
```

### 2. Проверка Realtime
Откройте консоль браузера на вашем сайте и выполните:

```javascript
// Должно подключиться без ошибок
const { data } = supabase
  .channel('test')
  .on('system', { event: '*' }, payload => {
    console.log('Realtime works!', payload)
  })
  .subscribe()
```

### 3. Проверка PWA
1. Откройте сайт в Chrome
2. F12 → **Application** → **Manifest**
3. Должен отображаться манифест без ошибок
4. В **Service Workers** должен быть зарегистрирован `sw.js`

---

## ✅ Шаг 7: Тестирование функций

### 1. Комментарии с реакциями
- Откройте любую страницу аниме
- Оставьте комментарий
- Попробуйте поставить 👍/👎
- Ответьте на комментарий (должна быть вложенность)

### 2. Профиль и статистика
- `/profile` → проверьте вкладки
- Должна отображаться статистика, достижения, челленджи

### 3. Watch Party
- На странице аниме нажмите "🎉 Смотреть с друзьями"
- Создайте комнату
- Скопируйте ссылку и откройте в другой вкладке
- Проверьте синхронизацию видео

### 4. PWA
- Chrome: адресная строка → иконка установки
- Или F12 → Application → Manifest → Add to home screen

---

## 🎯 Дополнительные настройки (опционально)

### Cron Jobs для сброса челленджей

Supabase имеет **pg_cron** на платных тарифах. Для бесплатного:

**Вариант 1: Edge Function с таймером**
```bash
npx supabase functions new reset-challenges
```

**Вариант 2: Внешний сервис (рекомендуется)**
Используйте [Cron-Job.org](https://cron-job.org/) (бесплатно):
1. Создайте аккаунт
2. Создайте новый крон
3. URL: `https://your-project.supabase.co/functions/v1/reset-challenges`
4. Метод: POST
5. Расписание: `0 0 * * *` (каждый день в полночь)

### Edge Function для сброса челленджей

Создайте файл `supabase/functions/reset-challenges/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Сброс ежедневных
  await supabase.rpc('reset_daily_challenges')
  
  // Сброс еженедельных (по понедельникам)
  if (new Date().getDay() === 1) {
    await supabase.rpc('reset_weekly_challenges')
  }

  return new Response('OK')
})
```

Деплой:
```bash
npx supabase functions deploy reset-challenges
```

---

## 📊 Мониторинг использования

### Dashboard → Database
- Следите за размером базы (лимит 500 MB)
- Проверять: **Settings** → **Database**

### Dashboard → Usage
- API requests (неограниченно)
- Bandwidth (5 GB/месяц)
- Storage (1 GB)

### Оптимизация
Если приближаетесь к лимитам:
1. Очистите старые `user_activity` (храните 30 дней)
2. Удалите неактивные `watch_parties`
3. Сожмите изображения в storage

---

## 🆘 Troubleshooting

### Ошибка: "relation does not exist"
→ Выполните SQL миграции ещё раз

### Ошибка: "permission denied for table"
→ Проверьте RLS policies, убедитесь что пользователь авторизован

### Watch Party не синхронизирует
→ Проверьте что Realtime включен для таблицы `watch_parties`

### PWA не устанавливается
→ Проверьте что сайт на HTTPS (кроме localhost)
→ Проверьте manifest.json в Application tab

### Realtime не работает
→ Проверьте что таблицы добавлены в публикацию:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

---

## 📞 Поддержка Supabase

- [Документация](https://supabase.com/docs)
- [Discord сообщество](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

## 🎉 Готово!

После выполнения всех шагов у вас будет полностью рабочий сайт со всеми функциями:

✅ Hero-слайдер  
✅ Персонализация  
✅ Комментарии с ответами  
✅ PWA  
✅ Мобильная навигация  
✅ Топы  
✅ Профиль с статистикой  
✅ Геймификация  
✅ Админ-панель  
✅ AI рекомендации  
✅ Watch Party  
✅ Коллекционные карточки  

**Удачи! 🚀**
