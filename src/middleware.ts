import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 2-Hour Inactivity Timeout Logic
    const SESSION_TIMEOUT = 2 * 60 * 60; // 2 hours in seconds
    const now = Math.floor(Date.now() / 1000);
    const lastActivity = request.cookies.get('sb-last-activity')?.value;

    if (user) {
        if (lastActivity) {
            const idleTime = now - parseInt(lastActivity);
            if (idleTime > SESSION_TIMEOUT) {
                // Session expired due to inactivity
                console.log('Middleware: Session expired due to inactivity');

                // Construct redirect response
                const url = request.nextUrl.clone();
                url.pathname = '/login';
                url.searchParams.set('message', 'session_expired');
                const response = NextResponse.redirect(url);

                // Clear Supabase auth cookies and inactivity cookie
                // We use a prefix match for Supabase cookies (sb-...)
                request.cookies.getAll().forEach(cookie => {
                    if (cookie.name.startsWith('sb-')) {
                        response.cookies.delete(cookie.name);
                    }
                });

                return response;
            }
        }

        // Update last activity for valid sessions
        supabaseResponse.cookies.set('sb-last-activity', now.toString(), {
            path: '/',
            maxAge: SESSION_TIMEOUT,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
    }

    const isPanitiaRoute = request.nextUrl.pathname.startsWith('/panitia');
    const isPublicVotersRoute = request.nextUrl.pathname === '/panitia/voters';
    const isLoginPage = request.nextUrl.pathname === '/login';
    const isRegisterPage = request.nextUrl.pathname === '/register';
    const isPendingPage = request.nextUrl.pathname === '/pending-approval';

    // If visiting panitia routes (except public voter list), check for auth and approval
    if (isPanitiaRoute && !isPublicVotersRoute) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        // Fetch staff profile to check approval
        const { data: staff } = await supabase
            .from('staff')
            .select('is_approved')
            .eq('user_id', user.id)
            .single();

        if (!staff || !staff.is_approved) {
            const url = request.nextUrl.clone();
            url.pathname = '/pending-approval';
            return NextResponse.redirect(url);
        }
    }

    // If logged in, don't allow visiting login/register/pending-approval if already approved
    if ((isLoginPage || isRegisterPage || isPendingPage) && user) {
        const { data: staff } = await supabase
            .from('staff')
            .select('is_approved')
            .eq('user_id', user.id)
            .single();

        if (staff?.is_approved) {
            const url = request.nextUrl.clone();
            url.pathname = '/panitia/voters';
            return NextResponse.redirect(url);
        } else if (staff && !isPendingPage) {
            const url = request.nextUrl.clone();
            url.pathname = '/pending-approval';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
