'use client';

import { useFormState } from 'react-dom';
import { changeAssetStatus } from '@/lib/actions/assets';
import { SubmitButton } from '@/components/submit-button';
import type { AssetStatus } from '@/lib/types';

const OPTIONS: AssetStatus[] = [
  'available',
  'assigned',
  'under_maintenance',
  'lost',
  'damaged',
  'retired',
  'disposed',
  'pending_verification',
];

export function StatusChangeForm({ assetId, currentStatus }: { assetId: string; currentStatus: AssetStatus }) {
  const action = changeAssetStatus.bind(null, assetId);
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <select name="status" defaultValue={currentStatus} className="input">
        {OPTIONS.map(o => (
          <option key={o} value={o}>
            {o.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
      <input name="remarks" className="input" placeholder="Remarks (optional)" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">Status updated.</p>}
      <SubmitButton className="btn-secondary">Update Status</SubmitButton>
    </form>
  );
}
