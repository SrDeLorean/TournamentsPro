import React, { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ChatSystem } from '@/components/chat/chat-system';

export default function MessagesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        badgeText="Mensajería Directa"
        title="CHAT Y CONTACTO"
        highlightTitle="ESPORTS."
        description="Canal de comunicación oficial entre Atletas, Capitanes de Equipos y Organizadores de Torneos."
      />

      <Suspense fallback={<div className="skeleton h-96 rounded-3xl" />}>
        <ChatSystem />
      </Suspense>
    </div>
  );
}
