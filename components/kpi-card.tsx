import Link from 'next/link';

const TONE_CLASSES: Record<string, string> = {
  default: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  slate: 'bg-slate-100 text-slate-500',
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'default',
  href,
}: {
  icon: (p: { className?: string }) => JSX.Element;
  label: string;
  value: number | string;
  sub?: string;
  tone?: keyof typeof TONE_CLASSES;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md h-full">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <span className="block text-sm text-slate-500">{label}</span>
        <strong className="block text-3xl leading-none text-slate-900 mb-1.5">{value}</strong>
        {sub && <small className="text-xs text-slate-400">{sub}</small>}
      </div>
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/40">
      {content}
    </Link>
  );
}
