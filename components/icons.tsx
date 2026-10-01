type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function DashboardIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3.25" y="13" width="4.5" height="7.5" rx="1" />
      <rect x="9.75" y="8.5" width="4.5" height="12" rx="1" />
      <rect x="16.25" y="4" width="4.5" height="16.5" rx="1" />
    </svg>
  );
}

export function AssetsIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="11" rx="1.5" />
      <path d="M8 20h8M12 15.5V20" />
    </svg>
  );
}

export function EmployeesIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
      <circle cx="17" cy="8.5" r="2.25" />
      <path d="M15.75 11.25c1.9.3 3.4 1.9 3.9 4.25" />
    </svg>
  );
}

export function DepartmentsIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V20" />
      <path d="M14 10.5h4.5A1.5 1.5 0 0 1 20 12v8" />
      <path d="M4 20h16" />
      <path d="M7 7.5h1M10.5 7.5h1M7 11h1M10.5 11h1M7 14.5h1M10.5 14.5h1" />
      <path d="M16 14h1M16 17h1" />
    </svg>
  );
}

export function AssignmentsIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 7h11.5M15.5 7 12.5 4M15.5 7l-3 3" />
      <path d="M20 17H8.5M8.5 17l3 3M8.5 17l3-3" />
    </svg>
  );
}

export function ReportsIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M7 3.5h7l4 4V19.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V7.5a1 1 0 0 0 1 1H19" />
      <path d="m8.5 14.5 2.25-2.5 2 1.75L16.5 10" />
    </svg>
  );
}

export function VerificationIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3.5 21 19.5H3L12 3.5Z" />
      <path d="M12 10v3.5" />
      <circle cx="12" cy="16.25" r="0.1" fill="currentColor" stroke="none" />
      <path d="M12 16.1v.1" strokeWidth="2.5" />
    </svg>
  );
}

export function AuditLogsIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M7 3.5h8l3 3V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M15 3.5V7h3.5" />
      <path d="M9 11.5h6M9 14.5h6M9 17.5h3.5" />
    </svg>
  );
}

export function UsersIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c.8-4 3.6-6.5 7.5-6.5s6.7 2.5 7.5 6.5" />
    </svg>
  );
}

export function BellIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6 10a6 6 0 1 1 12 0c0 3.2 1 5 1.8 6.2a.6.6 0 0 1-.5.8H4.7a.6.6 0 0 1-.5-.8C5 15 6 13.2 6 10Z" />
      <path d="M9.75 19.5a2.25 2.25 0 0 0 4.5 0" />
    </svg>
  );
}

export function TagIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M11.5 4h5.69a1 1 0 0 1 .7.3l2.12 2.12a1 1 0 0 1 .3.7V13a1 1 0 0 1-.3.7l-8.5 8.5a1 1 0 0 1-1.42 0l-6.8-6.8a1 1 0 0 1 0-1.42l8.5-8.5a1 1 0 0 1 .7-.3Z" />
      <circle cx="16.25" cy="8.75" r="1.1" />
    </svg>
  );
}

export function FolderIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4.2a1.5 1.5 0 0 1 1.1.48L11.8 7H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5Z" />
    </svg>
  );
}

export function ClockIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function GiftIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3.5" y="9.5" width="17" height="4" rx="0.75" />
      <rect x="4.5" y="13.5" width="15" height="7" rx="0.75" />
      <path d="M12 9.5V20.5" />
      <path d="M12 9.5C12 9.5 8.5 9.5 7.75 7.5C7.2 6 8.3 4.5 9.75 4.5C11.2 4.5 12 6.5 12 9.5Z" />
      <path d="M12 9.5C12 9.5 15.5 9.5 16.25 7.5C16.8 6 15.7 4.5 14.25 4.5C12.8 4.5 12 6.5 12 9.5Z" />
    </svg>
  );
}

export function PaperclipIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M17.5 8.25 9.75 16a2.75 2.75 0 1 1-3.89-3.89l8-8a1.95 1.95 0 1 1 2.76 2.76l-7.65 7.65a1.1 1.1 0 1 1-1.56-1.56l6.9-6.9" />
    </svg>
  );
}

export function FilterIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 5h16M7 12h10M10.5 19h3" />
    </svg>
  );
}

export function CalendarIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </svg>
  );
}

export function PinIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 21s7-6.1 7-11.5a7 7 0 1 0-14 0C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

export function CoinIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M14.75 9.75c0-1.24-1.23-2.25-2.75-2.25s-2.75.9-2.75 2c0 3 5.5 1.5 5.5 4.5 0 1.1-1.23 2-2.75 2s-2.75-1.01-2.75-2.25" />
    </svg>
  );
}

export function AlertCircleIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.75v5" />
      <path d="M12 16.1v.1" strokeWidth="2.5" />
    </svg>
  );
}

export function InfoIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.9v.1" strokeWidth="2.5" />
    </svg>
  );
}

export function ChevronRightIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
