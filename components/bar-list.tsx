import Link from 'next/link';

export type BarListItem = { label: string; value: number; href?: string };

export function BarList({ items, colorClass = 'bg-brand-500' }: { items: BarListItem[]; colorClass?: string }) {
  const max = Math.max(1, ...items.map(i => i.value));

  if (items.length === 0) return <p className="text-sm text-slate-400">No data yet.</p>;

  return (
    <ul className="space-y-3">
      {items.map(item => {
        const pct = Math.round((item.value / max) * 100);
        const row = (
          <div>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-slate-700">{item.label}</span>
              <span className="shrink-0 font-semibold text-slate-900">{item.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
        return (
          <li key={item.label}>
            {item.href ? (
              <Link href={item.href} className="-mx-1 block rounded-lg px-1 py-0.5 transition-colors hover:bg-slate-50">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}
