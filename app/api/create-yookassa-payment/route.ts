import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID!;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!;
const PUBLIC_URL = process.env.PUBLIC_URL!;

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, amount, period } = body; // amount in kopecks

  if (!email || !amount || !period) return NextResponse.json({ error: 'email, amount, period required' }, { status: 400 });

  // формируем запрос к YooKassa
  const idempotenceKey = 'id-' + Date.now();
  const payload = {
    "amount": { "value": (amount / 100).toFixed(2), "currency": "RUB" },
    "confirmation": { "type": "redirect", "return_url": `${PUBLIC_URL}/` },
    "capture": true,
    "description": `PRO access ${period}`,
    "metadata": { email }
  };

  const res = await fetch(`https://api.yookassa.ru/v3/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
      'Authorization': 'Basic ' + Buffer.from(YOOKASSA_SHOP_ID + ':' + YOOKASSA_SECRET_KEY).toString('base64')
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: 500 });
  }

  // сохранить платёж в payments
  await adminClient.from('payments').insert([{ user_id: null, amount: amount, currency: 'RUB', provider: 'yookassa', provider_payment_id: data.id, status: data.status, metadata: { email, payload: data } }]);

  // вернуть redirect URL
  const redirectUrl = data.confirmation?.confirmation_url || data.confirmation?.redirect_url;
  return NextResponse.json({ url: redirectUrl, payment: data });
}

