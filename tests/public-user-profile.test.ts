import { describe, expect, it } from 'vitest';
import { mapUserRowToPublicProfile } from '@/lib/api-types';

describe('public user DTO', () => {
  it('does not expose account, private contact, or moderation fields', () => {
    const profile = mapUserRowToPublicProfile({
      id: 'usr-1',
      email: 'private@example.test',
      name: 'Jugador',
      gamertag: 'PlayerOne',
      whatsapp: '+56911111111',
      discord: 'private-handle',
      instagram: 'public-handle',
      is_banned: 1,
      ban_reason: 'private moderation note',
    });

    expect(profile).not.toHaveProperty('email');
    expect(profile).not.toHaveProperty('isBanned');
    expect(profile).not.toHaveProperty('banReason');
    expect(profile.socialMedia).not.toHaveProperty('whatsapp');
    expect(profile.socialMedia).not.toHaveProperty('discord');
    expect(profile.socialMedia.instagram).toBe('public-handle');
  });
});
