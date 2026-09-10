'use client';

import { useFormState } from 'react-dom';
import { returnAsset } from '@/lib/actions/assets';
import { SubmitButton } from '@/components/submit-button';

export function ReturnForm({ assignmentId, assetId }: { assignmentId: string; assetId: string }) {
  const action = returnAsset.bind(null, assignmentId, assetId);
  const [state, formAction] = useFormState(action, { error: null });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="card p-4 space-y-4">
      <div>
        <label className="label">Return Date *</label>
        <input type="date" name="returned_date" defaultValue={today} required className="input" />
      </div>
      <div>
        <label className="label">Returned To</label>
        <input name="returned_to" className="input" placeholder="Your name" />
      </div>
      <div>
        <label className="label">Condition When Returned</label>
        <input name="return_condition" className="input" placeholder="e.g. Good, Damaged screen" />
      </div>
      <div>
        <label className="label">New Asset Status *</label>
        <select name="new_status" defaultValue="available" className="input" required>
          <option value="available">Available — ready to reassign</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="damaged">Damaged</option>
          <option value="lost">Lost / Missing</option>
          <option value="retired">Retired</option>
          <option value="disposed">Disposed</option>
        </select>
      </div>
      <div>
        <label className="label">Remarks</label>
        <textarea name="remarks" rows={2} className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton>Return Asset</SubmitButton>
    </form>
  );
}
