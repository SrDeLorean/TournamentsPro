import React, { useState, useEffect } from 'react';
import { ModalForm } from '@/components/ui/modal-form';
import { useCrudNotifier, CrudAlertBanner } from '@/components/ui/crud-alert';
import { BrandedImageUploadSection } from '@/components/ui/branded-image-upload-section';
import { SocialMediaGroup } from '@/components/ui/social-media-group';
import { Avatar } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';

interface OrganizerOption {
  id: string;
  name: string;
  gamertag?: string;
  avatar_url?: string;
  foto?: string;
}

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: { id: string } | null;
}

export function CreateOrganizationModal({ isOpen, onClose, onSuccess, currentUser }: CreateOrganizationModalProps) {
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();
  const [modalLogoUrl, setModalLogoUrl] = useState('');
  const [modalBannerUrl, setModalBannerUrl] = useState('');
  const [availableOrganizers, setAvailableOrganizers] = useState<OrganizerOption[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/users?role=Organizador&unassignedOrg=true')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.users)) {
            setAvailableOrganizers(data.users);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleClose = () => {
    setModalLogoUrl('');
    setModalBannerUrl('');
    setErrorMsg('');
    onClose();
  };

  const handleCreateOrg = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const orgName = (formData.get('name') as string)?.trim() || 'Organización';
    const selectedGames = Object.keys(GAMES_CATALOG).filter((slug) => formData.get(`game_${slug}`));
    const selectedOrganizers = availableOrganizers
      .filter((o) => formData.get(`organizer_${o.id}`))
      .map((o) => o.id);

    startOperation(`Crear organización: ${orgName}`);

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          tag: formData.get('tag'),
          ownerId: currentUser?.id,
          allowedGames: selectedGames,
          logoUrl: modalLogoUrl,
          bannerUrl: modalBannerUrl,
          country: formData.get('country'),
          foundedYear: formData.get('foundedYear'),
          rating: formData.get('rating'),
          website: formData.get('website'),
          organizerIds: selectedOrganizers,
          socialMedia: {
            twitter: formData.get('social_twitter'),
            instagram: formData.get('social_instagram'),
            twitch: formData.get('social_twitch'),
            youtube: formData.get('social_youtube'),
            discord: formData.get('social_discord'),
          },
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        form.reset();
        setModalLogoUrl('');
        setModalBannerUrl('');
        setErrorMsg('');
        endSuccess(`¡La organización "${orgName}" fue registrada exitosamente!`);
        window.dispatchEvent(new Event('organization_updated'));
        onSuccess();
        onClose();
      } else {
        const errorDetail = data.error || 'Error al crear la organización';
        setErrorMsg(errorDetail);
        endError(errorDetail);
      }
    } catch (error) {
      const errorDetail = error instanceof Error ? error.message : 'Error en la conexión con el servidor';
      setErrorMsg(errorDetail);
      endError(errorDetail);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && crudState.status === 'IDLE') return null;

  return (
    <>
      <ModalForm
        isOpen={isOpen}
        onClose={handleClose}
        title="Crear Nueva Organización eSports"
        subtitle="Registrar organización en la base de datos MySQL"
        onSubmit={handleCreateOrg}
        isSubmitting={isSubmitting}
        errorMessage={errorMsg}
        brandColor="var(--app-accent-2)"
      >
      <div className="space-y-4">
        <BrandedImageUploadSection title="Identidad visual de la organización" brandColor="var(--app-accent-2)" entityType="organization" items={[
          { label: 'Logo / Escudo Oficial', currentUrl: modalLogoUrl, fallbackType: 'logo', uploadType: 'logo', maxDimension: 512, uploadButtonText: 'Subir Escudo', entityName: 'org-new', entityId: 'new-organization', onUploadSuccess: (url) => setModalLogoUrl(url) },
          { label: 'Banner de Portada', currentUrl: modalBannerUrl, fallbackType: 'banner', uploadType: 'banner', maxDimension: 1200, uploadButtonText: 'Subir Banner', entityName: 'org-new', entityId: 'new-organization', onUploadSuccess: (url) => setModalBannerUrl(url) },
        ]} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-[var(--text-secondary)] uppercase block">Nombre Oficial:</label>
            <input type="text" name="name" required placeholder="Nombre de la Organización" className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)] text-[var(--text-heading)]" />
          </div>
          <div className="space-y-1">
            <label className="text-[var(--text-secondary)] uppercase block">Tag / Abreviatura:</label>
            <input type="text" name="tag" required maxLength={5} placeholder="SL" className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)] text-[var(--app-accent-2)] font-[family-name:var(--font-active)] uppercase" />
          </div>
          <div className="space-y-1">
            <label className="text-[var(--text-secondary)] uppercase block">País / Sede:</label>
            <input type="text" name="country" defaultValue="Venezuela" className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)] text-[var(--text-heading)]" />
          </div>
          <div className="space-y-1">
            <label className="text-[var(--text-secondary)] uppercase block">Año de Fundación:</label>
            <input type="text" name="foundedYear" defaultValue="2019" className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)] text-[var(--text-heading)] font-[family-name:var(--font-active)]" />
          </div>
          <div className="space-y-1">
            <label className="text-[var(--text-secondary)] uppercase block">Rating de Prestigio:</label>
            <input type="text" name="rating" defaultValue="4.98" className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)] text-[var(--app-warning)] font-[family-name:var(--font-active)]" />
          </div>
          <div className="space-y-1">
            <label className="text-[var(--text-secondary)] uppercase block">Sitio Web Oficial:</label>
            <input type="text" name="website" placeholder="https://tuorganizacion.com" className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)] text-[var(--text-heading)] font-[family-name:var(--font-active)]" />
          </div>
        </div>

        {/* Asignación de Organizadores */}
        <div className="space-y-2 p-3 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)]">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase flex items-center gap-1">
            <Users className="w-4 h-4 text-[var(--app-accent-2)]" />
            Asignar Organizadores a la Organización:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableOrganizers.map((oUser) => (
              <label key={oUser.id} className="flex items-center gap-2 text-xs font-semibold text-[var(--text-heading)] bg-[var(--app-canvas)] p-2 rounded-lg border border-[var(--border-card)] cursor-pointer">
                <input type="checkbox" name={`organizer_${oUser.id}`} />
                <Avatar fallback={oUser.name} src={oUser.avatar_url || oUser.foto} size="sm" />
                <span>@{oUser.gamertag || oUser.name}</span>
              </label>
            ))}
            {availableOrganizers.length === 0 && (
              <p className="text-[10px] text-[var(--text-muted)]">No hay organizadores libres disponibles.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block">Disciplinas eSports Autorizadas:</label>
          <div className="flex flex-wrap gap-3">
            {Object.entries(GAMES_CATALOG).map(([slug, g]) => (
              <label key={slug} className="flex items-center gap-2 text-xs font-semibold text-[var(--text-heading)] bg-[var(--app-surface-2)] p-2 rounded-xl border border-[var(--border-card)] cursor-pointer">
                <input type="checkbox" name={`game_${slug}`} defaultChecked />
                <span>{g.name}</span>
              </label>
            ))}
          </div>
        </div>

        <SocialMediaGroup prefixName="social" />
      </div>
    </ModalForm>
    <CrudAlertBanner state={crudState} onClose={resetAlert} />
  </>
  );
}
