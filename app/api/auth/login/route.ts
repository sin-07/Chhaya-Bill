import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { loginAttempts } from '@/lib/loginAttempts';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    let attempt = loginAttempts.get(ip);
    
    if (!attempt) {
      attempt = {
        ip,
        failedAttempts: 0,
        isPermanentlyBlocked: false,
        lastAttemptTime: new Date()
      };
      loginAttempts.set(ip, attempt);
    }

    if (attempt.isPermanentlyBlocked) {
      return NextResponse.json(
        { 
          error: 'Access permanently blocked. Contact developer to unlock.',
          blocked: true,
          permanent: true
        },
        { status: 403 }
      );
    }

    const isValid = code === process.env.ADMIN_CODE;

    if (isValid) {
      attempt.failedAttempts = 0;
      attempt.isPermanentlyBlocked = false;
      loginAttempts.set(ip, attempt);

      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({ 
        authenticated: true,
        timestamp: Date.now()
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(secret);

      const response = NextResponse.json({ success: true });
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24
      });

      return response;
    } else {
      attempt.failedAttempts += 1;
      attempt.lastAttemptTime = new Date();

      if (attempt.failedAttempts >= 3) {
        attempt.isPermanentlyBlocked = true;
      }

      loginAttempts.set(ip, attempt);

      return NextResponse.json(
        { 
          error: 'Invalid access code',
          attemptsLeft: Math.max(0, 3 - attempt.failedAttempts),
          blocked: attempt.isPermanentlyBlocked
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
