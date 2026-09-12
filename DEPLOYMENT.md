# Despliegue de producción en Hostinger

TournamentsPro usa Next.js con servidor Node.js. No debe publicarse como un conjunto de HTML estático ni iniciarse desde una carpeta `.next` parcial.

## Generar el artefacto

```bash
npm ci
npm run build
```

El comando produce `.next/standalone` y luego verifica automáticamente que contenga:

- `server.js`;
- `.next/static` con CSS y JavaScript;
- `public` con imágenes y recursos;
- `deployment-manifest.json` con el identificador y conteo del build.

El verificador elimina y rechaza cualquier `.env*` dentro del standalone. Las credenciales
de base de datos, `JWT_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` deben configurarse como variables
privadas del proceso Node.js en hPanel; nunca deben copiarse a `public_html` ni al artefacto.

Cada ejecución de `npm run build` crea también un `NEXT_DEPLOYMENT_ID` único. No use
`npm run build:next` para publicar: ese comando existe solamente para diagnóstico local.

Si falta alguno de esos recursos el build falla. Esto evita publicar páginas que respondan HTML pero aparezcan sin estilos después de recargar.

## Configurar Hostinger

- Tipo de aplicación: Node.js.
- Raíz de la aplicación: raíz del repositorio.
- Comando de compilación: `npm ci && npm run build`.
- Comando de inicio: `npm run start`.
- Versión de Node.js: 22 LTS o una versión compatible con Next.js 16.
- Configure `DATABASE_PROVIDER=mysql` como variable privada del proceso en hPanel.
- No configure `public` como raíz web de una aplicación estática.
- El proxy de Hostinger debe enviar también `/_next/*`, `/api/*` y las rutas dinámicas al mismo proceso Node.js.
- En hPanel, desactive temporalmente la caché/CDN durante la primera publicación corregida y pulse **Purgar caché** antes de volver a activarla.

Las variables `PORT` y `HOSTNAME` son leídas por el servidor standalone. Hostinger normalmente define `PORT`; no debe fijarse manualmente en el código.

## Comprobar una publicación

Con la aplicación iniciada:

```bash
APP_BASE_URL=https://su-dominio.example SMOKE_ROUTE=/eafc26/jugadores npm run smoke:production
```

La prueba solicita la página dos veces —incluyendo una recarga sin caché— y valida todos los CSS y JavaScript referenciados. Debe terminar con `Production reload OK`.

## Puerta de verificación de lanzamiento

Antes de publicar, ejecute `npm run verify:release-config` con las variables reales del
proceso de destino. El preflight comprueba que el proveedor de base de datos esté
declarado, que `JWT_SECRET` no sea un valor de ejemplo y que las credenciales de
Supabase, si se usa, estén configuradas del lado del servidor. No imprime secretos
ni se conecta a la base de datos. Actualmente bloquea el proveedor Supabase
porque varios flujos de escritura aún requieren transacciones atómicas no soportadas
por ese adaptador; use MySQL para publicar hasta resolver esa compatibilidad.
El workflow también ejecuta esta comprobación: configure la variable
`DATABASE_PROVIDER=mysql` en el entorno `production` de GitHub y mantenga el mismo
valor en hPanel. Deben existir los secretos privados `DB_HOST`, `DB_USER`,
`DB_PASSWORD`, `DB_NAME` y `JWT_SECRET`; el deploy falla si falta alguno.

En un entorno **staging aislado**, configure cuatro cuentas de prueba con los roles
Administrador, Organizador, Capitán y Jugador. Entregue sus identificadores y
contraseñas mediante variables privadas `E2E_ADMIN_IDENTIFIER`/
`E2E_ADMIN_PASSWORD`, `E2E_ORGANIZER_IDENTIFIER`/
`E2E_ORGANIZER_PASSWORD`, `E2E_CAPTAIN_IDENTIFIER`/
`E2E_CAPTAIN_PASSWORD` y `E2E_PLAYER_IDENTIFIER`/
`E2E_PLAYER_PASSWORD`. No registre esos valores en Git ni los imprima en logs.

Con `PLAYWRIGHT_BASE_URL` apuntando a staging y
`PLAYWRIGHT_SKIP_WEBSERVER=1`, ejecute:

```bash
npm run test:e2e:release
```

Este comando falla si falta una sola credencial. Comprueba el inicio de sesión,
la cookie `HttpOnly`, la sesión, el dashboard y que Capitán/Jugador no puedan
listar usuarios administrativos. También envía solicitudes administrativas con
datos deliberadamente inválidos para verificar la autorización y la defensa CSRF
sin crear registros. El inicio de sesión sí crea una sesión de prueba. La ejecución normal
de `npm run test:e2e` en CI puede omitir pruebas autenticadas cuando no tiene
secretos, por lo que **un CI verde no reemplaza esta verificación de staging**.

Para Supabase, los tests locales solo verifican el contrato del archivo
`supabase_permissions.sql`; no demuestran que esté aplicado en el proyecto remoto.
Antes de autorizar una publicación, un operador debe aplicar el SQL aprobado y
comprobar en la base de destino que `anon` y `authenticated` no tengan acceso al
esquema, tablas ni a `consume_security_rate_limit`, mientras `service_role` conserve
el acceso necesario. Puede ejecutar la consulta de solo lectura
`supabase_verify_permissions.sql` en el SQL Editor para revisar esos permisos sin
mostrar secretos. También debe probar los flujos de escritura y su atomicidad
con el proveedor seleccionado. Si las transacciones requeridas por la lógica de
negocio siguen sin soporte en Supabase, **no publique con ese proveedor**.

## Actualizaciones

El workflow de despliegue solo se inicia para un `push` a `main` del repositorio original
cuando el workflow `CI` del mismo commit termina correctamente. Los pull requests y forks no
tienen acceso a secretos de producción ni pueden disparar una publicación.

Cada publicación debe reemplazar el artefacto completo. No mezcle `.next/static` de un build con `server.js` de otro: los nombres contienen hashes y una mezcla genera errores 404 únicamente después de ciertas recargas o navegaciones.

El HTML de la aplicación se entrega con `no-store` para impedir que hCDN conserve durante
un año referencias a chunks eliminados. Los CSS y JavaScript con hash continúan usando caché
inmutable, por lo que esta protección no sacrifica el cacheado de los recursos pesados.
