import { describe, expect, it } from 'vitest';
import {
  fixtureRequestBodySchema,
  matchApprovalBodySchema,
  transferPostBodySchema,
  uploadRequestBodySchema,
  loginBodySchema,
  registerBodySchema,
  teamCreateBodySchema,
  userUpdateBodySchema,
} from '../src/lib/api-schemas';

describe('mutable API body schemas', () => {
  it('rejects missing transfer identifiers and oversized messages', () => {
    expect(transferPostBodySchema.safeParse({ position: 'DFC' }).success).toBe(false);
    expect(transferPostBodySchema.safeParse({ teamId: 'team-1', position: 'DFC', pitchMessage: 'x'.repeat(1001) }).success).toBe(false);
  });

  it('coerces legacy numeric scores but rejects invalid actions', () => {
    const valid = matchApprovalBodySchema.safeParse({ matchId: 'match-1', scoreHome: '2', scoreAway: 1, action: 'REPORT_SCORE' });
    expect(valid.success && valid.data.scoreHome).toBe(2);
    expect(matchApprovalBodySchema.safeParse({ matchId: 'match-1', action: 'DELETE' }).success).toBe(false);
  });

  it('bounds upload metadata and validates fixture time', () => {
    expect(uploadRequestBodySchema.safeParse({ fileBase64: 'data', fileName: 'x'.repeat(256) }).success).toBe(false);
    expect(fixtureRequestBodySchema.safeParse({ tournamentId: 'tour-1', matchdayTime: '25:90' }).success).toBe(false);
  });

  it('validates auth and entity mutation envelopes without stripping extra fields', () => {
    expect(loginBodySchema.safeParse({ emailOrGamertag: '', password: 'x' }).success).toBe(false);
    expect(registerBodySchema.safeParse({ gamertag: 'abc', password: 'abcdefghij' }).success).toBe(false);
    const team = teamCreateBodySchema.safeParse({ name: 'Club', tag: 'TP', color: '#fff' });
    expect(team.success && team.data.color).toBe('#fff');
    expect(userUpdateBodySchema.safeParse({ name: 'No id' }).success).toBe(false);
  });
});
