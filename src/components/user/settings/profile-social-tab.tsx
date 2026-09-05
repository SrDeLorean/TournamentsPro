'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Globe, Phone, Share2, Tv, Video, MessageSquare } from 'lucide-react';

interface ProfileSocialTabProps {
  telefono: string;
  setTelefono: (t: string) => void;
  whatsapp: string;
  setWhatsapp: (w: string) => void;
  instagram: string;
  setInstagram: (i: string) => void;
  twitch: string;
  setTwitch: (t: string) => void;
  youtube: string;
  setYoutube: (y: string) => void;
  discord: string;
  setDiscord: (d: string) => void;
  facebook: string;
  setFacebook: (f: string) => void;
  website: string;
  setWebsite: (w: string) => void;
}

export function ProfileSocialTab({
  telefono,
  setTelefono,
  whatsapp,
  setWhatsapp,
  instagram,
  setInstagram,
  twitch,
  setTwitch,
  youtube,
  setYoutube,
  discord,
  setDiscord,
  facebook,
  setFacebook,
  website,
  setWebsite,
}: ProfileSocialTabProps) {
  return (
    <Card className="account-settings-card p-4 sm:p-6 space-y-6 border-[var(--app-warning)] bg-[var(--bg-card)]">
      <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
        <Globe className="w-4 h-4 text-[var(--app-warning)]" />
        4. Redes Sociales y Contacto:
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-[var(--app-positive)]" />
            Teléfono de Contacto
          </label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+56 9 1234 5678"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-[var(--app-positive)]" />
            WhatsApp
          </label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+56912345678"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-[var(--app-accent-2)]" />
            Instagram
          </label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@usuario"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block flex items-center gap-1">
            <Tv className="w-3.5 h-3.5 text-[var(--app-accent-2)]" />
            Twitch TV
          </label>
          <input
            type="text"
            value={twitch}
            onChange={(e) => setTwitch(e.target.value)}
            placeholder="twitch.tv/canal"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-[var(--app-danger)]" />
            YouTube Channel
          </label>
          <input
            type="text"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="youtube.com/@canal"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--app-accent-2)]" />
            Discord Username
          </label>
          <input
            type="text"
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            placeholder="usuario 1234 o usuario"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-[var(--app-accent)]" />
            Facebook
          </label>
          <input
            type="text"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="facebook.com/pagina"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] font-semibold"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="font-bold text-[var(--text-secondary)] uppercase block flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-[var(--app-warning)]" />
            Sitio Web Personal / Portfolio
          </label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://micontenido.com"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] font-semibold"
          />
        </div>
      </div>
    </Card>
  );
}
