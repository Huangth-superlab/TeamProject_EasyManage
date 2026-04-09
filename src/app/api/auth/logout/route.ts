import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // 清除Cookie
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // 立即过期
  });

  return response;
}