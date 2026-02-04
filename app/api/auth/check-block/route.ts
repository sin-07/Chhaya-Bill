import { NextRequest, NextResponse } from 'next/server';
import { loginAttempts } from '@/lib/loginAttempts';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    const attempt = loginAttempts.get(ip);

    if (attempt?.isPermanentlyBlocked) {
      return NextResponse.json({
        blocked: true,
        permanent: true
      });
    }

    return NextResponse.json({
      blocked: false,
      attemptsLeft: attempt ? Math.max(0, 3 - attempt.failedAttempts) : 3
    });
  } catch (error) {
    console.error('Check block error:', error);
    return NextResponse.json({ blocked: false, attemptsLeft: 3 });
  }
}
