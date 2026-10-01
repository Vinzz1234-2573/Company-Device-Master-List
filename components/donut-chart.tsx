import Link from 'next/link';

export type DonutSegment = { label: string; value: number; color: string; href?: string };

export function DonutChart({ segments, total, centerLabel }: { segments: DonutSegment[]; total: number; centerLabel?: string }) {
  let cursor = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const start = cursor;
    const end = cursor + (seg.value / Math.max(total, 1)) * 100;
    stops.push(`${seg.color} ${start}% ${end}%`);
    cursor = end;
  }
  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : undefined;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: gradient || '#e2e8f0' }}>
        <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-white text-center">
          <strong className="text-2xl font-bold leading-none text-slate-900">{total}</strong>
          {centerLabel && <span className="mt-1 text-xs text-slate-500">{centerLabel}</span>}
        </div>
      </div>
      <ul className="min-w-[13rem] flex-1 space-y-1">
        {segments.map(seg => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          const row = (
            <div className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-slate-50">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: seg.color }} />
                <span className="truncate text-slate-700">{seg.label}</span>
              </span>
              <span className="shrink-0 font-semibold text-slate-900">
                {seg.value} <span className="font-normal text-slate-400">({pct}%)</span>
              </span>
            </div>
          );
          return <li key={seg.label}>{seg.href ? <Link href={seg.href}>{row}</Link> : row}</li>;
        })}
      </ul>
    </div>
  );
}
