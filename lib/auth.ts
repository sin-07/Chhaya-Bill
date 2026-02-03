import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

export async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return false;
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check if token is valid and has admin role
    if (payload.role === 'admin') {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

export async function getAuthPayload(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return null;
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}
