import { NextResponse } from 'next/server';
import { adminClient, requireAdmin } from '@/lib/adminAuth';

export async function POST(req: Request) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();

  const name = String(body.name || '').trim();
  const address = String(body.address || '').trim();
  const description = String(body.description || '').trim();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!name) {
    return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
  }

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return NextResponse.json({ error: 'Некорректная широта' }, { status: 400 });
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: 'Некорректная долгота' }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('parking_places')
    .insert([
      {
        name,
        address: address || null,
        description: description || null,
        latitude,
        longitude,
        is_free: body.is_free !== false,
        is_verified: Boolean(body.is_verified),
        is_approved: Boolean(body.is_approved),
        is_demo: Boolean(body.is_demo),
      },
    ])
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    parking: data,
  });
}
