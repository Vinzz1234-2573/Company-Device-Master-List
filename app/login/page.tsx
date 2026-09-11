import LoginForm from './login-form';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm animate-in">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-2xl shadow-sm">💼</div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue</p>
        </div>
        <div className="card p-6">
          <LoginForm next={searchParams?.next || '/dashboard'} />
        </div>
      </div>
    </div>
  );
}
