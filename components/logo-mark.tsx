import Image from 'next/image';

export function LogoMark({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const wordmark = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const tagline = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="flex items-center gap-2.5">
      <Image src="/gamutpro-icon.png" alt="" width={36} height={36} className="shrink-0" priority />
      <div className="leading-tight">
        <p className={`text-base font-extrabold tracking-tight ${wordmark}`}>
          gamut<span className="text-brand-400">pro</span>
        </p>
        <p className={`text-[11px] uppercase tracking-wide ${tagline}`}>Asset Manager</p>
      </div>
    </div>
  );
}
