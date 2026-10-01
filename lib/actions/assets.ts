'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logAudit, friendlyDbError } from '@/lib/audit';
import type { AcquisitionType, AssetStatus } from '@/lib/types';

export type ActionState = { error: string | null; ok?: boolean };

const PLACEHOLDER_SERIAL = /^(na|n\/a|n\.a\.?|-|nil|none|_)?$/i;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB per supporting document

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

type DonationFields = {
  acquisition_type: AcquisitionType;
  quantity: number;
  donor_name: string | null;
  donation_value: number | null;
  donation_received_date: string | null;
};

function parseDonationFields(formData: FormData): DonationFields | { error: string } {
  const acquisitionRaw = requiredStr(formData, 'acquisition_type') || 'purchased';
  if (acquisitionRaw !== 'purchased' && acquisitionRaw !== 'donation_in_kind') {
    return { error: 'Invalid acquisition type.' };
  }
  const acquisition_type = acquisitionRaw as AcquisitionType;

  const quantityRaw = requiredStr(formData, 'quantity');
  const quantity = quantityRaw ? parseInt(quantityRaw, 10) : 1;
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: 'Quantity must be a whole number of at least 1.' };
  }

  if (acquisition_type === 'purchased') {
    return { acquisition_type, quantity, donor_name: null, donation_value: null, donation_received_date: null };
  }

  const donor_name = requiredStr(formData, 'donor_name');
  if (!donor_name) return { error: 'Donor name is required for a Donation in Kind asset.' };

  const valueRaw = requiredStr(formData, 'donation_value');
  let donation_value: number | null = null;
  if (valueRaw) {
    donation_value = Number(valueRaw);
    if (!Number.isFinite(donation_value) || donation_value < 0) {
      return { error: 'Estimated value must be a positive number.' };
    }
  }

  return { acquisition_type, quantity, donor_name, donation_value, donation_received_date: requiredStr(formData, 'donation_received_date') };
}

function readDocumentFiles(formData: FormData, fieldName: string): File[] | { error: string } {
  const files = formData.getAll(fieldName).filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      return { error: `"${file.name}" is too large (max 10MB per file).` };
    }
  }
  return files;
}

async function uploadAssetDocuments(
  supabase: ReturnType<typeof createClient>,
  assetId: string,
  files: File[],
  uploadedBy: string | undefined
) {
  for (const file of files) {
    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
    const storagePath = `${assetId}/${crypto.randomUUID()}${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('asset-documents')
      .upload(storagePath, file, { contentType: file.type || 'application/octet-stream' });
    if (uploadError) continue; // best-effort: the asset record itself is already saved

    await supabase.from('asset_documents').insert({
      asset_id: assetId,
      file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      content_type: file.type || null,
      uploaded_by: uploadedBy ?? null,
    });
  }
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

  const donationFields = parseDonationFields(formData);
  if ('error' in donationFields) return { error: donationFields.error };

  const documentFiles = readDocumentFiles(formData, 'supporting_documents');
  if ('error' in documentFiles) return { error: documentFiles.error };

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
    ...donationFields,
    created_by: user?.id,
    updated_by: user?.id,
  };

  const { data, error } = await supabase.from('assets').insert(payload).select('id').single();
  if (error) return { error: friendlyDbError(error) };

  if (documentFiles.length > 0) await uploadAssetDocuments(supabase, data.id, documentFiles, user?.id);

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

  const donationFields = parseDonationFields(formData);
  if ('error' in donationFields) return { error: donationFields.error };

  const documentFiles = readDocumentFiles(formData, 'supporting_documents');
  if ('error' in documentFiles) return { error: documentFiles.error };

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
    ...donationFields,
    updated_by: user?.id,
  };

  const { error } = await supabase.from('assets').update(payload).eq('id', assetId);
  if (error) return { error: friendlyDbError(error) };

  if (documentFiles.length > 0) await uploadAssetDocuments(supabase, assetId, documentFiles, user?.id);

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

export async function uploadAssetDocument(assetId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  if (profile?.role !== 'admin') return { error: 'Only an administrator can upload documents.' };

  const files = readDocumentFiles(formData, 'file');
  if ('error' in files) return { error: files.error };
  if (files.length === 0) return { error: 'Please choose a file to upload.' };

  await uploadAssetDocuments(supabase, assetId, files, user?.id);
  await logAudit(supabase, {
    action: 'asset_document_uploaded',
    entity_type: 'asset',
    entity_id: assetId,
    new_value: { files: files.map(f => f.name) },
  });

  revalidatePath(`/assets/${assetId}`);
  return { error: null, ok: true };
}

export async function deleteAssetDocument(assetId: string, documentId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  if (profile?.role !== 'admin') return;

  const { data: doc } = await supabase.from('asset_documents').select('*').eq('id', documentId).eq('asset_id', assetId).single();
  if (!doc) return;

  await supabase.storage.from('asset-documents').remove([doc.storage_path]);
  await supabase.from('asset_documents').delete().eq('id', documentId);

  await logAudit(supabase, { action: 'asset_document_deleted', entity_type: 'asset', entity_id: assetId, old_value: doc });
  revalidatePath(`/assets/${assetId}`);
}

export async function getAssetDocumentUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from('asset-documents').createSignedUrl(storagePath, 300);
  return data?.signedUrl ?? null;
}
