import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!;

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('Content-HMAC');

  // Примитивная валидация: сверяем подпись HMAC SHA256
  const expected = require('crypto').createHmac('sha256', YOOKASSA_SECRET_KEY).update(raw).digest('base64');
  if (signature !== expected) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const body = JSON.parse(raw);

  // Основные события: payment.succeeded и др. ЮKassa использует status 'succeeded' и 'waiting_for_capture'
  const event = body.event;
  const obj = body.object;

  if (event && event === 'payment.succeeded' && obj) {
    const payment = obj;
    const providerId = payment.id;
    const status = payment.status;
    const metadata = payment.metadata || {};

    // Проставим запись в payments
    await adminClient.from('payments').insert([{ provider_payment_id: providerId, amount: Math.round(parseFloat(payment.amount.value) * 100), currency: payment.amount.currency, provider: 'yookassa', status, metadata }]);

    // Обновим профиль: найдём пользователя по email в metadata
    const email = metadata.email;
    if (email) {
      const { data } = await adminClient.from('profiles').select('id, pro_until').eq('email', email).maybeSingle();
      if (data?.id) {
        const months = payment.metadata?.period === 'year' ? 12 : 1;
        const base = data.pro_until ? new Date(data.pro_until) : new Date();
        const newDate = new Date(base.getTime() + months * 30 * 24 * 3600 * 1000);
        await adminClient.from('profiles').update({ access_level: 'pro', pro_until: newDate.toISOString() }).eq('id', data.id);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

