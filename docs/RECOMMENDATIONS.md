# Recomendaciones integrales de TournamentsPro

Fecha del análisis: 22 de agosto de 2026.

## Resumen ejecutivo

La prioridad principal era cerrar la autorización rota: varias rutas y Server Actions
aceptaban identidad, rol u organización desde el navegador. La primera fase ya deriva
el actor desde la cookie `tp_session`, vuelve a consultar el usuario en MySQL y aplica
permisos por rol, organización, equipo, competencia, partido o hilo de chat.

El segundo riesgo era la divergencia del esquema: la aplicación ejecutaba DDL durante
peticiones normales y mezclaba dos esquemas SQL con un cliente Prisma residual. El DDL
dinámico se consolidó en migraciones versionadas y se añadió una API transaccional.

## Estado por prioridad

### P0 — Seguridad de acceso

Completado:

- Autenticación obligatoria y actor vigente de base de datos para APIs administrativas,
  equipos, temporadas, fixtures, partidos, transferencias, chat, plantillas y competiciones.
- Matriz de permisos central para Administrador, Organizador, Capitán/Encargado y Jugador.
- Eliminación de `requesterRole` y de identificadores del actor como fuentes de autoridad.
- Alcance de Organizador limitado a su organización; gestión de equipo limitada a su
  capitán, encargados u organización responsable.
- Respuesta administrativa de usuarios sin `password_hash`.
- Google Identity Services verificado criptográficamente (`aud`, emisor, expiración y
  email verificado) y emisión de una cookie real HttpOnly.
- Sesión del frontend hidratada desde `/api/auth/session`; retirada de tokens y sesiones
  de `localStorage`.
- Eliminación de credenciales demo, contraseñas predeterminadas y usuarios sintéticos.
- Contraseñas nuevas con mínimo de 10 caracteres, letra y número.
- Carga de imágenes limitada por identidad/propiedad; SVG bloqueado y rutas saneadas.
- Proxy de sesión para panel, mensajería y áreas privadas de atleta/club.
- `JWT_SECRET` obligatorio en producción.

Pendiente antes de exposición pública:

- Sustituir los límites de tasa en memoria por Redis/MySQL con claves por IP y cuenta,
  ventanas para login, registro, Google, chat y uploads, y bloqueo progresivo auditable.
- Añadir defensa CSRF explícita para mutaciones basadas en cookie: validación estricta de
  `Origin`/`Host` y token de doble envío donde haya clientes de otros orígenes.
- Añadir verificación de email, recuperación de contraseña y reautenticación para cambiar
  contraseña, email o segundo factor.
- Implementar revocación de sesiones usando `sessionId`, rotación de refresh tokens y
  cierre de todas las sesiones después de cambio de contraseña o ban.
- Definir CSP, `frame-ancestors`, HSTS, `Referrer-Policy` y límites de tamaño en el proxy.
- Persistir auditoría inmutable: actor, sesión, IP confiable, recurso, acción, antes/después
  y resultado. Nunca registrar secretos, hashes ni credenciales de Google.

### P0 — Integridad y concurrencia

Completado:

- `withTransaction`, `queryRows` y `executeCommand` sobre una sola conexión MySQL.
- Runner de migraciones con checksum, orden estricto, `GET_LOCK` y tabla
  `schema_migrations`.
- Eliminación de `CREATE TABLE` y `ALTER TABLE` en servicios y Route Handlers.
- Eliminación del fallback a equipos globales al generar un fixture sin inscritos.

Pendiente:

- Llevar a una transacción con `SELECT ... FOR UPDATE` y actualizaciones condicionales:
  generación/regeneración de fixture; aceptación de contrato; traspaso extraordinario;
  reporte/aprobación de partido y avance de playoff; alta/baja de plantilla; inscripción
  individual; creación de equipo/competición/organización y reasignaciones masivas.
- Comprobar `affectedRows` en cada transición de estado para impedir doble aceptación,
  doble avance de llave o sobrecupo por carrera.
- Añadir unicidad canónica a chats directos y unicidades de solicitudes/ofertas pendientes,
  cupos, slots de fixture y roster según la dimensión real de organización.
- Consolidar implementaciones duplicadas de fixtures, ofertas y expulsión de plantillas en
  un único servicio de dominio.

### P1 — Esquema y despliegue de datos

Completado:

