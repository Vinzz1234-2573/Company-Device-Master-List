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

export async function resolveAssetVerification(assetId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can resolve verification records.' };

  const note = String(formData.get('note') || '').trim();
  const { data: before } = await supabase.from('assets').select('remarks').eq('id', assetId).single();
  const remarks = note ? `${before?.remarks ? before.remarks + '\n' : ''}[Verification resolved] ${note}` : before?.remarks;

  const { error } = await supabase.from('assets').update({ needs_verification: false, verification_reason: null, remarks }).eq('id', assetId);
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, { action: 'verification_resolved', entity_type: 'asset', entity_id: assetId, new_value: { note } });
  revalidatePath('/verification');
  revalidatePath(`/assets/${assetId}`);
  return { error: null, ok: true };
}

export async function resolveAssignmentVerification(assignmentId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: 'Only an administrator can resolve verification records.' };

  const note = String(formData.get('note') || '').trim();
  const { data: before } = await supabase.from('asset_assignments').select('remarks, asset_id').eq('id', assignmentId).single();
  const remarks = note ? `${before?.remarks ? before.remarks + '\n' : ''}[Verification resolved] ${note}` : before?.remarks;

  const { error } = await supabase
    .from('asset_assignments')
    .update({ needs_verification: false, verification_reason: null, remarks })
    .eq('id', assignmentId);
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, { action: 'verification_resolved', entity_type: 'asset_assignment', entity_id: assignmentId, new_value: { note } });
  revalidatePath('/verification');
  if (before?.asset_id) revalidatePath(`/assets/${before.asset_id}`);
  return { error: null, ok: true };
}
