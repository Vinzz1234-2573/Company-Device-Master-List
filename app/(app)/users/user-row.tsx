'use client';

import { useTransition } from 'react';
import { setUserRole, setUserActive } from '@/lib/actions/users';
import type { Profile, UserRole } from '@/lib/types';

export function UserRow({
  profile,
  isSelf,
  lastSignInAt,
}: {
  profile: Profile;
  isSelf: boolean;
  lastSignInAt: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr>
      <td data-label="Name" className="font-medium">
        {profile.full_name || '—'}
        {isSelf && <span className="text-xs text-slate-400 ml-1">(you)</span>}
      </td>
      <td data-label="Email">{profile.email}</td>
      <td data-label="Role">
        <select
          defaultValue={profile.role}
          disabled={isPending || isSelf}
          className="input"
          onChange={e => {
            const role = e.target.value as UserRole;
            startTransition(async () => {
              await setUserRole(profile.id, role);
            });
          }}
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Administrator</option>
        </select>
      </td>
      <td data-label="Status">
        {profile.is_active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Deactivated</span>}
      </td>
      <td data-label="Last Login" className="whitespace-nowrap text-slate-500">
        {lastSignInAt ? new Date(lastSignInAt).toLocaleString() : <span className="text-slate-300">Never signed in</span>}
      </td>
      <td data-label="">
        <button
          className="text-sm text-slate-500 hover:underline disabled:opacity-50"
          disabled={isPending || isSelf}
          onClick={() =>
            startTransition(async () => {
              await setUserActive(profile.id, !profile.is_active);
            })
          }
        >
          {profile.is_active ? 'Deactivate' : 'Reactivate'}
        </button>
      </td>
    </tr>
  );
}
