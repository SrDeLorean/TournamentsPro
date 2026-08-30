import { describe, expect, it } from 'vitest';
import { buildRegistrationPayload, validateRegistrationForm } from '../src/features/auth/lib/register-form';

describe('registration form contract', () => {
  const validForm = {
    gamertag: '  Capeafc261  ',
    fullName: '  Capitán Uno  ',
    email: '  CAPTAIN@EXAMPLE.COM  ',
    password: 'secure-pass-2026',
    primaryGame: 'eafc26',
    platform: 'PS5',
  };

  it('sends every field required by the registration API in normalized form', () => {
    expect(buildRegistrationPayload(validForm)).toEqual({
      gamertag: 'Capeafc261',
      name: 'Capitán Uno',
      email: 'captain@example.com',
      password: 'secure-pass-2026',
      primaryGame: 'eafc26',
      platform: 'PS5',
    });
  });

  it('explains password requirements before submitting', () => {
    expect(validateRegistrationForm({ ...validForm, password: 'abcdefghij' }))
      .toBe('La contraseña debe incluir al menos una letra y un número.');
    expect(validateRegistrationForm(validForm)).toBeNull();
  });
});
