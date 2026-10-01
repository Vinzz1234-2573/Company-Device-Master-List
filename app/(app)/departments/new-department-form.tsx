'use client';

import { useFormState } from 'react-dom';
import { createDepartment } from '@/lib/actions/departments';
import { SubmitButton } from '@/components/submit-button';

export function NewDepartmentForm() {
  const [state, formAction] = useFormState(createDepartment, { error: null });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="w-32 shrink-0">
        <label className="label">Code *</label>
        <input name="code" required maxLength={10} className="input" placeholder="e.g. IT" />
      </div>
      <div className="flex-1 min-w-[12rem]">
        <label className="label">Name *</label>
        <input name="name" required className="input" placeholder="e.g. IT Department" />
      </div>
      <SubmitButton>Add</SubmitButton>
      {state?.error && <p className="text-sm text-red-600 w-full">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600 w-full">Department added.</p>}
    </form>
  );
}
