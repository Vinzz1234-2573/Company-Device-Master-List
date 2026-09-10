'use client';

import { useFormState } from 'react-dom';
import { SubmitButton } from '@/components/submit-button';
import type { Employee, Department } from '@/lib/types';
import type { ActionState } from '@/lib/actions/assets';

export function EmployeeForm({
  action,
  employee,
  departments,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  employee?: Employee;
  departments: Department[];
}) {
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input name="name" defaultValue={employee?.name} required className="input" />
        </div>
        <div>
          <label className="label">Employee No.</label>
          <input name="employee_no" defaultValue={employee?.employee_no || ''} className="input" />
        </div>
        <div>
          <label className="label">Job Title</label>
          <input name="job_title" defaultValue={employee?.job_title || ''} className="input" />
        </div>
        <div>
          <label className="label">Department</label>
          <select name="department_id" defaultValue={employee?.department_id || ''} className="input">
            <option value="">— None —</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" name="email" defaultValue={employee?.email || ''} className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" defaultValue={employee?.phone || ''} className="input" />
        </div>
        <div>
          <label className="label">Date Joined</label>
          <input type="date" name="joined_date" defaultValue={employee?.joined_date || ''} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Remarks</label>
        <textarea name="remarks" defaultValue={employee?.remarks || ''} rows={2} className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton>{employee ? 'Save Changes' : 'Add Employee'}</SubmitButton>
    </form>
  );
}
