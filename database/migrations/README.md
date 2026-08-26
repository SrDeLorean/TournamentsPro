# Migraciones de base de datos

Este directorio es la fuente de verdad para cambios incrementales del esquema MySQL/MariaDB. Los archivos se aplican en orden por su prefijo numérico y, una vez aplicados, son inmutables: el runner registra su SHA-256 en `schema_migrations` y rechaza cualquier cambio posterior.

`database/baseline.sql` es la fotografía canónica para una instalación nueva. No reemplaza ni modifica las migraciones históricas: evita reproducir en una base vacía supuestos de upgrades, órdenes de tablas antiguos o FKs circulares prematuras.

## Uso

```bash
npm run db:migrate
npm run db:migrate:verify
npm run db:migrate:check
```

- `db:migrate` obtiene un bloqueo exclusivo en MySQL. En un esquema realmente vacío aplica el baseline y registra 0001-0004 como reconciliadas; si detecta tablas de aplicación existentes conserva la ruta incremental y aplica únicamente migraciones pendientes.
- `db:migrate:verify` es de solo lectura y falla si hay migraciones pendientes, archivos modificados o versiones aplicadas que ya no existen localmente.
- `db:migrate:check` valida baseline, nombres, versiones y contenido sin conectarse a la base de datos.

El runner carga las variables `.env*` de la raíz mediante `@next/env` y utiliza `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.

## Reglas

1. Crear archivos con formato `NNNN_descripcion.sql`; no reutilizar versiones.
2. No editar ni borrar una migración que ya haya sido aplicada.
3. Ejecutar migraciones antes de iniciar o desplegar la aplicación. El usuario de ejecución de la app no necesita permisos `CREATE` ni `ALTER`.
4. Separar datos demo de los cambios de esquema. Solo incluir datos indispensables e idempotentes para el funcionamiento del sistema.
5. El DDL de MySQL puede realizar commits implícitos. Diseñar migraciones reejecutables tras un fallo parcial, hacer respaldo antes de cambios destructivos y usar una secuencia expandir/migrar/contraer.

## Estrategia de bootstrap y upgrade

- El baseline no contiene `CREATE DATABASE` ni `USE`: solo actúa sobre `DB_NAME` y por ello también puede probarse en una base temporal aislada.
- Las FKs cíclicas `users ↔ organizations` y la autorreferencia de playoffs se agregan después de crear sus tablas.
- `schema_baselines` registra checksum y estado. Si MySQL deja DDL parcial durante un bootstrap, el siguiente intento se detiene en `STARTED` en vez de tratar ese esquema incompleto como una instalación antigua.
- Una instalación existente sin historial se reconoce por sus tablas de aplicación y recorre 0001-0004. Una instalación ya gestionada conserva sus checksums y recibe solo versiones pendientes.
- El baseline integra las columnas que usa el runtime (`banned_at`, configuración de fixture, ronda/tags de partido) y sus estados compatibles (`PROGRAMADO`, `CONCLUIDO`; estado de competencia como `VARCHAR` por sus alias históricos).

Para una prueba destructiva controlada, cree una base vacía con un nombre exclusivo, exporte `DB_NAME` solo para ese proceso, ejecute `db:migrate` y `db:migrate:verify`, inspeccione el esquema y elimine únicamente esa base temporal. Nunca use el nombre configurado para producción o desarrollo.

Los archivos `database_schema.sql` y `database_schema_v2.sql` se conservan temporalmente como referencias históricas; no sustituyen el historial de migraciones.
