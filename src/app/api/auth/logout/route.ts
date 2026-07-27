import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, data: null, message: 'Sesión cerrada' });
  
  // Clear the HttpOnly session cookie
  response.cookies.set('tp_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  return response;
}
