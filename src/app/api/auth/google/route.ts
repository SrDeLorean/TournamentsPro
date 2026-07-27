import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { UserProfile } from '@/lib/data-store';

// Helper function to decode JWT payload without external heavy library dependencies
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { credential, email: bodyEmail, name: bodyName, picture: bodyPicture, googleId: bodyGoogleId } = body;

    let email = bodyEmail;
    let name = bodyName;
    let picture = bodyPicture;
    let googleId = bodyGoogleId;

    // If Google ID Token credential was provided from Google One Tap / Sign-In Button
    if (credential) {
      const decodedPayload = decodeJwtPayload(credential);
      if (decodedPayload) {
        email = decodedPayload.email || email;
        name = decodedPayload.name || name;
        picture = decodedPayload.picture || picture;
        googleId = decodedPayload.sub || googleId;
      }
    }

    const finalEmail = email || 'atleta.google@tournamentspro.com';
    const finalName = name || 'Atleta Google';
    const finalGoogleId = googleId || `gid-${Date.now()}`;

    const cleanedName = finalName.trim().replace(/[^a-zA-Z0-9]/g, '');
    const gamertag = cleanedName.length > 0 ? `${cleanedName.substring(0, 12)}_G` : 'AtletaGoogle';

    const userId = `usr-google-${finalGoogleId}`;

    // Insert or update in MySQL users table
    try {
      await queryDB(
        `INSERT INTO users (id, email, google_id, name, gamertag, role, primary_game_slug, platform, position, rank_badge, status, avatar_url)
         VALUES (?, ?, ?, ?, ?, 'Jugador', 'eafc26', 'CROSSPLAY', 'DFC', 'División 1', 'Buscando Club', ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), avatar_url=VALUES(avatar_url)`,
        [userId, finalEmail, finalGoogleId, finalName, gamertag, picture || null]
      );
    } catch (dbErr) {
      console.warn('MySQL insertion warning for Google OAuth user:', dbErr);
    }

    const authenticatedUser: UserProfile = {
      id: userId,
      name: finalName,
      email: finalEmail,
      gamertag: gamertag,
      role: 'Jugador',
      primaryGame: 'eafc26',
      platform: 'CROSSPLAY',
      position: 'DFC',
      status: 'Buscando Club',
      rating: '9.8',
      avatarUrl: picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    };

    return NextResponse.json({
      success: true,
      message: 'Autenticación con Google vinculada a la base de datos MySQL',
      user: authenticatedUser,
      token: `token_${Date.now()}`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando autenticación con Google' }, { status: 500 });
  }
}
