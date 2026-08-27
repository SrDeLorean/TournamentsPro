import type { Metadata } from 'next';
import RegisterPageClient from '@/features/auth/components/register-page-client';

export const metadata: Metadata = { title: 'Registro | TorneosPro' };

export default function RegisterPage() {
  return <RegisterPageClient />;
}
