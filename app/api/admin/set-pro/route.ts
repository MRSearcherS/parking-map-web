import { NextResponse } from 'next/server';
import { adminClient, requireAdmin } from '@/lib/adminAuth';

export async function POST(req: Request) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { email, userId, months = 1 } = body;

  if (!email && !userId) {
    return NextResponse.json({ error: 'email or userId required' }, { status: 400 });
  }

  let profileId = userId;

  if (!profileId) {
    const { data, error } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Профиль не найден' }, { status: 404 });
    }

    profileId = data.id;
  }

  const { data: existing, error: existingError } = await adminClient
    .from('profiles')
    .select('pro_until')
    .eq('id', profileId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const now = new Date();
  const currentProUntil = existing?.pro_until ? new Date(existing.pro_until) : null;
  const base = currentProUntil && currentProUntil.getTime() > now.getTime() ? currentProUntil : now;
  const newDate = new Date(base.getTime() + Number(months) * 30 * 24 * 3600 * 1000);

  const { error } = await adminClient
    .from('profiles')
    .update({
      access_level: 'pro',
      pro_until: newDate.toISOString(),
    })
    .eq('id', profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    pro_until: newDate.toISOString(),
  });
}
