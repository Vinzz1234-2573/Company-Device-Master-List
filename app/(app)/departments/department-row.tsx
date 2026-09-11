'use client';

import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { renameDepartment, toggleDepartmentActive } from '@/lib/actions/departments';
import { SubmitButton } from '@/components/submit-button';
import type { Department } from '@/lib/types';

export function DepartmentRow({ department, assetCount }: { department: Department; assetCount: number }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const action = renameDepartment.bind(null, department.id);
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <tr>
      <td className="font-medium">{department.code}</td>
      <td>
        {editing ? (
          <form
            action={formData => {
              formAction(formData);
              setEditing(false);
            }}
            className="flex gap-2"
          >
            <input name="name" defaultValue={department.name} className="input" />
            <SubmitButton className="btn-secondary">Save</SubmitButton>
          </form>
        ) : (
          department.name
        )}
      </td>
      <td>{assetCount}</td>
      <td>{department.is_active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}</td>
      <td className="space-x-3 whitespace-nowrap">
        {!editing && (
          <button className="text-brand-600 hover:underline text-sm" onClick={() => setEditing(true)}>
            Rename
          </button>
        )}
        <button
          className="text-sm text-slate-500 hover:underline disabled:opacity-50"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await toggleDepartmentActive(department.id, !department.is_active);
            })
          }
        >
          {department.is_active ? 'Deactivate' : 'Reactivate'}
        </button>
      </td>
      {state?.error && (
        <td colSpan={5} className="text-red-600 text-sm">
          {state.error}
        </td>
      )}
    </tr>
  );
}
