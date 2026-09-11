'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/lib/types';

const NAV: { href: string; label: string; icon: string; roles: UserRole[] }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'manager', 'staff'] },
  { href: '/assets', label: 'Assets', icon: '💻', roles: ['admin', 'manager', 'staff'] },
  { href: '/employees', label: 'Employees', icon: '👥', roles: ['admin', 'manager', 'staff'] },
  { href: '/departments', label: 'Departments', icon: '🏢', roles: ['admin'] },
  { href: '/assignments', label: 'Assignments', icon: '🔄', roles: ['admin', 'manager', 'staff'] },
  { href: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'manager', 'staff'] },
  { href: '/verification', label: 'Data Verification', icon: '⚠️', roles: ['admin'] },
  { href: '/audit-logs', label: 'Audit Logs', icon: '📜', roles: ['admin'] },
  { href: '/users', label: 'Users', icon: '👤', roles: ['admin'] },
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
            className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
              active ? 'bg-brand-600 text-white shadow-sm' : 'text-navy-100 hover:bg-navy-700 hover:text-white hover:translate-x-0.5'
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
