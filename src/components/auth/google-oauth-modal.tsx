'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Fingerprint, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Modal } from '@/components/ui/modal';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (res: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'authenticate' | 'preview';
}

export function GoogleOAuthModal({ isOpen, onClose, onSuccess, mode = 'authenticate' }: GoogleOAuthModalProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const closeModal = useCallback(() => {
    setErrorMsg('');
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (mode === 'preview') return;

      if (!response.credential) {
        setErrorMsg('No se recibió la credencial de Google.');
        return;
      }

      setIsSubmitting(true);
      setErrorMsg('');

      try {
        const success = await loginWithGoogle(response.credential);
        if (success) {
          closeModal();
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/');
          }
        } else {
          setErrorMsg('Error al autenticar con Google. Por favor, intenta de nuevo.');
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Error de conexión con el servidor.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [closeModal, loginWithGoogle, mode, onSuccess, router]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'preview') return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    if (GOOGLE_CLIENT_ID && typeof window !== 'undefined') {
      intervalId = setInterval(() => {
        if (cancelled) return;
        if (window.google?.accounts?.id && buttonContainerRef.current) {
          if (intervalId) clearInterval(intervalId);
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (res: { credential?: string }) => {
              void handleCredential(res);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          buttonContainerRef.current.replaceChildren();
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 280,
          });
        }
      }, 100);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [GOOGLE_CLIENT_ID, handleCredential, isOpen, mode]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      size="sm"
      ariaLabel="Iniciar sesión con Google"
      className="ui-oauth-modal p-0 overflow-hidden"
    >
      <div className="ui-oauth-content text-center">
        <div className="ui-oauth-hero">
          <div className="ui-oauth-logo">
            <svg className="w-full h-full" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <span className="ui-oauth-kicker"><Fingerprint /> Identidad federada</span>
          <h3 className="text-xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
            Iniciar sesión con Google
          </h3>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-[var(--text-secondary)]">
            Accede con una credencial firmada, sin compartir tu contraseña de Google con TournamentsPro.
          </p>
        </div>

        <div className="ui-oauth-benefits" aria-label="Garantías de acceso">
          <span><Check /> Autenticación cifrada</span>
          <span><Check /> Sincronización inmediata</span>
        </div>

        {mode === 'preview' ? (
          <div className="ui-oauth-message is-warning" role="status">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <div><strong>Modo demostración</strong><span>La vista no inicia sesión ni envía credenciales.</span></div>
          </div>
        ) : !GOOGLE_CLIENT_ID ? (
          <div className="ui-oauth-message is-warning">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <div><strong>Integración pendiente</strong><span>Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.</span></div>
          </div>
        ) : (
          <div className="ui-oauth-provider" aria-busy={isSubmitting}>
            {isSubmitting ? (
              <span className="ui-oauth-loading"><span /> Verificando cuenta segura…</span>
            ) : (
              <div ref={buttonContainerRef} className="flex justify-center" />
            )}
          </div>
        )}

        {errorMsg && (
          <div role="alert" className="ui-oauth-message is-danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <div><strong>Acceso no completado</strong><span>{errorMsg}</span></div>
          </div>
        )}

        <div className="ui-oauth-trust">
          <span><ShieldCheck /> Protección de cuenta</span>
          <span><Lock /> Google Identity Services</span>
        </div>
      </div>
    </Modal>
  );
}
