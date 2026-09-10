'use client';

import { useFormState } from 'react-dom';
import { useState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import type { Asset, Department } from '@/lib/types';
import type { ActionState } from '@/lib/actions/assets';

const ASSET_TYPE_SUGGESTIONS = [
  'Laptop', 'Laptop Adapter', 'Desktop / PC', 'Monitor', 'Monitor Adapter', 'Handphone', 'Handphone Charger',
  'Simcard', 'Keyboard', 'Mouse', 'Printer', 'Camera', 'Camera Accessory', 'Tablet', 'HDMI Cable', 'Router',
  'Wifi Modem', 'Other',
];

export function AssetForm({
  action,
  asset,
  departments,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  asset?: Asset;
  departments: Department[];
}) {
  const [state, formAction] = useFormState(action, { error: null });
  const [confirmDup, setConfirmDup] = useState(false);

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Asset Type *</label>
          <input name="asset_type" list="asset-types" defaultValue={asset?.asset_type} required className="input" />
          <datalist id="asset-types">
            {ASSET_TYPE_SUGGESTIONS.map(t => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label">Brand</label>
          <input name="brand" defaultValue={asset?.brand || ''} className="input" />
        </div>
        <div>
          <label className="label">Model</label>
          <input name="model" defaultValue={asset?.model || ''} className="input" />
        </div>
        <div>
          <label className="label">Serial Number</label>
          <input name="serial_no" defaultValue={asset?.serial_no || ''} className="input" placeholder="Leave blank if not applicable" />
        </div>
        <div>
          <label className="label">IMEI</label>
          <input name="imei" defaultValue={asset?.imei || ''} className="input" placeholder="For phones / SIM devices" />
        </div>
        <div>
          <label className="label">SIM Number</label>
          <input name="sim_number" defaultValue={asset?.sim_number || ''} className="input" />
        </div>
        <div>
          <label className="label">Phone Number</label>
          <input name="phone_number" defaultValue={asset?.phone_number || ''} className="input" />
        </div>
        <div>
          <label className="label">Condition</label>
          <input name="condition" defaultValue={asset?.condition || ''} className="input" placeholder="e.g. Good, Fair, Needs repair" />
        </div>
        <div>
          <label className="label">Location</label>
          <input name="location" defaultValue={asset?.location || ''} className="input" />
        </div>
        <div>
          <label className="label">Department</label>
          <select name="department_id" defaultValue={asset?.department_id || ''} className="input">
            <option value="">— None —</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea name="description" defaultValue={asset?.description || ''} rows={2} className="input" />
      </div>
      <div>
        <label className="label">Remarks</label>
        <textarea name="remarks" defaultValue={asset?.remarks || ''} rows={2} className="input" />
      </div>

      {state?.error?.includes('Potential duplicate') && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
          <p>{state.error}</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={confirmDup} onChange={e => setConfirmDup(e.target.checked)} />
            I confirm this is a different, distinct physical asset.
          </label>
        </div>
      )}
      {state?.error && !state.error.includes('Potential duplicate') && <p className="text-sm text-red-600">{state.error}</p>}

      <input type="hidden" name="override_duplicate" value={confirmDup ? 'on' : ''} />
      <SubmitButton>{asset ? 'Save Changes' : 'Add Asset'}</SubmitButton>
    </form>
  );
}
