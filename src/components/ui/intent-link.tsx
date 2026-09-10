'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

type IntentLinkProps = ComponentProps<typeof Link>;

/** Prefetches dense-list destinations only after real pointer or keyboard intent. */
export function IntentLink({ onFocus, onMouseEnter, prefetch, href, ...props }: IntentLinkProps) {
  const router = useRouter();
  const warmRoute = () => router.prefetch(String(href));

  return (
    <Link
      {...props}
      href={href}
      prefetch={prefetch ?? false}
      onMouseEnter={(event) => {
        warmRoute();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        warmRoute();
        onFocus?.(event);
      }}
    />
  );
}
