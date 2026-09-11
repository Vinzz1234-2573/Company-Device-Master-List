'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit, friendlyDbError } from '@/lib/audit';
import type { UserRole } from '@/lib/types';
import type { ActionState } from './assets';

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  return { supabase, isAdmin: profile?.role === 'admin' };
}

export async function inviteUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can create users.' };

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const full_name = String(formData.get('full_name') || '').trim();
  const role = (String(formData.get('role') || 'staff') as UserRole) || 'staff';
  const temp_password = String(formData.get('temp_password') || '');

  if (!email || !temp_password || temp_password.length < 8) {
    return { error: 'Please provide an email and a temporary password of at least 8 characters.' };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temp_password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error) return { error: friendlyDbError({ code: undefined, message: error.message }) };

  await admin.from('profiles').update({ full_name, role }).eq('id', data.user.id);

  await logAudit(supabase, { action: 'user_created', entity_type: 'profile', entity_id: data.user.id, new_value: { email, role } });
  revalidatePath('/users');
  return { error: null, ok: true };
}

export async function setUserRole(userId: string, role: UserRole): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can change user roles.' };

  const { error } = await supabase.rpc('set_user_role', { p_user_id: userId, p_role: role });
  if (error) return { error: friendlyDbError(error) };

  revalidatePath('/users');
  return { error: null, ok: true };
}

export async function setUserActive(userId: string, isActive: boolean): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can activate or deactivate users.' };

  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId);
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, {
    action: isActive ? 'user_reactivated' : 'user_deactivated',
    entity_type: 'profile',
    entity_id: userId,
  });
  revalidatePath('/users');
  return { error: null, ok: true };
}
