import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/deactivated', '/no-profile'];
const ADMIN_ONLY_PREFIXES = ['/departments', '/users', '/audit-logs'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = path === '/' || PUBLIC_PATHS.some(p => path.startsWith(p));

  function redirectTo(pathname: string, extra?: (url: URL) => void) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = '';
    extra?.(url);
    return NextResponse.redirect(url);
  }

  if (!user && !isPublic) {
    return redirectTo('/login', url => url.searchParams.set('next', path));
  }

  // Fetch the profile once per request — everything below depends on it, and
  // fetching it multiple times (once per rule) is exactly what caused the
  // earlier login<->dashboard infinite redirect: this route would bounce an
  // authenticated-but-profile-less user to /dashboard, which would then bounce
  // them straight back to /login, forever.
  let profile: { role: string; is_active: boolean } | null = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).maybeSingle();
    profile = data;
  }

  // Authenticated, but no matching profiles row (or it errored out) — this is
  // a broken/incomplete account, not a normal "logged out" state. Send it to a
  // dedicated page exactly once instead of looping between /login and
  // /dashboard forever.
  if (user && !profile && path !== '/no-profile') {
    return redirectTo('/no-profile');
  }

  if (user && profile && path === '/login') {
    return redirectTo('/dashboard');
  }

  if (user && profile?.is_active === false && path !== '/deactivated') {
    return redirectTo('/deactivated');
  }

  if (user && profile && ADMIN_ONLY_PREFIXES.some(p => path.startsWith(p)) && profile.role !== 'admin') {
    return redirectTo('/dashboard');
  }

  return response;
}
