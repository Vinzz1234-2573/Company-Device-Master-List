'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { renameDepartment, toggleDepartmentActive } from '@/lib/actions/departments';
import { SubmitButton } from '@/components/submit-button';
import type { Department } from '@/lib/types';

export function DepartmentRow({ department, assetCount }: { department: Department; assetCount: number }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const action = renameDepartment.bind(null, department.id);
  const [state, formAction] = useFormState(action, { error: null });

  // Only close the inline rename form once the save actually succeeds, so a
  // validation error (e.g. empty name) stays visible with the input still open
  // to fix, instead of silently reverting to the read-only name.
  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  return (
    <>
      <tr>
        <td data-label="Code" className="font-medium">
          {department.code}
        </td>
        <td data-label="Name" className="td-block">
          {editing ? (
            <form action={formAction} className="flex gap-2">
              <input name="name" defaultValue={department.name} className="input" />
              <SubmitButton className="btn-secondary">Save</SubmitButton>
            </form>
          ) : (
            department.name
          )}
        </td>
        <td data-label="Assets">{assetCount}</td>
        <td data-label="Status">
          {department.is_active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}
        </td>
        <td data-label="" className="space-x-3 whitespace-nowrap">
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
      </tr>
      {state?.error && (
        <tr>
          <td colSpan={5} data-label="" className="td-block text-red-600 text-sm">
            {state.error}
          </td>
        </tr>
      )}
    </>
  );
}
