import Image from 'next/image';

export function Footer() {
  return (
    <footer className="mt-8 flex flex-col items-center gap-2 border-t border-slate-200 py-6 text-center no-print">
      <Image src="/gamutpro-logo.png" alt="GamutPro" width={110} height={39} className="opacity-80" />
      <p className="text-xs text-slate-400">
        © {new Date().getFullYear()} GamutPro · Asset Manager — internal use only
      </p>
    </footer>
  );
}
