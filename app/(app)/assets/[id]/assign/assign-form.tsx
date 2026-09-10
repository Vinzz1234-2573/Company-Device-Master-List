'use client';

import { useFormState } from 'react-dom';
import { assignAsset } from '@/lib/actions/assets';
import { SubmitButton } from '@/components/submit-button';

export function AssignForm({ assetId, employees }: { assetId: string; employees: { id: string; name: string; job_title: string | null }[] }) {
  const action = assignAsset.bind(null, assetId);
  const [state, formAction] = useFormState(action, { error: null });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="card p-4 space-y-4">
      <div>
        <label className="label">Employee *</label>
        <select name="employee_id" required className="input">
          <option value="">Select employee…</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>
              {e.name} {e.job_title ? `— ${e.job_title}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date Issued *</label>
          <input type="date" name="issued_date" defaultValue={today} required className="input" />
        </div>
        <div>
          <label className="label">Expected Return Date</label>
          <input type="date" name="expected_return_date" className="input" />
        </div>
      </div>
      <div>
        <label className="label">Issued By</label>
        <input name="issued_by" className="input" placeholder="Your name" />
      </div>
      <div>
        <label className="label">Condition When Issued</label>
        <input name="issue_condition" className="input" placeholder="e.g. Good" />
      </div>
      <div>
        <label className="label">Remarks</label>
        <textarea name="remarks" rows={2} className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton>Assign Asset</SubmitButton>
    </form>
  );
}
