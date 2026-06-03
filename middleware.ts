import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if maintenance mode is enabled in environment variables
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  const pathname = request.nextUrl.pathname;

  // If maintenance mode is ON and the user is NOT already on the /maintenance page or static files
  if (isMaintenanceMode) {
    if (
      !pathname.startsWith('/maintenance') &&
      !pathname.startsWith('/images') &&
      !pathname.match(/\.(png|jpg|jpeg|gif|svg|mp3|mp4|webm|ico)$/) // exclude static assets
    ) {
      // Rewrite to the maintenance page (URL stays the same in browser)
      return NextResponse.rewrite(new URL('/maintenance', request.url))
    }
  }

  // Optional: If maintenance mode is OFF but they manually go to /maintenance, redirect them to Home
  // if (!isMaintenanceMode && pathname === '/maintenance') {
  //   return NextResponse.redirect(new URL('/', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
