import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: 'Unauthorized',
    };
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);

  if (userError || !userData.user) {
    return {
      ok: false as const,
      status: 401,
      error: 'Invalid session',
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, email, access_level')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false as const,
      status: 500,
      error: profileError.message,
    };
  }

  if (!profile || profile.access_level !== 'admin') {
    return {
      ok: false as const,
      status: 403,
      error: 'Admin access required',
    };
  }

  return {
    ok: true as const,
    user: userData.user,
    profile,
  };
}

export async function requireAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: 'Нужно войти в аккаунт',
    };
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);

  if (userError || !userData.user) {
    return {
      ok: false as const,
      status: 401,
      error: 'Сессия недействительна. Войдите заново.',
    };
  }

  return {
    ok: true as const,
    user: userData.user,
  };
}
