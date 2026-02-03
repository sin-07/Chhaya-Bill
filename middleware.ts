import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect dashboard and invoice routes
  if (pathname.startsWith('/dashboard')) {
    try {
      const token = request.cookies.get('admin_token')?.value;
      
      if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Token is valid, allow access
      return NextResponse.next();
    } catch (error) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
