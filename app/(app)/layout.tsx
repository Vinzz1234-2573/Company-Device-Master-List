import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/current-user';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { LogoMark } from '@/components/logo-mark';
import { Footer } from '@/components/footer';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-gradient-to-b from-navy-800 to-navy-900">
        <div className="gamut-accent-bar" />
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-6 px-1.5">
            <LogoMark theme="dark" />
          </div>
          <Sidebar role={profile.role} className="flex-1" />
          <p className="px-3.5 pt-4 text-[11px] text-navy-300/70">v1.0 · Internal</p>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="gamut-accent-bar md:hidden" />
        <Topbar profile={profile} />
        <main className="flex-1 p-4 md:p-6 flex flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
