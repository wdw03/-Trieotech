import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/profile', '/wishlist'];
const PROTECTED_API_ROUTES = ['/api/orders/history', '/api/cart', '/api/wishlist'];

// Routes that should redirect to profile if already logged in
const AUTH_ROUTES = ['/login', '/register'];

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

    // Check if current route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    const isAuthRoute = AUTH_ROUTES.some((route) =>
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

    // Redirect authenticated users away from login/register
    if (isAuthRoute && user) {
      const url = request.nextUrl.clone();
      url.pathname = '/profile';
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error('Middleware execution notice:', err);
    // Never crash the request
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
