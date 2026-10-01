'use client';

import { useState } from 'react';
import type { UserRole } from '@/lib/types';
import { Sidebar } from './sidebar';
import { LogoMark } from './logo-mark';

export function MobileNav({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex w-64 max-w-[80vw] flex-col bg-gradient-to-b from-navy-800 to-navy-900 shadow-2xl">
            <div className="gamut-accent-bar" />
            <div className="flex-1 p-4">
              <div className="mb-6 flex items-center justify-between">
                <LogoMark theme="dark" />
                <button aria-label="Close navigation menu" onClick={() => setOpen(false)} className="text-navy-100">
                  ✕
                </button>
              </div>
              <div onClick={() => setOpen(false)}>
                <Sidebar role={role} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
