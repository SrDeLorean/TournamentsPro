const fs = require('fs');

// Patch login
let login = fs.readFileSync('src/app/api/auth/login/route.ts', 'utf8');
const loginReplace = `
    const userByEmail = await import('@/lib/db/provider').then(m => m.dbProvider.users.findByEmail(term));
    const usersByGamer = await import('@/lib/db/provider').then(m => m.dbProvider.users.findAll({ where: { gamertag: term }, limit: 1 }));
    const user = userByEmail || usersByGamer[0];

    if (!user) {
      return apiError('Credenciales invǭlidas. Verifica tu email/gamertag y contrasea.', 401);
    }

    const row = {
      id: user.id, email: user.email, name: user.name, gamertag: user.gamertag, role: user.role,
      primary_game_slug: user.primaryGameSlug, platform: user.platform, position: user.position,
      secondary_position: user.secondaryPosition, rank_badge: user.rankBadge, rating: user.rating,
      status: user.status, avatar_url: user.avatarUrl, organization_id: user.organizationId,
      is_banned: user.isBanned ? 1 : 0, ban_reason: user.banReason, last_login_at: user.lastLoginAt,
      created_at: user.createdAt, updated_at: user.updatedAt, password_hash: user.passwordHash, google_id: user.googleId
    };
`;
login = login.replace(/const users = await queryDB<UserRow>\([\s\S]*?const row = users\[0\];/m, loginReplace.trim());
fs.writeFileSync('src/app/api/auth/login/route.ts', login);

// Patch register
let register = fs.readFileSync('src/app/api/auth/register/route.ts', 'utf8');
const registerReplace = `
    const userByEmail = await import('@/lib/db/provider').then(m => m.dbProvider.users.findByEmail(body.email));
    if (userByEmail) {
      return apiError('El correo electrónico ya está en uso', 409, 'EMAIL_IN_USE');
    }
    const userByGamer = await import('@/lib/db/provider').then(m => m.dbProvider.users.findAll({ where: { gamertag: body.gamertag }, limit: 1 }));
    if (userByGamer.length > 0) {
      return apiError('El gamertag ya está en uso', 409, 'GAMERTAG_IN_USE');
    }
`;
register = register.replace(/\/\/ Check if user exists[\s\S]*?return apiError\('El gamertag ya.*?, 409, 'GAMERTAG_IN_USE'\);\r?\n    \}/, registerReplace.trim());

// Also replace queryDB INSERT in register
const insertReplace = `
    const newUser = {
      id: userId,
      email: body.email,
      passwordHash: hashed,
      name: body.name,
      gamertag: body.gamertag,
      role: 'Jugador',
      primaryGameSlug: 'eafc26',
      status: 'Activo',
      createdAt: now,
      updatedAt: now,
    };
    await import('@/lib/db/provider').then(m => m.dbProvider.users.create(newUser));
`;
register = register.replace(/await queryDB\(\r?\n\s*`INSERT INTO users[\s\S]*?\]\r?\n\s*\);/, insertReplace.trim());

fs.writeFileSync('src/app/api/auth/register/route.ts', register);
console.log('Patched login and register');
