'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAudit, friendlyDbError } from '@/lib/audit';
import type { ActionState } from './assets';

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  return { supabase, isAdmin: profile?.role === 'admin' };
}

export async function createDepartment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can add departments.' };

  const code = String(formData.get('code') || '').trim().toUpperCase();
  const name = String(formData.get('name') || '').trim();
  if (!code || !name) return { error: 'Both a code and a name are required.' };

  const { data, error } = await supabase.from('departments').insert({ code, name }).select('id').single();
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, { action: 'department_created', entity_type: 'department', entity_id: data.id, new_value: { code, name } });
  revalidatePath('/departments');
  return { error: null, ok: true };
}

export async function renameDepartment(departmentId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can edit departments.' };

  const name = String(formData.get('name') || '').trim();
  if (!name) return { error: 'Name is required.' };

  const { error } = await supabase.from('departments').update({ name }).eq('id', departmentId);
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, { action: 'department_edited', entity_type: 'department', entity_id: departmentId, new_value: { name } });
  revalidatePath('/departments');
  return { error: null, ok: true };
}

export async function toggleDepartmentActive(departmentId: string, isActive: boolean): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can deactivate departments.' };

  const { error } = await supabase.from('departments').update({ is_active: isActive }).eq('id', departmentId);
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, {
    action: isActive ? 'department_reactivated' : 'department_deactivated',
    entity_type: 'department',
    entity_id: departmentId,
  });
  revalidatePath('/departments');
  return { error: null, ok: true };
}
