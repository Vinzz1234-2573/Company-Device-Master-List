import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/current-user';
import { InviteUserForm } from './invite-user-form';
import { UserRow } from './user-row';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const supabase = createClient();
  const me = await getCurrentProfile();
  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at');

  // last_sign_in_at lives on auth.users, not our profiles table, so it needs
  // the admin API — this is the one place in the app that lists every
  // account's login activity, which is exactly what "who is using this
  // system" needs to answer.
  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const lastSignInById = new Map((authUsers?.users || []).map(u => [u.id, u.last_sign_in_at]));

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-bold text-slate-900">Users</h1>
      <p className="text-sm text-slate-500">
        Every account below has its own login. Nobody can view or change any asset without signing in, and every action
        they take is recorded in the Audit Log with their email.
      </p>

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
              <th>Last Login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(profiles || []).map(p => (
              <UserRow key={p.id} profile={p} isSelf={p.id === me?.id} lastSignInAt={lastSignInById.get(p.id) || null} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
