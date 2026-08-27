import type { Metadata } from 'next';
import LoginPageClient from '@/features/auth/components/login-page-client';

export const metadata: Metadata = { title: 'Ingresar | TorneosPro' };

export default function LoginPage() {
  return <LoginPageClient />;
}
