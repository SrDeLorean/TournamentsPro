'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Boxes, LoaderCircle, ShieldCheck } from 'lucide-react';
import styles from './final-design-system-page.module.css';

const ProductionComponentsCatalog = dynamic(
  () => import('./components-showcase-client').then((module) => module.default),
  {
    ssr: false,
    loading: () => (
      <div className={styles.catalogLoading} role="status" aria-live="polite">
        <LoaderCircle />
        <div><strong>Cargando componentes reales</strong><span>Preparando especímenes, tablas, modales y módulos competitivos…</span></div>
      </div>
    ),
  },
);

function DeferredProductionCatalog() {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!boundary || shouldLoad) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: '600px 0px' });
    observer.observe(boundary);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={boundaryRef} className={styles.productionCatalog}>
      {shouldLoad ? (
        <ProductionComponentsCatalog />
      ) : (
        <div className={styles.catalogLoading} role="status">
          <LoaderCircle />
          <div><strong>Catálogo diferido</strong><span>Se cargará al acercarse a esta sección.</span></div>
        </div>
      )}
    </div>
  );
}

export function ComponentLibraryLab() {
  return (
    <section className={styles.productionLibrary} id="components">
      <header className={styles.sectionHeading}>
        <span>02</span>
        <div>
          <small>Production component library</small>
          <h2>Componentes reales, uno a uno</h2>
          <p>Esta sección monta las implementaciones reutilizables del sistema dentro de un entorno de demostración aislado. Conserva sus estilos e interacción local, pero desactiva autenticación y persistencia.</p>
        </div>
      </header>

      <div className={styles.productionNotice}>
        <Boxes />
        <div><strong>Modo de inspección seguro</strong><span>Los datos son demostrativos; las acciones sensibles se sustituyen por vistas previas locales.</span></div>
        <em><ShieldCheck />Sin operaciones persistentes</em>
      </div>

      <DeferredProductionCatalog />
    </section>
  );
}
