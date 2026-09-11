'use client';

import { useFormState } from 'react-dom';
import { inviteUser } from '@/lib/actions/users';
import { SubmitButton } from '@/components/submit-button';

function randomPassword() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8).toUpperCase() + '!1';
}

export function InviteUserForm() {
  const [state, formAction] = useFormState(inviteUser, { error: null });

  return (
    <form action={formAction} className="grid sm:grid-cols-2 gap-3 items-end">
      <div>
        <label className="label">Full Name</label>
        <input name="full_name" className="input" required />
      </div>
      <div>
        <label className="label">Email *</label>
        <input type="email" name="email" className="input" required />
      </div>
      <div>
        <label className="label">Role *</label>
        <select name="role" defaultValue="staff" className="input">
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      <div>
        <label className="label">Temporary Password *</label>
        <input name="temp_password" className="input" required minLength={8} defaultValue={randomPassword()} />
      </div>
      <div className="sm:col-span-2 flex flex-col gap-2">
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-emerald-600">User created. Share the email and temporary password with them securely.</p>}
        <SubmitButton className="btn-primary w-fit">Create User</SubmitButton>
      </div>
    </form>
  );
}
