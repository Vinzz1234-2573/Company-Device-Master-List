import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/current-user';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-slate-900 p-4">
        <div className="mb-6 px-2">
          <p className="text-lg font-bold text-white">Asset Manager</p>
        </div>
        <Sidebar role={profile.role} />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar profile={profile} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
