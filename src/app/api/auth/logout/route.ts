import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { authorizationErrorResponse, requireValidMutationOrigin } from '@/lib/auth-server';
import { revokeAuthSession } from '@/lib/security';

export async function POST(request: Request) {
  try {
    requireValidMutationOrigin(request);
    const payload = authenticateRequest(request);
    if (payload?.sessionId) await revokeAuthSession(payload.sessionId);

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
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: 'No fue posible revocar la sesión' }, { status: 503 });
  }
}
