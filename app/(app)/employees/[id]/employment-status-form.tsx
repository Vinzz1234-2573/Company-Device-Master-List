'use client';

import { useFormState } from 'react-dom';
import { resignEmployee } from '@/lib/actions/employees';
import { SubmitButton } from '@/components/submit-button';
import type { EmploymentStatus } from '@/lib/types';

export function EmploymentStatusForm({ employeeId, current }: { employeeId: string; current: EmploymentStatus }) {
  const action = resignEmployee.bind(null, employeeId);
  const [state, formAction] = useFormState(action, { error: null });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="label">Status</label>
        <select name="employment_status" defaultValue={current} className="input">
          <option value="active">Active</option>
          <option value="resigned">Resigned</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
        </select>
      </div>
      <div>
        <label className="label">Resignation Date (if applicable)</label>
        <input type="date" name="resigned_date" defaultValue={today} className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">Updated.</p>}
      <SubmitButton className="btn-secondary">Update Status</SubmitButton>
    </form>
  );
}
