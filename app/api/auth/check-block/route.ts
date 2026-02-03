import { NextRequest, NextResponse } from 'next/server';

const MAX_ATTEMPTS = 3;
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

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const attempt = failedAttempts.get(clientIP);
  
  if (!attempt || !attempt.blockedUntil) {
    return NextResponse.json({ isBlocked: false });
  }
  
  if (attempt.blockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((attempt.blockedUntil - Date.now()) / 60000);
    return NextResponse.json({
      isBlocked: true,
      message: `Too many failed attempts. Please try again in ${minutesLeft} minute(s).`
    });
  }
  
  // Block expired
  failedAttempts.delete(clientIP);
  return NextResponse.json({ isBlocked: false });
}
