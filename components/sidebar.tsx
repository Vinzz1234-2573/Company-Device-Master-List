'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/lib/types';
import {
  DashboardIcon,
  AssetsIcon,
  EmployeesIcon,
  DepartmentsIcon,
  AssignmentsIcon,
  ReportsIcon,
  VerificationIcon,
  AuditLogsIcon,
  UsersIcon,
} from '@/components/icons';

type NavItem = { href: string; label: string; icon: (p: { className?: string }) => JSX.Element; roles: UserRole[] };

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ href: '/dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['admin', 'manager', 'staff'] }],
  },
  {
    label: 'Asset Management',
    items: [
      { href: '/assets', label: 'Assets', icon: AssetsIcon, roles: ['admin', 'manager', 'staff'] },
      { href: '/employees', label: 'Employees', icon: EmployeesIcon, roles: ['admin', 'manager', 'staff'] },
      { href: '/departments', label: 'Departments', icon: DepartmentsIcon, roles: ['admin'] },
      { href: '/assignments', label: 'Assignments', icon: AssignmentsIcon, roles: ['admin', 'manager', 'staff'] },
    ],
  },
  {
    label: 'Insights & Admin',
    items: [
      { href: '/reports', label: 'Reports', icon: ReportsIcon, roles: ['admin', 'manager', 'staff'] },
      { href: '/verification', label: 'Data Verification', icon: VerificationIcon, roles: ['admin'] },
      { href: '/audit-logs', label: 'Audit Logs', icon: AuditLogsIcon, roles: ['admin'] },
      { href: '/users', label: 'Users', icon: UsersIcon, roles: ['admin'] },
    ],
  },
];

export function Sidebar({ role, className = '' }: { role: UserRole; className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={`flex flex-col gap-5 ${className}`}>
      {NAV_GROUPS.map((group, i) => {
        const items = group.items.filter(item => item.roles.includes(role));
        if (items.length === 0) return null;
        return (
          <div key={i} className="flex flex-col gap-0.5">
            {group.label && (
              <p className="px-3.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-300/70">{group.label}</p>
            )}
            {items.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-navy-100/80 hover:bg-white/5 hover:text-white hover:translate-x-0.5'
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-brand-400 to-gold-400 transition-opacity duration-150 ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? 'text-gold-400' : 'text-navy-200 group-hover:text-gold-400'}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
