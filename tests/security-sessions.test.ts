import { describe, expect, it } from 'vitest';
import {
  createSessionRegistry,
  shouldRevokeUserSessions,
  type SessionRecord,
  type SessionStore,
} from '../src/lib/security';

class FakeSessionStore implements SessionStore {
  records = new Map<string, SessionRecord>();

  async create(record: SessionRecord) { this.records.set(record.sessionId, record); }
  async isActive(sessionId: string, userId: string, now: number) {
    const record = this.records.get(sessionId);
    return Boolean(record && record.userId === userId && !record.revokedAt && record.expiresAt > now);
  }
  async revokeSession(sessionId: string, revokedAt: number) {
    const record = this.records.get(sessionId);
    if (record) record.revokedAt = revokedAt;
  }
  async revokeUser(userId: string, revokedAt: number) {
    for (const record of this.records.values()) {
      if (record.userId === userId) record.revokedAt = revokedAt;
    }
  }
}

describe('revocable session registry', () => {
  it('invalidates sessions for every supported ban or suspension update shape', () => {
    expect(shouldRevokeUserSessions({ action: 'BAN' })).toBe(true);
    expect(shouldRevokeUserSessions({ isBanned: true })).toBe(true);
    expect(shouldRevokeUserSessions({ isBanned: '1' })).toBe(true);
    expect(shouldRevokeUserSessions({ status: 'Baneado' })).toBe(true);
    expect(shouldRevokeUserSessions({ status: 'Suspendido' })).toBe(true);
    expect(shouldRevokeUserSessions({ passwordChanged: true })).toBe(true);
    expect(shouldRevokeUserSessions({ status: 'Activo' })).toBe(false);
  });

  it('creates an active session and revokes it by session id', async () => {
    const store = new FakeSessionStore();
    const registry = createSessionRegistry(store, { now: () => 1_000, id: () => 'sid-1' });
    const session = await registry.create('user-1', 5_000);

    expect(session.sessionId).toBe('sid-1');
    await expect(registry.isActive('sid-1', 'user-1')).resolves.toBe(true);
    await registry.revokeSession('sid-1');
    await expect(registry.isActive('sid-1', 'user-1')).resolves.toBe(false);
  });

  it('revokes every active session after a password change or ban', async () => {
    const store = new FakeSessionStore();
    let sequence = 0;
    const registry = createSessionRegistry(store, { now: () => 1_000, id: () => `sid-${++sequence}` });
    const first = await registry.create('user-1', 5_000);
    const second = await registry.create('user-1', 5_000);
    await registry.revokeUser('user-1');

    await expect(registry.isActive(first.sessionId, 'user-1')).resolves.toBe(false);
    await expect(registry.isActive(second.sessionId, 'user-1')).resolves.toBe(false);
  });
});