- MySQL/mysql2 queda como única capa de acceso en ejecución; el cliente Prisma residual
  fue retirado.
- Migración reconciliadora para columnas/tablas usadas en runtime y documentación de uso.
- Scripts `db:migrate`, `db:migrate:verify` y `db:migrate:check`.

Pendiente por entorno:

- Capturar `SHOW CREATE TABLE` e `INFORMATION_SCHEMA` de cada base antes de aplicar cambios.
- Construir un baseline fresco corregido: crear FKs circulares al final, incluir todas las
  columnas reales y reconciliar enums (`Capitan/Capitán/Encargado`, `CONCLUIDO`).
- Normalizar `organization_name` a `organization_id` y fijar la unicidad correcta del roster.
- Revisar los dobles `ON DELETE CASCADE`, especialmente owner/organización, para impedir
  borrados masivos accidentales.
- Separar seeds de migraciones y retirar usuarios/contraseñas demo de cualquier seed de
  producción.
- Probar en CI una base vacía y una copia anonimizada de producción. Por los commits
  implícitos del DDL MySQL, usar backup y cambios forward-only/expand-contract.
- Archivar `database_schema.sql`; mantener un único snapshot generado desde migraciones.

### P1 — React y Next.js

Completado:

- Corregidas las 11 infracciones de Rules of Hooks detectadas.
- Sesión central basada en cookie y Google GIS real.
- Optimización global de imágenes activada y banner principal migrado a `next/image`.
- Retirados React Query y Supabase porque no tenían consumidores, junto con `next-intl`,
  `nuqs` y `zustand` sin uso.
- Build actualizado y verificado con Next.js 16.3.2.

Pendiente:

- Reducir las 880 advertencias heredadas visibles en lint: `any`, imports/variables sin uso,
  efectos que copian estado derivado, dependencias de efectos e imágenes HTML.
- Migrar cada fetch de dominio a una única estrategia. Si se reincorpora React Query,
  hacerlo junto a consumidores reales, claves por dominio e invalidación de mutaciones.
- Convertir páginas estáticas o wrappers sin hooks en Server Components y mantener islas
  cliente pequeñas.
- Migrar `GameLogo`, avatar, banderas, tarjetas e inputs de imagen a `next/image` con
  `sizes`; usar `unoptimized` solo para previews blob/data locales.
- Convertir `public/images/games/lol.png` a WebP/AVIF dimensionado y verificar/borrar los
  fondos duplicados no referenciados.
- Unificar `apiFetch`, el contrato de error y los DTOs; usar `unknown` más validadores en
  los bordes en vez de propagar `any`.

### P1 — Calidad, pruebas y operaciones

Completado:

- Vitest configurado con pruebas unitarias de la matriz de autorización.
- Flujo CI para migraciones, lint, pruebas y build.
- ESLint sin errores bloqueantes; TypeScript y build de producción aprobados.
- Dependencias actualizadas: `npm audit` informa 0 vulnerabilidades.
- `.env.example`, modelo de seguridad y reglas de despliegue documentados.

Pendiente:

- Pruebas de integración para cada permiso positivo/negativo y cada transición concurrente.
- Pruebas E2E para login, Google, alta de equipo, inscripción, fixture, reporte/aprobación,
  transferencias, upload y chat.
- Sembrar datos de test deterministas; nunca depender de la base local del desarrollador.
- Añadir métricas y alertas para errores 401/403/429, fallos de migración, latencia SQL,
  colisiones de transición, tamaño de upload y fallos de Google.
- Ejecutar backups verificados, prueba periódica de restauración y un runbook de rollback.
- Sacar `TournamentsPro.zip` y `deploy-hostinger.tar.gz` del historial Git y guardarlos en
  almacenamiento de releases. Borrar los binarios del historial requiere coordinación
  porque reescribe hashes del repositorio.

## Criterios de salida recomendados

No publicar la aplicación hasta que se cumplan, como mínimo:

1. Todas las mutaciones sensibles tienen prueba de autorización negativa.
2. Fixtures, ofertas, traspasos y resultados usan transacciones con locks/CAS.
3. La migración se prueba sobre backup anonimizado y existe restauración verificada.
4. Rate limiting persistente y CSRF están activos en el entorno público.
5. No hay credenciales demo ni secretos en repositorio, bundle o logs.
6. CI, `npm audit`, pruebas y build quedan verdes con las variables de producción validadas.
