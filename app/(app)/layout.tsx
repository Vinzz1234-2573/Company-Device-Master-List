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
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-navy-800">
        <div className="gamut-accent-bar" />
        <div className="p-4">
          <div className="mb-6 px-1">
            <LogoMark theme="dark" />
          </div>
          <Sidebar role={profile.role} />
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
