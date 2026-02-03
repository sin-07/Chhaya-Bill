import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.role === 'admin') {
      return NextResponse.json(
        { authenticated: true, role: 'admin' },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
