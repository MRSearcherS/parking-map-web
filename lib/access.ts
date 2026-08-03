import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export type AccessState = {
  status: 'loading' | 'ready';
  isPro: boolean;
  user: User | null;
  accessLevel?: string | null;
  proUntil?: string | null;
};

export async function getAccessState(): Promise<AccessState> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { status: 'ready', isPro: false, user: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('access_level, pro_until')
    .eq('id', user.id)
    .maybeSingle();

  const accessLevel = profile?.access_level ?? 'free';
  const proUntil = profile?.pro_until ?? null;
  const hasActiveDate = proUntil ? new Date(proUntil).getTime() > Date.now() : false;
  const isPro = accessLevel === 'admin' || accessLevel === 'pro' || hasActiveDate;

  return {
    status: 'ready',
    isPro,
    user,
    accessLevel,
    proUntil,
  };
}
