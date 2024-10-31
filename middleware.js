import { NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const isAuthPath = path === '/login' || path === '/register';
  const token = request.cookies.get('token')?.value || '';

  console.log('Middleware path:', path);
  console.log('Is auth path:', isAuthPath);
  console.log('Token exists:', !!token);

  try {
    if (!isAuthPath && path !== '/' && !token) {
      console.log('Redirecting to login - no token');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token) {
      // Verify the token
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const verified = await jose.jwtVerify(token, secret);
        console.log('Token verified:', verified);

        if (isAuthPath) {
          console.log('Redirecting to dashboard - auth page access while logged in');
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        // If token is invalid, clear it and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('token', '', { maxAge: 0 });
        return response;
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/login',
    '/register',
    // Add other protected routes here
  ]
}; 