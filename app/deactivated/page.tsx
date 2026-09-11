import { signOut } from '@/lib/actions/auth';

export default function DeactivatedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="card p-6 max-w-sm text-center space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Account Deactivated</h1>
        <p className="text-sm text-slate-500">
          Your account has been deactivated. Please contact your system administrator if you believe this is a mistake.
        </p>
        <form action={signOut}>
          <button type="submit" className="btn-secondary w-full">
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
