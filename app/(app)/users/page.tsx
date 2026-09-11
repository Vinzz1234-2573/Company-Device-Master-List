import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/current-user';
import { InviteUserForm } from './invite-user-form';
import { UserRow } from './user-row';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const supabase = createClient();
  const me = await getCurrentProfile();
  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at');

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-900">Users</h1>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Create User</h2>
        <InviteUserForm />
      </section>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(profiles || []).map(p => (
              <UserRow key={p.id} profile={p} isSelf={p.id === me?.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
