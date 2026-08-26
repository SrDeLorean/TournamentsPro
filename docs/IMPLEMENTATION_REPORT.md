# Informe de implementación

Fecha de cierre: 22 de agosto de 2026.

## Implementado

- Autorización por sesión vigente, rol, organización, equipo, competencia, partido e hilo.
- Google GIS verificado, cookies HttpOnly, sesiones persistentes/revocables y Proxy access-only.
- CSRF Origin/Host, rate limiting MySQL por cuenta/cliente, fallback acotado y housekeeping.
- Auditoría redactada, request IDs, endpoint `/api/health` y cabeceras de seguridad.
- Schemas Zod para los bordes mutables principales y filas SQL tipadas en actions/APIs/repositorios.
- Transacciones, locks y CAS para fixtures, partidos/playoffs, plantillas, inscripciones,
  transferencias ordinarias/extraordinarias, ofertas, posts, equipos y organizaciones.
- Baseline canónico y cuatro migraciones con bootstrap/upgrade/drift/checksum/lock.
- DDL retirado de peticiones; Prisma y dependencias sin consumidores eliminados.
- Sesión frontend sin localStorage, páginas servidor adicionales y fetch JSON centralizado.
- Todas las imágenes TSX migradas a `next/image`; logo LoL reducido a 13,6 KB WebP.
- Archivos de release, diagnósticos y activos duplicados retirados del repositorio.
- CI, 70 pruebas Vitest, Playwright E2E, runbooks y `.env.example`.

## Verificación

- TypeScript: aprobado.
- ESLint: 0 errores; 356 advertencias estructurales restantes (antes 880).
- Vitest: 17 archivos y 70 pruebas aprobadas.
- Build Next.js 16.3.2: 39 páginas generadas correctamente.
- Baseline + cuatro migraciones: aprobados.
- Bootstrap vacío y upgrade legacy: comprobados en MariaDB temporal; base eliminada después.
- Housekeeping: dos operaciones válidas en modo check.
- E2E: las siete verificaciones HTTP finales pasaron. Las dos verificaciones que lanzan
  Chromium no pudieron repetirse por `spawn EPERM` del sandbox; habían pasado en la
  ejecución anterior con navegador autorizado.
- La última instalación de dependencias informó 0 vulnerabilidades. La repetición final
  de `npm audit` fue bloqueada por el límite del aprobador externo, no por un advisory.

## Decisiones y trabajo restante

- No se aplicaron migraciones ni housekeeping sobre la base real. Deben ejecutarse con
  backup y despliegue controlado siguiendo `OPERATIONS.md`.
- No se implementó borrado físico de equipos/organizaciones: se requiere primero una
  política de archivo, transferencia de dependencias y retención de auditoría.
- CSP conserva temporalmente `script-src 'unsafe-inline'` para mantener generación estática;
  una CSP con nonce obligaría render dinámico. Evaluar SRI/hash cuando sea estable.
- Quedan 356 warnings: principalmente modelos legacy con `any` y efectos acoplados. No se
  ocultaron; permanecen visibles en CI como deuda estructural sin bloquear el build.
- Resolver la semántica legacy de `competition_id` en transferencias extraordinarias antes
  de convertirla en columna canónica o retirar definitivamente esa consulta.
