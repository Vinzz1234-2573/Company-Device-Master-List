import { signOut } from '@/lib/actions/auth';
import { RoleBadge } from '@/components/badge';
import type { Profile } from '@/lib/types';
import { GlobalSearchForm } from './global-search-form';
import { MobileNav } from './mobile-nav';

export function Topbar({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-3 shadow-sm backdrop-blur-md md:px-6">
      <MobileNav role={profile.role} />
      <GlobalSearchForm />
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-medium text-slate-800">{profile.full_name || profile.email}</span>
          <RoleBadge role={profile.role} />
        </div>
        <form action={signOut}>
          <button type="submit" className="btn-ghost">
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
