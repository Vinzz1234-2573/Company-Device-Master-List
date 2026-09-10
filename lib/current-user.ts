import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return profile;
}

export function isAdmin(profile: Profile | null) {
  return profile?.role === 'admin';
}

export function isAdminOrManager(profile: Profile | null) {
  return profile?.role === 'admin' || profile?.role === 'manager';
}
