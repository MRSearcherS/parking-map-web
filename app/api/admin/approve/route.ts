import { NextResponse } from 'next/server';
import { adminClient, requireAdmin } from '@/lib/adminAuth';

export async function POST(req: Request) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const parkingId = Number(body.parkingId);

  if (!parkingId) {
    return NextResponse.json({ error: 'parkingId required' }, { status: 400 });
  }

  const { error } = await adminClient
    .from('parking_places')
    .update({
      is_approved: true,
      is_verified: true,
    })
    .eq('id', parkingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
