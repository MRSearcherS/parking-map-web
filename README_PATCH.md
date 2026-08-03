Инструкция по применению патча (feature/admin-yookassa)

Файлы:
- app/admin/page.tsx — простая админка (список парковок, approve/reject, форма set-pro)
- app/api/admin/list/route.ts — возвращает список парковок и пользователей (server, использует SUPABASE_SERVICE_ROLE_KEY)
- app/api/admin/approve/route.ts — одобрить парковку
- app/api/admin/reject/route.ts — отклонить/удалить парковку
- app/api/admin/set-pro/route.ts — выставить PRO пользователю (по email или userId)
- app/api/create-yookassa-payment/route.ts — создаёт платёж в YooKassa (redirect) и сохраняет запись в payments
- app/api/webhook-yookassa/route.ts — endpoint для приёма уведомлений от YooKassa (логирует и обновляет профиль)
- supabase/schema_additions.sql — миграция: таблица payments

Как применить (PowerShell):
# в корне репозитория
cd "C:\path\to\your\repo\parking-map-web"

git checkout -b feature/admin-yookassa

# распакуйте файлы из архива admin_patch.zip в корень проекта так, чтобы пути совпадали
# если используете скачанный zip, распакуйте его в корень проекта
# затем закоммитьте:

git add .
git commit -m "feature: admin UI + admin API + YooKassa payment endpoints + payments migration"
git push -u origin feature/admin-yookassa

После пуша создайте Pull Request в GitHub и затем смержите в main (или попросите меня проверить PR).

ENV переменные (Vercel / .env.local):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- PUBLIC_URL (https://your-deploy-url)
- YOOKASSA_SHOP_ID
- YOOKASSA_SECRET_KEY
- YOOKASSA_TEST_MODE (true|false)

Не храните SUPABASE_SERVICE_ROLE_KEY и YOOKASSA_SECRET_KEY в публичном репозитории.

Тестирование локально:
- Для webhook используйте ngrok: ngrok http 3000
- В YooKassa укажите webhook URL: https://xxxxxx.ngrok.io/api/webhook-yookassa

ВАЖНО: Проверка подписи webhook реализована упрощённо — перед выпуском в продакшен обязательно адаптировать проверку в соответствии с документацией YooKassa и настроить секреты.
