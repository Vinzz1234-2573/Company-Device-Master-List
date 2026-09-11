'use client';

import { useTransition } from 'react';
import { setUserRole, setUserActive } from '@/lib/actions/users';
import type { Profile, UserRole } from '@/lib/types';

export function UserRow({ profile, isSelf }: { profile: Profile; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr>
      <td className="font-medium">{profile.full_name || '—'}</td>
      <td>{profile.email}</td>
      <td>
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
      <td>{profile.is_active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Deactivated</span>}</td>
      <td>
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
