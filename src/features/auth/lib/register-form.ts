import type { UserProfile } from '@/lib/data-store';

export interface RegistrationFormValues {
  gamertag: string;
  fullName: string;
  email: string;
  password: string;
  primaryGame: UserProfile['primaryGame'];
  platform: UserProfile['platform'];
}

export type RegistrationPayload = Pick<UserProfile, 'gamertag' | 'primaryGame' | 'platform'> & {
  name: string;
  email: string;
  password: string;
};

export function validateRegistrationForm(values: RegistrationFormValues): string | null {
  if (values.gamertag.trim().length < 3) return 'El gamertag debe tener al menos 3 caracteres.';
  if (!values.fullName.trim()) return 'Ingresa tu nombre completo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return 'Ingresa un correo electrónico válido.';
  if (values.password.length < 10) return 'La contraseña debe tener al menos 10 caracteres.';
  if (values.password.length > 128) return 'La contraseña no puede superar los 128 caracteres.';
  if (!/[A-Za-z]/.test(values.password) || !/[0-9]/.test(values.password)) {
    return 'La contraseña debe incluir al menos una letra y un número.';
  }
  return null;
}

export function buildRegistrationPayload(values: RegistrationFormValues): RegistrationPayload {
  return {
    gamertag: values.gamertag.trim(),
    name: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    primaryGame: values.primaryGame,
    platform: values.platform,
  };
}
