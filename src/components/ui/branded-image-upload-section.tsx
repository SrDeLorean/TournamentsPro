'use client';

import { Image as ImageIcon } from 'lucide-react';
import { ImageUploadCard, type ImageUploadCardProps } from '@/components/ui/image-upload-card';
import type { UploadEntityType } from '@/lib/upload-storage';

type BrandedUploadItem = Omit<ImageUploadCardProps, 'brandColor' | 'entityType'>;

interface BrandedImageUploadSectionProps {
  title: string;
  brandColor: string;
  entityType: UploadEntityType;
  items: BrandedUploadItem[];
}

export function BrandedImageUploadSection({ title, brandColor, entityType, items }: BrandedImageUploadSectionProps) {
  return (
    <section className="ui-dynamic-brand-border p-5 rounded-2xl bg-[var(--bg-elevated)] border space-y-4 transition-all">
      <h4 className="ui-dynamic-brand-ink text-xs font-black uppercase tracking-wider flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <ImageUploadCard key={`${item.uploadType}-${item.label}`} {...item} brandColor={brandColor} entityType={entityType} />
        ))}
      </div>
    </section>
  );
}
