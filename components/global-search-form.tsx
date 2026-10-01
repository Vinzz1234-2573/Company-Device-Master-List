'use client';

import { useRouter } from 'next/navigation';

export function GlobalSearchForm() {
  const router = useRouter();
  return (
    <form
      className="min-w-0 flex-1 max-w-md"
      onSubmit={e => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get('q');
        router.push(`/assets?q=${encodeURIComponent(String(q || ''))}`);
      }}
    >
      <input
        name="q"
        type="search"
        placeholder="Search assets by type, brand, serial…"
        className="input"
      />
    </form>
  );
}
