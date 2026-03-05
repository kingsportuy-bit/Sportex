import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('sportex_user_id')
    const isPublicRoute =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register')

    // 1. Si no hay sesión y no es ruta pública -> Redirigir a login
    if (!session && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. Si hay sesión e intenta ir a login/register -> Redirigir a dashboard
    if (session && isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|public|api/webhook).*)',
    ],
}
