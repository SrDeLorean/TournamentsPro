'use client';

import { Image as ImageIcon } from 'lucide-react';
import { ImageUploadCard, type ImageUploadCardProps } from '@/components/ui/image-upload-card';

type BrandedUploadItem = Omit<ImageUploadCardProps, 'brandColor'>;

interface BrandedImageUploadSectionProps {
  title: string;
  brandColor: string;
  items: BrandedUploadItem[];
}

export function BrandedImageUploadSection({ title, brandColor, items }: BrandedImageUploadSectionProps) {
  return (
    <section className="ui-dynamic-brand-border p-5 rounded-2xl bg-[var(--bg-elevated)] border space-y-4 transition-all">
      <h4 className="ui-dynamic-brand-ink text-xs font-black uppercase tracking-wider flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <ImageUploadCard key={`${item.uploadType}-${item.label}`} {...item} brandColor={brandColor} />
        ))}
      </div>
    </section>
  );
}
