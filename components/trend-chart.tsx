export type TrendSeries = { key: string; label: string; color: string };
export type TrendPoint = { label: string; values: Record<string, number> };

export function TrendChart({ points, series, height = 200 }: { points: TrendPoint[]; series: TrendSeries[]; height?: number }) {
  const width = 600;
  const padding = 20;
  const maxVal = Math.max(1, ...points.flatMap(p => series.map(s => p.values[s.key] || 0)));
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const toXY = (i: number, v: number): [number, number] => {
    const x = padding + i * stepX;
    const y = height - padding - (v / maxVal) * (height - padding * 2);
    return [x, y];
  };

  const allZero = points.every(p => series.every(s => (p.values[s.key] || 0) === 0));

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {[0, 0.5, 1].map(f => {
          const y = padding + f * (height - padding * 2);
          return <line key={f} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#eef2f7" strokeWidth={1} />;
        })}
        {!allZero &&
          series.map(s => (
            <polyline
              key={s.key}
              points={points.map((p, i) => toXY(i, p.values[s.key] || 0).join(',')).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
      </svg>
      {allZero ? (
        <p className="mt-2 text-center text-sm text-slate-400">No activity recorded in this period.</p>
      ) : (
        <div className="mt-1 flex justify-between px-1 text-[11px] text-slate-400">
          {points.map((p, i) => {
            const show = i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2);
            return <span key={i}>{show ? p.label : ''}</span>;
          })}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {series.map(s => (
          <span key={s.key} className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
