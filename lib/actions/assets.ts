'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logAudit, friendlyDbError } from '@/lib/audit';
import type { AssetStatus } from '@/lib/types';

export type ActionState = { error: string | null; ok?: boolean };

const PLACEHOLDER_SERIAL = /^(na|n\/a|n\.a\.?|-|nil|none|_)?$/i;

export async function checkDuplicateSerial(serial: string, excludeId?: string) {
  if (!serial || PLACEHOLDER_SERIAL.test(serial.trim())) return null;
  const supabase = createClient();
  let query = supabase.from('assets').select('id, asset_code, asset_type, description, status').ilike('serial_no', serial.trim());
  if (excludeId) query = query.neq('id', excludeId);
  const { data } = await query.limit(1).maybeSingle();
  return data;
}

function requiredStr(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim() || null;
}

export async function createAsset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  if (profile?.role !== 'admin') return { error: 'Only an administrator can add assets.' };

  const asset_type = requiredStr(formData, 'asset_type');
  if (!asset_type) return { error: 'Asset type is required.' };

  const serial_no = requiredStr(formData, 'serial_no');
  const overrideDuplicate = formData.get('override_duplicate') === 'on';
  if (serial_no && !overrideDuplicate) {
    const dup = await checkDuplicateSerial(serial_no);
    if (dup) {
      return { error: `Potential duplicate asset detected: serial number already used by ${dup.asset_code} (${dup.asset_type}). Tick "confirm this is a different asset" to proceed anyway.` };
    }
  }

  const payload = {
    asset_type,
    brand: requiredStr(formData, 'brand'),
    model: requiredStr(formData, 'model'),
    description: requiredStr(formData, 'description'),
    serial_no,
    imei: requiredStr(formData, 'imei'),
    sim_number: requiredStr(formData, 'sim_number'),
    phone_number: requiredStr(formData, 'phone_number'),
    condition: requiredStr(formData, 'condition'),
    location: requiredStr(formData, 'location'),
    department_id: requiredStr(formData, 'department_id'),
    remarks: requiredStr(formData, 'remarks'),
    status: 'available' as AssetStatus,
    created_by: user?.id,
    updated_by: user?.id,
  };

  const { data, error } = await supabase.from('assets').insert(payload).select('id').single();
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, { action: 'asset_created', entity_type: 'asset', entity_id: data.id, new_value: payload });
  revalidatePath('/assets');
  redirect(`/assets/${data.id}`);
}

export async function updateAsset(assetId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  if (profile?.role !== 'admin') return { error: 'Only an administrator can edit assets.' };

  const { data: before } = await supabase.from('assets').select('*').eq('id', assetId).single();

  const asset_type = requiredStr(formData, 'asset_type');
  if (!asset_type) return { error: 'Asset type is required.' };

  const serial_no = requiredStr(formData, 'serial_no');
  const overrideDuplicate = formData.get('override_duplicate') === 'on';
  if (serial_no && !overrideDuplicate) {
    const dup = await checkDuplicateSerial(serial_no, assetId);
    if (dup) {
      return { error: `Potential duplicate asset detected: serial number already used by ${dup.asset_code} (${dup.asset_type}). Tick "confirm this is a different asset" to proceed anyway.` };
    }
  }

  const payload = {
    asset_type,
    brand: requiredStr(formData, 'brand'),
    model: requiredStr(formData, 'model'),
    description: requiredStr(formData, 'description'),
    serial_no,
    imei: requiredStr(formData, 'imei'),
    sim_number: requiredStr(formData, 'sim_number'),
    phone_number: requiredStr(formData, 'phone_number'),
    condition: requiredStr(formData, 'condition'),
    location: requiredStr(formData, 'location'),
    department_id: requiredStr(formData, 'department_id'),
    remarks: requiredStr(formData, 'remarks'),
    updated_by: user?.id,
  };

  const { error } = await supabase.from('assets').update(payload).eq('id', assetId);
  if (error) return { error: friendlyDbError(error) };

  await logAudit(supabase, { action: 'asset_edited', entity_type: 'asset', entity_id: assetId, old_value: before, new_value: payload });
  revalidatePath('/assets');
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function assignAsset(assetId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  const employee_id = requiredStr(formData, 'employee_id');
  if (!employee_id) return { error: 'Please select an employee.' };

  const { error } = await supabase.rpc('assign_asset', {
    p_asset_id: assetId,
    p_employee_id: employee_id,
    p_issued_date: requiredStr(formData, 'issued_date'),
    p_expected_return_date: requiredStr(formData, 'expected_return_date'),
    p_issued_by: requiredStr(formData, 'issued_by'),
    p_issue_condition: requiredStr(formData, 'issue_condition'),
    p_remarks: requiredStr(formData, 'remarks'),
  });

  if (error) return { error: friendlyDbError(error) };

  revalidatePath('/assets');
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function returnAsset(assignmentId: string, assetId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();

  const { error } = await supabase.rpc('return_asset', {
    p_assignment_id: assignmentId,
    p_returned_date: requiredStr(formData, 'returned_date'),
    p_returned_to: requiredStr(formData, 'returned_to'),
    p_return_condition: requiredStr(formData, 'return_condition'),
    p_remarks: requiredStr(formData, 'remarks'),
    p_new_status: (requiredStr(formData, 'new_status') as AssetStatus) || 'available',
  });

  if (error) return { error: friendlyDbError(error) };

  revalidatePath('/assets');
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function changeAssetStatus(assetId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  const status = requiredStr(formData, 'status') as AssetStatus | null;
  if (!status) return { error: 'Please choose a status.' };

  const { error } = await supabase.rpc('change_asset_status', {
    p_asset_id: assetId,
    p_new_status: status,
    p_remarks: requiredStr(formData, 'remarks'),
  });

  if (error) return { error: friendlyDbError(error) };

  revalidatePath('/assets');
  revalidatePath(`/assets/${assetId}`);
  return { error: null, ok: true };
}
