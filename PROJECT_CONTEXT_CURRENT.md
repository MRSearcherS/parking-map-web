# parking-map-web: текущий контекст

Дата: 2026-08-05

## Репозиторий

GitHub:
https://github.com/MRSearcherS/parking-map-web

Vercel:
https://vercel.com/mrs10/parking-map-web

Production URL:
https://parking-map-web.vercel.app

Текущая ветка:
fix/use-global-fetch

Последний успешный push:
fix/use-global-fetch -> origin/fix/use-global-fetch

Последний коммит с восстановлением пароля:
140e162 Add user password reset

## Что уже сделано

- Проект собирается через `npm run build`.
- Добавлена страница `/reset-password`.
- Добавлено восстановление пароля через Supabase.
- Добавлен компонент `components/FloatingPasswordReset.tsx`.
- Добавлены стили `USER_PASSWORD_RESET_PATCH`.
- Код успешно отправлен на GitHub в ветку `fix/use-global-fetch`.

## Supabase Auth URL Configuration

Рекомендуемые настройки:

Site URL:
https://parking-map-web.vercel.app

Redirect URLs:
http://localhost:3000
http://localhost:3000/reset-password
https://parking-map-web.vercel.app
https://parking-map-web.vercel.app/reset-password

Важно:
Если Site URL стоит `http://localhost:3000`, письма восстановления будут вести на локальный адрес.
Это работает только при запущенном `npm run dev`.

## Текущая проблема

При переходе по ссылке восстановления пароля браузер открыл:

http://localhost:3000/#access_token=...

И показал:

ERR_CONNECTION_REFUSED

Причина:
локальный dev-сервер не был запущен или Supabase Site URL настроен на localhost.

Решение:
для продакшена поставить Site URL на:
https://parking-map-web.vercel.app

## Что нужно сделать дальше

1. Переместить кнопку восстановления пароля под кнопки входа и создания аккаунта.
2. Сделать кнопку восстановления менее акцентной.
3. Закрепить кнопку "Предложить парковку" статично под блоком логина.
4. Проверить `npm run build`.
5. Закоммитить изменения.
6. Запушить в `fix/use-global-fetch`.
7. Проверить deployment на Vercel.
8. При необходимости сделать Pull Request / merge в основную ветку.

## Команды проверки

npm run build
git status
git log -1 --oneline
git branch -a

## Команды публикации

git add -A
git commit -m "Adjust auth secondary actions"
git push -u origin fix/use-global-fetch

