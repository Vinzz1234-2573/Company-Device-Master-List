'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logAudit, friendlyDbError } from '@/lib/audit';
import type { EmploymentStatus } from '@/lib/types';
import type { ActionState } from './assets';

function str(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim() || null;
}

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  return { supabase, isAdmin: profile?.role === 'admin' };
}

export async function createEmployee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can add employees.' };

  const name = str(formData, 'name');
  if (!name) return { error: 'Employee name is required.' };

  const payload = {
    name,
    employee_no: str(formData, 'employee_no'),
    job_title: str(formData, 'job_title'),
    department_id: str(formData, 'department_id'),
    email: str(formData, 'email'),
    phone: str(formData, 'phone'),
    joined_date: str(formData, 'joined_date'),
    remarks: str(formData, 'remarks'),
    employment_status: 'active' as EmploymentStatus,
  };

  const { data, error } = await supabase.from('employees').insert(payload).select('id').single();
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, { action: 'employee_created', entity_type: 'employee', entity_id: data.id, new_value: payload });
  revalidatePath('/employees');
  redirect(`/employees/${data.id}`);
}

export async function updateEmployee(employeeId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can edit employees.' };

  const name = str(formData, 'name');
  if (!name) return { error: 'Employee name is required.' };

  const { data: before } = await supabase.from('employees').select('*').eq('id', employeeId).single();

  const payload = {
    name,
    employee_no: str(formData, 'employee_no'),
    job_title: str(formData, 'job_title'),
    department_id: str(formData, 'department_id'),
    email: str(formData, 'email'),
    phone: str(formData, 'phone'),
    joined_date: str(formData, 'joined_date'),
    remarks: str(formData, 'remarks'),
  };

  const { error } = await supabase.from('employees').update(payload).eq('id', employeeId);
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, { action: 'employee_edited', entity_type: 'employee', entity_id: employeeId, old_value: before, new_value: payload });
  revalidatePath('/employees');
  revalidatePath(`/employees/${employeeId}`);
  redirect(`/employees/${employeeId}`);
}

export async function resignEmployee(employeeId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can update employment status.' };

  const status = str(formData, 'employment_status') as EmploymentStatus | null;
  if (!status) return { error: 'Please choose an employment status.' };

  const payload: Record<string, unknown> = { employment_status: status };
  if (status === 'resigned') {
    payload.resigned_date = str(formData, 'resigned_date') || new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase.from('employees').update(payload).eq('id', employeeId);
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, { action: 'employee_status_changed', entity_type: 'employee', entity_id: employeeId, new_value: payload });
  revalidatePath('/employees');
  revalidatePath(`/employees/${employeeId}`);
  return { error: null, ok: true };
}
