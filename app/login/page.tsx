import LoginForm from './login-form';
import { LogoMark } from '@/components/logo-mark';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600">
      <div className="gamut-accent-bar" />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-in">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              <LogoMark theme="dark" />
            </div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
              Secure Sign In
            </span>
            <h1 className="text-2xl font-bold text-white">Asset Manager</h1>
            <p className="text-sm text-slate-300 mt-1">Sign in with your GamutPro account to continue</p>
          </div>
          <div className="card p-6">
            <LoginForm next={searchParams?.next || '/dashboard'} />
          </div>
        </div>
      </div>
    </div>
  );
}
