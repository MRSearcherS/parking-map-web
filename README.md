# Parking Map Web MVP

Адаптивный веб-MVP сервиса бесплатных парковок с платным доступом.

Стек:

- Next.js
- TypeScript
- Leaflet / OpenStreetMap
- Supabase Auth
- PostgreSQL + PostGIS

## Логика доступа

Free-пользователь:

- видит карту;
- видит одну демо-парковку;
- видит счетчик найденных парковок рядом;
- не получает реальные координаты парковок.

PRO-пользователь:

- получает реальные парковки через SQL-функцию `get_nearby_pro_parkings`;
- видит точные маркеры, адреса и описания.

## Установка на Windows

1. Установите Node.js LTS: https://nodejs.org
2. Скопируйте проект в удобную папку.
3. Откройте PowerShell в папке проекта.
4. Выполните:

```powershell
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Сайт откроется на:

```text
http://localhost:3000
```

## Supabase

1. Зарегистрируйтесь на https://supabase.com
2. Создайте проект.
3. Откройте `SQL Editor`.
4. Выполните содержимое файла `supabase/schema.sql`.
5. Откройте `Project Settings -> API`.
6. Скопируйте:

```text
Project URL
anon public key
```

7. Вставьте их в `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

8. Перезапустите dev-сервер:

```powershell
npm run dev
```

## Как вручную включить PRO

После регистрации пользователя на сайте откройте Supabase:

```text
Table Editor -> profiles
```

Найдите пользователя и поставьте:

```text
access_level = pro
```

После обновления страницы пользователь увидит реальные парковки.

## PowerShell: создание файлов проекта с нуля

Если нужно создать пустой проект вручную:

```powershell
mkdir parking-map-web
cd parking-map-web
npm init -y
npm install next react react-dom @supabase/supabase-js leaflet react-leaflet lucide-react
npm install -D typescript @types/node @types/react @types/react-dom @types/leaflet eslint eslint-config-next
mkdir app, components, lib, supabase
```

## Следующие этапы

- Подключить платежную систему.
- Добавить страницу оплаты.
- Добавить админку для парковок.
- Добавить фильтры и избранное.
- Заменить публичные OSM-тайлы на коммерческого провайдера для продакшена.
