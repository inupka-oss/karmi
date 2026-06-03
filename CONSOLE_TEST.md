# 🧪 Тестирование Supabase в консоли браузера

## ✅ Как правильно тестировать

После обновления, Supabase клиент должен быть доступен глобально.

### Способ 1: Через глобальный объект (после загрузки страницы)

Откройте консоль браузера (F12) и выполните:

```javascript
// Проверка что переменные окружения загружены
console.log('URL:', window.supabaseUrl)
console.log('Key:', window.supabaseKey)

// Создание клиента вручную
const supabase = window.supabase.createClient(window.supabaseUrl, window.supabaseKey)

// Тестовый запрос
const { data, error } = await supabase
  .from('anime')
  .select('id, title_ru')
  .limit(5)

console.log('Аниме:', data)
```

### Способ 2: Через импортированный клиент (в компонентах)

В любом client компоненте:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Использование
const { data } = await supabase.from('anime').select('*')
```

### Способ 3: Через хук

```typescript
import { useSupabase } from '@/hooks/useSupabase'

function MyComponent() {
  const supabase = useSupabase()
  
  useEffect(() => {
    if (supabase) {
      supabase.from('anime').select('*').then(console.log)
    }
  }, [supabase])
}
```

---

## 🔍 Проверка работы

### 1. Проверка подключения
```javascript
const supabase = createClient(window.supabaseUrl, window.supabaseKey)
const { data, error } = await supabase.from('anime').select('count').limit(1)
console.log('Подключение:', error ? '❌ Ошибка' : '✅ Успех', data)
```

### 2. Проверка Realtime
```javascript
const channel = supabase
  .channel('test-channel')
  .on('system', { event: '*' }, payload => {
    console.log('Realtime событие:', payload)
  })
  .subscribe(status => {
    console.log('Статус подписки:', status)
  })
```

### 3. Проверка авторизации
```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Сессия:', session ? '✅ Авторизован' : '❌ Гость')
```

---

## ❌ Если всё ещё ошибка "supabase is not defined"

### Решение 1: Использовать импортированный клиент

Вместо использования в консоли, создайте тестовый компонент:

```typescript
// src/components/TestSupabase.tsx
'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TestSupabase() {
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    supabase.from('anime').select('*').limit(1).then(({ data, error }) => {
      console.log('Test:', data, error)
    })
  }, [])
  
  return <div>Testing Supabase...</div>
}
```

### Решение 2: Добавить скрипт с CDN

В `src/app/layout.tsx` добавьте перед закрывающим `</head>`:

```tsx
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" />
```

### Решение 3: Использовать Postman/cURL для тестирования API

```bash
curl -X GET 'https://YOUR_PROJECT.supabase.co/rest/v1/anime?limit=5' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 📝 Заметки

- Глобальный объект `supabase` недоступен напрямую в консоли из соображений безопасности
- Используйте импортированный клиент в компонентах
- Для отладки создайте временный компонент с `console.log`
- Переменные окружения должны начинаться с `NEXT_PUBLIC_`
