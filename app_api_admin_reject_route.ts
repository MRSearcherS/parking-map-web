import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function POST(req: Request) {
  const body = await req.json();
  const { parkingId } = body;
  if (!parkingId) return NextResponse.json({ error: 'parkingId required' }, { status: 400 });

  const { error } = await adminClient
    .from('parking_places')
    .delete()
    .eq('id', parkingId);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
