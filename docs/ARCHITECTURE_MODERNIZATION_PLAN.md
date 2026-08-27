# Plan de modernización de páginas, UI y datos

Actualizado: 26 de agosto de 2026.

## Objetivo

Reducir el código y acoplamiento por página, generar rutas optimizadas con Next.js y mantener un sistema de diseño ajustable que produzca cambios consistentes en toda la aplicación.

## Principios obligatorios

1. `page.tsx` compone una ruta; la interacción vive en componentes de `src/features`.
2. Las páginas son Server Components salvo que la ruta completa necesite APIs del navegador.
3. Los valores visuales compartidos se expresan mediante tokens CSS, nunca mediante colores o medidas duplicados por página.
4. SQL, reglas de negocio y presentación pertenecen a capas diferentes.
5. El esquema evoluciona con migraciones expandir–migrar–contraer y sin borrar compatibilidad en la misma entrega.

## Sistema de diseño global

El `DesignProvider` aplica preferencias al elemento `html` y las guarda bajo una clave versionada. El editor de `/[gameSlug]/UI` controla:

- escala global;
- densidad de espacios y controles;
- radios de controles y tarjetas;
- intensidad de movimiento;
- opacidad y desenfoque de superficies;
- color global de interacción.

Los componentes reutilizables deben consumir `--ui-*`, `--bg-*`, `--text-*`, `--border-*` y `--accent-*`. Una modificación del editor debe mantenerse al navegar y afectar tanto páginas públicas como paneles administrativos.

## Fases y estado

### 1. Fundaciones — implementada

- Tokens globales configurables y persistentes.
- Editor visual dentro de la página UI.
- Pruebas de normalización de preferencias.
- Shell de servidor por juego, metadata, rutas estáticas, errores y 404.

### 2. Páginas delgadas — implementada

- Las 30 rutas cumplen un máximo automático de 150 líneas por `page.tsx`.
- `usuarios`, `equipos`, `organizaciones`, autenticación, dashboard, inicio y catálogos UI ahora tienen shells de servidor pequeños.
- Sus vistas cliente fueron trasladadas a módulos de dominio en `src/features`.
- Próximo corte: separar tabla, filtros, formulario y detalle en componentes menores de 250–300 líneas.

### 3. Portal por juego — implementada en rutas

- Generar combinaciones conocidas de juego/sección.
- Sustituir progresivamente el conmutador cliente central por componentes de ruta independientes.
- Mantener carga diferida para fixture, clasificación, transferencias y analítica.
- La carga, normalización y filtrado de jugadores vive en un hook de dominio independiente del render del portal.

### 4. Datos — fase expandir implementada

- `organization_games` normaliza disciplinas por organización.
- Backfill desde `allowed_games` y escritura dual transaccional.
- `allowed_games` se conserva hasta migrar todas las lecturas y verificar entornos.
- Siguiente fase: lecturas normalizadas, perfiles por juego y retirada posterior de columnas duplicadas de partidos.

### 5. Mega-vistas — en curso

- El cálculo de clasificación se extrajo a un modelo puro con pruebas de puntos, desempates y exclusión de playoffs.
- Los contratos y utilidades de fixture se extrajeron a un módulo propio y testeable.
- Próximos cortes: filtros, calendario, tabla de encuentros, tablas de posiciones y bracket como componentes independientes.

### 6. Objetivos medibles

- Barrera automática final: ninguna `page.tsx` sobre 150 líneas.
- Presupuesto de deuda: ningún componente nuevo sobre 300 líneas y ningún mega-componente histórico puede crecer.
- Ningún componente de dominio sobre 300 líneas.
- Menos de ocho páginas cliente.
- Cero SQL directo en `src/app`.
- Una sola columna canónica para competencia y equipos local/visitante en partidos.
- Lint, pruebas, verificación de migraciones y build obligatorios en cada corte.
