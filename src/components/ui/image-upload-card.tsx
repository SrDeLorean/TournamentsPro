'use client';

import React, { useState } from 'react';
import { Upload, ImageIcon, Shield } from 'lucide-react';
import { compressImageToWebP } from '@/lib/image-compressor';
import { getAuthHeaders } from '@/lib/fetch-utils';

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
  formatLabel = 'WebP HD',
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

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fileBase64: compressedRes.base64,
          fileName: `${uploadType}-${Date.now()}.webp`,
          teamName: cleanSlug,
          teamId: entityId,
          type: uploadType,
          previousUrl: currentUrl,
        }),
      });

      const data = await res.json();
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
    <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3 flex flex-col justify-between">
      <div className="flex items-center gap-3">
        {/* Preview Frame */}
        {isBanner ? (
          <div className="w-20 h-12 rounded-lg bg-slate-900 border border-purple-400/40 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
            {currentUrl ? (
              <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
            ) : (
              renderFallback()
            )}
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-xl bg-slate-900 border-2 overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ borderColor: brandColor }}
          >
            {currentUrl ? (
              <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
            ) : (
              renderFallback()
            )}
          </div>
        )}

        <div>
          <span className="font-bold text-white text-xs block uppercase tracking-wide">{label}</span>
          <span className="text-[10px] text-slate-400 block">{subtitle}</span>
          {stats && <span className="text-[10px] font-mono text-emerald-400 font-bold block mt-0.5">{stats}</span>}
        </div>
      </div>

      <label
        className="w-full py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg hover:brightness-125"
        style={
          isBanner
            ? {
                backgroundColor: 'rgba(88, 28, 135, 0.4)',
                borderColor: 'rgba(168, 85, 247, 0.4)',
                color: '#D8B4FE',
              }
            : {
                backgroundColor: `color-mix(in srgb, ${brandColor} 15%, transparent)`,
                borderColor: `color-mix(in srgb, ${brandColor} 50%, transparent)`,
                color: brandColor,
              }
        }
      >
        <Upload className="w-3.5 h-3.5" />
        <span>{isCompressing ? 'Comprimiendo WebP...' : buttonText}</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isCompressing} />
      </label>
    </div>
  );
}
