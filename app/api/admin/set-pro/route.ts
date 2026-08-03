import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, userId, months = 1 } = body;

  if (!email && !userId) return NextResponse.json({ error: 'email or userId required' }, { status: 400 });

  let profileId = userId;
  if (!profileId) {
    const { data, error } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) return NextResponse.json({ error }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'profile not found' }, { status: 404 });

    profileId = data.id;
  }

  // рассчитаем pro_until
  const { data: existing } = await adminClient.from('profiles').select('pro_until').eq('id', profileId).maybeSingle();
  let base = existing?.pro_until ? new Date(existing.pro_until) : new Date();
  const newDate = new Date(base.getTime() + months * 30 * 24 * 3600 * 1000);

  const { error } = await adminClient
    .from('profiles')
    .update({ access_level: 'pro', pro_until: newDate.toISOString() })
    .eq('id', profileId);

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
