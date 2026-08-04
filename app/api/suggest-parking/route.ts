import { NextResponse } from 'next/server';
import { adminClient, requireAuthenticatedUser } from '@/lib/adminAuth';

export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req);

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
    return NextResponse.json({ error: 'Введите название парковки' }, { status: 400 });
  }

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return NextResponse.json({ error: 'Некорректная широта' }, { status: 400 });
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: 'Некорректная долгота' }, { status: 400 });
  }

  const userEmail = auth.user.email || 'unknown';

  const finalDescription = [
    description,
    '',
    `Предложил пользователь: ${userEmail}`,
    `User ID: ${auth.user.id}`,
  ].join('\n').trim();

  const { data, error } = await adminClient
    .from('parking_places')
    .insert([
      {
        name,
        address: address || null,
        description: finalDescription || null,
        latitude,
        longitude,
        is_free: true,
        is_verified: false,
        is_approved: false,
        is_demo: false,
      },
    ])
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    message: 'Спасибо! Парковка отправлена на проверку.',
  });
}
