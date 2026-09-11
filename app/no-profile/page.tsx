import { signOut } from '@/lib/actions/auth';

export default function NoProfilePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="card p-6 max-w-md text-center space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Account Setup Incomplete</h1>
        <p className="text-sm text-slate-500">
          You're signed in, but this account doesn't have a matching profile record yet, so it can't be linked to a
          role (Admin/Manager/Staff). This usually happens when an account was created directly in Supabase without
          the profile row being set up alongside it.
        </p>
        <p className="text-sm text-slate-500">
          Ask an administrator to run this in the Supabase SQL editor, using your email address:
        </p>
        <pre className="text-left text-xs bg-slate-50 border border-slate-200 rounded-md p-3 overflow-x-auto">
          {`insert into profiles (id, email, full_name, role)
select id, email, '', 'admin' from auth.users where email = 'your-email@example.com'
on conflict (id) do update set role = 'admin';`}
        </pre>
        <form action={signOut}>
          <button type="submit" className="btn-secondary w-full">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
