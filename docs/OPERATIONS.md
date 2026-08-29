# Runbook operativo

## Despliegue

1. Crear un backup consistente y comprobar que el archivo no está vacío.
2. Verificar variables obligatorias sin imprimir sus valores: MySQL, `JWT_SECRET`, Google
   Client ID y `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` estable entre instancias.
3. Ejecutar `npm ci`, `npm run db:migrate:check`, `npm test`, `npm run lint` y
   `npm run build` sobre el mismo commit que será desplegado. El script de build copia
   `public` y `.next/static` dentro de `.next/standalone`; no desplegar únicamente
   `server.js`, porque las rutas `/_next/static/*` quedarían incompletas.
4. Aplicar `npm run db:migrate` con una cuenta de migración separada.
5. Arrancar el artefacto standalone con `npm start` y una cuenta MySQL sin `ALTER`,
   `CREATE` ni `DROP`. En Hostinger, conservar `npm run build` como comando de build y
   `npm start` como comando de inicio para que HTML, CSS y JavaScript pertenezcan al mismo build.
6. Consultar `/api/health` y comprobar `status=ok`, MySQL disponible y `x-request-id`.
7. Ejecutar `npm run test:e2e` contra el nuevo entorno antes de enviar tráfico completo.
8. Supervisar 401/403/429, errores SQL y latencia durante el despliegue gradual.

### Contrato del proxy inverso

- `TRUST_PROXY` permanece desactivado por defecto. Solo establecer `TRUST_PROXY=true`
  cuando el balanceador o CDN confiable elimine cualquier valor entrante y escriba
  `X-Forwarded-For`/`X-Real-IP` con la dirección real. Nunca habilitarlo frente a acceso
  directo desde Internet.
- Sin ese contrato, los encabezados reenviados se ignoran. Los intentos de autenticación
  siguen limitados por cuenta normalizada, pero no existe un límite fiable por cliente.

## Restauración

- Los cambios DDL de MySQL pueden hacer commit implícito; no asumir rollback transaccional.
- Ante un fallo de migración, detener nuevas escrituras, conservar logs y el registro de
  `schema_migrations`, y restaurar el backup en una base nueva.
- Validar la restauración con `db:migrate:verify`, `/api/health` y la suite E2E antes de
  cambiar el endpoint de la aplicación.
- No reutilizar un backup que contenga sesiones activas sin revocarlas previamente.

## Archivo y retención

- La baja administrativa de equipos y organizaciones es lógica: cambia su estado a
  `Archivado`/`Archivada` y conserva partidos, auditoría y transferencias históricas.
- No se puede archivar una entidad con competencias activas asociadas; primero deben
  finalizarse o reasignarse mediante un proceso explícito.
- El archivo de un equipo cierra vacantes, caduca publicaciones y cancela ofertas pendientes.
- El archivo de una organización archiva sus equipos y cierra sus vacantes/publicaciones.
- No ejecutar `DELETE FROM teams` ni `DELETE FROM organizations` como operación normal.

## Incidentes de autenticación

1. Rotar `JWT_SECRET` solo si es necesario invalidar todas las sesiones inmediatamente.
2. Revocar sesiones específicas en base de datos para incidentes acotados.
3. Cambiar credenciales de Google y MySQL si existe exposición confirmada.
4. Buscar por `requestId`, actor, recurso y evento en la auditoría; no copiar tokens a tickets.
5. Documentar alcance, línea temporal, contención y acciones preventivas.

## Mantenimiento periódico

- Diario: backup automático, estado de salud, errores 5xx y agotamiento del pool MySQL.
- Diario: ejecutar `npm run security:housekeeping` con la cuenta runtime. El comando
  purga rate limits ya expirados y sesiones expiradas/revocadas después de
  `SECURITY_RATE_LIMIT_RETENTION_DAYS` (1 por defecto) y
  `SECURITY_SESSION_RETENTION_DAYS` (30 por defecto). Acepta valores entre 0 y 3650.
- Por release/CI: ejecutar `npm run security:housekeeping:check`; valida configuración y
  plan SQL sin conectarse ni eliminar filas.
- Semanal: `npm audit`, crecimiento de auditoría/rate limits y ofertas atascadas.
- Mensual: restauración de prueba, revisión de cuentas privilegiadas y sesiones antiguas.
- Por release: migración en staging con una copia anonimizada y prueba de concurrencia.
