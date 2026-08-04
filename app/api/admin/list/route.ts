import { NextResponse } from 'next/server';
import { adminClient, requireAdmin } from '@/lib/adminAuth';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: parkings, error: pErr } = await adminClient
    .from('parking_places')
    .select('*')
    .order('created_at', { ascending: false });

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const { data: users, error: uErr } = await adminClient
    .from('profiles')
    .select('id, email, access_level, pro_until, created_at')
    .order('created_at', { ascending: false });

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  return NextResponse.json({
    parkings: parkings || [],
    users: users || [],
  });
}
