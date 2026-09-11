import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600">
      <div className="gamut-accent-bar" />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center animate-in">
          <Image
            src="/gamutpro-icon.png"
            alt="GamutPro"
            width={64}
            height={64}
            className="mx-auto mb-6"
            priority
          />
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            Internal System
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            GamutPro Asset Manager
          </h1>
          <p className="mt-3 text-slate-300">
            Track laptops, phones, and equipment across the company — who has what, and its full history — in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-brand-700"
            >
              Enter Asset Manager →
            </Link>
            <a
              href="https://gamutpro.my"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-all duration-150 hover:-translate-y-px hover:bg-white/10"
            >
              Visit gamutpro.my
            </a>
          </div>
          <p className="mt-8 text-xs text-slate-400">
            No account? Ask your administrator to create one for you.
          </p>
        </div>
      </div>
    </div>
  );
}
