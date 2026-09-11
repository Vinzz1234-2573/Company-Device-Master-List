import { createBrowserClient } from '@supabase/ssr';

// Not parameterized with the hand-written Database type: without types generated
// by `supabase gen types typescript`, PostgREST's nested `.select('*, foo(...)')`
// join overloads cannot be resolved against a manually written generic and every
// query result collapses to `never`. Shape query results with the interfaces in
// lib/types.ts instead (see the Database type there for the enums/RPC signatures).
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
