import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/profile', '/wishlist'];
const PROTECTED_API_ROUTES = ['/api/orders/history', '/api/cart', '/api/wishlist'];

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gkskeljvgphslkzctjfp.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrc2tlbGp2Z3Boc2xremN0amZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2Nzc1MzEsImV4cCI6MjEwNDI1MzUzMX0.Ivn1_8l1j_6HM46-NcKELDIVZk5L2COUNKGmA8kIOr4';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (pathname.startsWith('/api')) {
    supabaseResponse.headers.set('Access-Control-Allow-Origin', '*');
    supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  try {
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session safely
    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user || null;
    } catch {
      user = null;
    }

    // ─────────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────
    // STRICT ADMIN ROUTE PROTECTION (/admin and /admin/*)
    // ─────────────────────────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
      const createAdminRedirect = (targetUrl) => {
        const res = NextResponse.redirect(targetUrl);
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.headers.set('Pragma', 'no-cache');
        res.headers.set('CDN-Cache-Control', 'no-store');
        res.headers.set('Vary', 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url, Accept, Accept-Encoding');
        return res;
      };

      // 1. Unauthenticated visitors: redirect immediately to login
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return createAdminRedirect(url);
      }

      // 2. Authenticated user: verify staff role (Super Admin or SEO/CMS Manager)
      const userEmail = (user.email || '').toLowerCase();
      const isMasterAdmin =
        userEmail === 'trioenterprises10@gmail.com' ||
        userEmail === 'admin@trioenterprises.com';
      const metaRole = (user.user_metadata?.role || '').toLowerCase();

      let hasStaffAccess =
        isMasterAdmin ||
        ['super_admin', 'superadmin', 'admin', 'seo_manager', 'seo', 'cms', 'csm'].includes(metaRole) ||
        metaRole.includes('seo') ||
        metaRole.includes('cms') ||
        metaRole.includes('csm');

      // If not determined via metadata or master email, check profiles table
      if (!hasStaffAccess && !isMasterAdmin) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          const dbRole = (profile?.role || '').toLowerCase();
          if (
            dbRole === 'admin' ||
            dbRole === 'super_admin' ||
            dbRole === 'seo_manager' ||
            dbRole.includes('seo') ||
            dbRole.includes('cms') ||
            dbRole.includes('csm')
          ) {
            hasStaffAccess = true;
          }
        } catch (_) {}
      }

      // Regular customer: Not permitted on /admin -> Redirect to storefront home (/)
      if (!hasStaffAccess) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.search = '';
        return createAdminRedirect(url);
      }

      // 3. SEO / CMS Manager route restrictions
      const isSeo =
        !isMasterAdmin &&
        (metaRole === 'seo_manager' ||
          metaRole === 'seo' ||
          metaRole === 'cms' ||
          metaRole === 'csm' ||
          metaRole.includes('seo') ||
          metaRole.includes('cms') ||
          metaRole.includes('csm'));

      if (isSeo) {
        // If at root /admin or /admin/, route to /admin/cms/home
        if (pathname === '/admin' || pathname === '/admin/') {
          const url = request.nextUrl.clone();
          url.pathname = '/admin/cms/home';
          return createAdminRedirect(url);
        }

        // Only allow SEO/CMS pages for SEO/CMS Manager
        const allowedSeoPrefixes = [
          '/admin/cms',
          '/admin/categories',
          '/admin/banners',
          '/admin/reels',
          '/admin/inquiries',
        ];
        const isAllowed = allowedSeoPrefixes.some((prefix) => pathname.startsWith(prefix));
        if (!isAllowed) {
          const url = request.nextUrl.clone();
          url.pathname = '/admin/cms/home';
          return createAdminRedirect(url);
        }
      }
    }

    // Check if current route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    // Redirect unauthenticated users from protected pages to login
    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Redirect unauthenticated API requests with 401
    if (isProtectedApiRoute && !user) {
      const jsonRes = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
      jsonRes.headers.set('Access-Control-Allow-Origin', '*');
      return jsonRes;
    }
  } catch (err) {
    console.error('Middleware execution notice:', err);
    // Never crash the request
  }

  if (pathname.startsWith('/admin')) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    supabaseResponse.headers.set('Pragma', 'no-cache');
    supabaseResponse.headers.set('CDN-Cache-Control', 'no-store');
    supabaseResponse.headers.set('Vary', 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url, Accept, Accept-Encoding');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, logo.png (static assets)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|products/|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
