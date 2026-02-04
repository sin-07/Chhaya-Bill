import { NextRequest, NextResponse } from 'next/server';
import { loginAttempts } from '@/lib/loginAttempts';

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();
    
    if (secret !== process.env.DEVELOPER_UNLOCK_KEY) {
      return NextResponse.json(
        { error: 'Invalid unlock key' },
        { status: 403 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    loginAttempts.set(ip, {
      ip,
      failedAttempts: 0,
      isPermanentlyBlocked: false,
      lastAttemptTime: new Date()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Access unlocked successfully' 
    });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    
    if (secret !== process.env.DEVELOPER_UNLOCK_KEY) {
      return NextResponse.json(
        { error: 'Invalid unlock key' },
        { status: 403 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    loginAttempts.set(ip, {
      ip,
      failedAttempts: 0,
      isPermanentlyBlocked: false,
      lastAttemptTime: new Date()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Access unlocked successfully' 
    });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock' },
      { status: 500 }
    );
  }
}
