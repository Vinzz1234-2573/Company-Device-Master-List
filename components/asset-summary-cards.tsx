const BUCKETS = [
  { key: 'inUse', label: 'In Use', icon: '✓', sub: 'Assets assigned to staff', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { key: 'available', label: 'Available', icon: '↗', sub: 'Returned & ready to reassign', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { key: 'inStock', label: 'In Stock', icon: '▣', sub: 'New / unused inventory', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { key: 'other', label: 'Other', icon: '!', sub: 'Maintenance, damaged, retired…', iconBg: 'bg-slate-100', iconColor: 'text-slate-500' },
] as const;

export function AssetSummaryCards({ counts, total }: { counts: Record<string, number>; total: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {BUCKETS.map(b => {
        const value = counts[b.key] || 0;
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <div
            key={b.key}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${b.iconBg} ${b.iconColor}`}>
              {b.icon}
            </div>
            <div className="min-w-0">
              <span className="block text-sm text-slate-500">{b.label}</span>
              <strong className="block text-3xl leading-none text-slate-900 mb-1.5">{value}</strong>
              <small className="text-xs text-slate-400">
                {b.sub} · {pct}%
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const BAR_COLORS: Record<string, string> = {
  inUse: 'bg-emerald-500',
  available: 'bg-blue-500',
  inStock: 'bg-amber-500',
  other: 'bg-slate-400',
};

export function AssetDistributionBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  if (total === 0) return <p className="text-sm text-slate-400">No assets yet.</p>;
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {BUCKETS.map(b => {
          const value = counts[b.key] || 0;
          const pct = (value / total) * 100;
          if (pct <= 0) return null;
          return <div key={b.key} className={BAR_COLORS[b.key]} style={{ width: `${pct}%` }} title={`${b.label}: ${value}`} />;
        })}
      </div>
      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
        {BUCKETS.map(b => {
          const value = counts[b.key] || 0;
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <li key={b.key} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${BAR_COLORS[b.key]}`} />
              {b.label} — {value} ({pct}%)
            </li>
          );
        })}
      </ul>
    </div>
  );
}
