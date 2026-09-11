import type { SupabaseClient } from '@supabase/supabase-js';

export async function logAudit(
  supabase: SupabaseClient,
  entry: {
    action: string;
    entity_type: string;
    entity_id?: string | null;
    old_value?: Record<string, unknown> | null;
    new_value?: Record<string, unknown> | null;
  }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from('audit_logs').insert({
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    old_value: entry.old_value ?? null,
    new_value: entry.new_value ?? null,
  });
}

/** Turns a Postgres error into a message a non-technical user can understand. */
export function friendlyDbError(error: { code?: string; message: string } | null): string {
  if (!error) return 'Something went wrong. Please try again.';
  if (error.code === '23505') {
    if (/serial_no/.test(error.message)) {
      return 'This serial number already exists in the system. Please check the existing asset record.';
    }
    if (/imei/.test(error.message)) {
      return 'This IMEI already exists in the system. Please check the existing asset record.';
    }
    if (/one_active/.test(error.message)) {
      return 'This asset already has an active assignment. Please return it before assigning it again.';
    }
    return 'A record with this value already exists.';
  }
  if (error.code === '23503') {
    return 'This action refers to a record that no longer exists. Please refresh the page and try again.';
  }
  if (error.code === '23514') {
    return 'One of the values entered is not valid for this field.';
  }
  return error.message.replace(/^\w+:\s*/, '');
}
