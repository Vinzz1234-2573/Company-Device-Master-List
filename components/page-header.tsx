export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  icon?: (p: { className?: string }) => JSX.Element;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="icon-chip h-11 w-11 shrink-0 rounded-xl">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <span className="eyebrow-badge mb-1">{eyebrow}</span>}
          <h1 className="truncate text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
