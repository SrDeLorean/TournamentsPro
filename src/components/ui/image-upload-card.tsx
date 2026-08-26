'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Upload, ImageIcon, Shield } from 'lucide-react';
import { compressImageToWebP } from '@/lib/image-compressor';
import { fetchJson } from '@/lib/fetch-utils';

export interface ImageUploadCardProps {
  label: string;
  subtitle?: string;
  formatLabel?: string;
  currentUrl?: string;
  fallbackType?: 'avatar' | 'banner' | 'logo';
  maxDimension?: number;
  quality?: number;
  brandColor?: string;
  uploadButtonText?: string;
  entityName?: string;
  entityId?: string;
  uploadType?: 'logo' | 'banner' | 'avatar';
  onUploadSuccess: (url: string, statsMessage: string) => Promise<void> | void;
}

export function ImageUploadCard({
  label,
  subtitle = 'Formato WebP optimizado',
  currentUrl = '',
  fallbackType = 'avatar',
  maxDimension = 600,
  quality = 0.85,
  brandColor = '#00F0FF',
  uploadButtonText,
  entityName = 'upload',
  entityId = 'id',
  uploadType = 'logo',
  onUploadSuccess,
}: ImageUploadCardProps) {
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [stats, setStats] = useState<string>('');

  const defaultButtonText = uploadType === 'banner' ? 'Subir / Cambiar Banner' : 'Subir / Cambiar Foto';
  const buttonText = uploadButtonText || defaultButtonText;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const originalMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedRes = await compressImageToWebP(file, maxDimension, quality);
      const compressedMB = (compressedRes.compressedSize / (1024 * 1024)).toFixed(2);
      const reduction = Math.round((1 - compressedRes.compressedSize / file.size) * 100);

      const statsMsg = `Compreso: ${originalMB}MB ➔ ${compressedMB}MB (-${reduction}%)`;
      setStats(statsMsg);

      const cleanSlug = entityName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      const data = await fetchJson<{ success?: boolean; data?: { url?: string }; url?: string }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileBase64: compressedRes.base64,
          fileName: `${uploadType}-${Date.now()}.webp`,
          teamName: cleanSlug,
          teamId: entityId,
          type: uploadType,
          previousUrl: currentUrl,
        }),
      });

      const resultUrl = data.data?.url || data.url;
      if (data.success && resultUrl) {
        await onUploadSuccess(resultUrl, statsMsg);
      }
    } catch (err) {
      console.error(`Error al procesar ${uploadType}:`, err);
    } finally {
      setIsCompressing(false);
    }
  };

  const renderFallback = () => {
    if (fallbackType === 'banner') {
      return <ImageIcon className="w-6 h-6 text-slate-500" />;
    }
    if (fallbackType === 'logo') {
      return <Shield className="w-6 h-6 text-slate-500" />;
    }
    return <Upload className="w-6 h-6 text-slate-500" />;
  };

  const isBanner = fallbackType === 'banner' || uploadType === 'banner';

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-4 flex flex-col justify-between shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3.5">
        {/* Preview Frame */}
        {isBanner ? (
          <div className="w-20 h-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] overflow-hidden flex items-center justify-center flex-shrink-0 relative shadow-sm">
            {currentUrl ? (
              <Image src={currentUrl} alt={label} fill sizes="80px" unoptimized className="object-cover" />
            ) : (
              renderFallback()
            )}
          </div>
        ) : (
          <div
            className="relative w-14 h-14 rounded-xl bg-[var(--bg-card)] border-2 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ borderColor: brandColor }}
          >
            {currentUrl ? (
              <Image src={currentUrl} alt={label} fill sizes="56px" unoptimized className="object-cover" />
            ) : (
              renderFallback()
            )}
          </div>
        )}

        <div>
          <span className="font-bold font-mono text-[var(--text-heading)] text-xs block uppercase tracking-wide">{label}</span>
          <span className="text-[11px] font-mono text-[var(--text-muted)] block mt-0.5">{subtitle}</span>
          {stats && <span className="text-[11px] font-mono text-[var(--accent-emerald)] font-bold block mt-1">{stats}</span>}
        </div>
      </div>

      <label
        className="w-full py-2.5 px-3 rounded-xl border font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.98] hover:opacity-90"
        style={{
          backgroundColor: brandColor,
          borderColor: brandColor,
          color: '#020617',
        }}
      >
        <Upload className="w-4 h-4" />
        <span>{isCompressing ? 'Procesando...' : buttonText}</span>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={isCompressing} className="hidden" />
      </label>
    </div>
  );
}
