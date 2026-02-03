import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

// Admin access code (in production, this should be in environment variables)
const ADMIN_CODE = process.env.ADMIN_CODE || '123456';
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

// In-memory storage for failed attempts (in production, use Redis or database)
const failedAttempts: Map<string, { count: number; blockedUntil?: number }> = new Map();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

function isBlocked(ip: string): { blocked: boolean; message?: string } {
  const attempt = failedAttempts.get(ip);
  
  if (!attempt) {
    return { blocked: false };
  }
  
  if (attempt.blockedUntil && attempt.blockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((attempt.blockedUntil - Date.now()) / 60000);
    return {
      blocked: true,
      message: `Too many failed attempts. Please try again in ${minutesLeft} minute(s).`
    };
  }
  
  // Block expired, reset attempts
  if (attempt.blockedUntil && attempt.blockedUntil <= Date.now()) {
    failedAttempts.delete(ip);
    return { blocked: false };
  }
  
  return { blocked: false };
}

function recordFailedAttempt(ip: string): { shouldBlock: boolean; attemptsLeft: number } {
  const attempt = failedAttempts.get(ip) || { count: 0 };
  attempt.count += 1;
  
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    failedAttempts.set(ip, attempt);
    return { shouldBlock: true, attemptsLeft: 0 };
  }
  
  failedAttempts.set(ip, attempt);
  return { shouldBlock: false, attemptsLeft: MAX_ATTEMPTS - attempt.count };
}

function clearFailedAttempts(ip: string) {
  failedAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const clientIP = getClientIP(request);
    
    // Check if IP is blocked
    const blockStatus = isBlocked(clientIP);
    if (blockStatus.blocked) {
      return NextResponse.json(
        { 
          message: blockStatus.message,
          isBlocked: true 
        },
        { status: 429 }
      );
    }
    
    // Validate code
    if (!code || code.length !== 6) {
      return NextResponse.json(
        { message: 'Please enter a 6-digit code' },
        { status: 400 }
      );
    }
    
    // Check if code is correct
    if (code !== ADMIN_CODE) {
      const { shouldBlock, attemptsLeft } = recordFailedAttempt(clientIP);
      
      if (shouldBlock) {
        return NextResponse.json(
          { 
            message: 'Too many failed attempts. Access blocked for 30 minutes.',
            isBlocked: true 
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { 
          message: `Invalid code. ${attemptsLeft} attempt(s) remaining.`,
          attemptsLeft 
        },
        { status: 401 }
      );
    }
    
    // Code is correct, clear failed attempts and create session
    clearFailedAttempts(clientIP);
    
    // Create JWT token
    const token = await new SignJWT({ 
      role: 'admin',
      ip: clientIP,
      loginTime: Date.now()
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
    
    // Set HTTP-only cookie
    const response = NextResponse.json(
      { message: 'Login successful' },
      { status: 200 }
    );
    
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
