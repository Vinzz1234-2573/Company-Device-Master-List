'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/lib/types';

const NAV: { href: string; label: string; roles: UserRole[] }[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ['admin', 'manager', 'staff'] },
  { href: '/assets', label: 'Assets', roles: ['admin', 'manager', 'staff'] },
  { href: '/employees', label: 'Employees', roles: ['admin', 'manager', 'staff'] },
  { href: '/departments', label: 'Departments', roles: ['admin'] },
  { href: '/assignments', label: 'Assignments', roles: ['admin', 'manager', 'staff'] },
  { href: '/reports', label: 'Reports', roles: ['admin', 'manager', 'staff'] },
  { href: '/verification', label: 'Data Verification', roles: ['admin'] },
  { href: '/audit-logs', label: 'Audit Logs', roles: ['admin'] },
  { href: '/users', label: 'Users', roles: ['admin'] },
];

export function Sidebar({ role, className = '' }: { role: UserRole; className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={`flex flex-col gap-1 ${className}`}>
      {NAV.filter(item => item.roles.includes(role)).map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
