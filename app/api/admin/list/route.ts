import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function GET() {
  const { data: parkings, error: pErr } = await adminClient.from('parking_places').select('*').order('created_at', { ascending: false });
  if (pErr) return NextResponse.json({ error: pErr }, { status: 500 });

  const { data: users, error: uErr } = await adminClient.from('profiles').select('id, email, access_level, pro_until').order('created_at', { ascending: false });
  if (uErr) return NextResponse.json({ error: uErr }, { status: 500 });

  return NextResponse.json({ parkings, users });
}
