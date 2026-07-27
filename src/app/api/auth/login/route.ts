import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { hashPassword, verifyPassword, signToken } from '@/lib/auth';
import { UserRow, mapUserRowToProfile, apiSuccess, apiError } from '@/lib/api-types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrGamertag, password } = body;

    if (!emailOrGamertag || typeof emailOrGamertag !== 'string' || !emailOrGamertag.trim()) {
      return apiError('Email o Gamertag requerido', 400);
    }

    if (!password || typeof password !== 'string') {
      return apiError('Contraseña requerida', 400);
    }

    const term = emailOrGamertag.trim();

    // Query user in MySQL database
    const users = await queryDB<UserRow>(
      `SELECT * FROM users 
       WHERE LOWER(email) = LOWER(?) OR LOWER(gamertag) = LOWER(?) 
       LIMIT 1`,
      [term, term]
    );

    if (!users || users.length === 0) {
      return apiError('Credenciales inválidas. Verifica tu email/gamertag y contraseña.', 401);
    }

    const row = users[0];

    // Ban check
    if (row.is_banned === 1 || row.status === 'Baneado') {
      return apiError(
        `Cuenta suspendida: ${row.ban_reason || 'Infracción a los términos de servicio'}`,
        403,
        'ACCOUNT_BANNED'
      );
    }

    // Password verification
    if (!row.password_hash) {
      return apiError('Esta cuenta no tiene contraseña configurada. Intenta con Google.', 401);
    }

    // Support both hashed (bcrypt) and legacy plain-text passwords
    let passwordValid = false;
    if (row.password_hash.startsWith('$2a$') || row.password_hash.startsWith('$2b$')) {
      // Bcrypt hashed password
      passwordValid = await verifyPassword(password, row.password_hash);
    } else {
      // Legacy plain-text password — verify and migrate to bcrypt
      passwordValid = (password === row.password_hash);
      if (passwordValid) {
        // Auto-migrate to bcrypt hash
        try {
          const hashed = await hashPassword(password);
          await queryDB('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, row.id]);
        } catch (migrationErr) {
          console.warn('Password migration failed (non-blocking):', migrationErr);
        }
      }
    }

    if (!passwordValid) {
      return apiError('Credenciales inválidas. Verifica tu email/gamertag y contraseña.', 401);
    }

    // Generate JWT token
    const token = signToken({
      userId: row.id,
      role: row.role,
      gamertag: row.gamertag,
    });

    const userProfile = mapUserRowToProfile(row);

    // Set HttpOnly cookie + return user data
    const response = NextResponse.json({
      success: true,
      data: { user: userProfile, token },
      message: 'Inicio de sesión exitoso',
    });

    response.cookies.set('tp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Error en inicio de sesión';
    return apiError(message, 500);
  }
}
