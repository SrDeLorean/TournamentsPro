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

Si falta alguno de esos recursos el build falla. Esto evita publicar páginas que respondan HTML pero aparezcan sin estilos después de recargar.

## Configurar Hostinger

- Tipo de aplicación: Node.js.
- Raíz de la aplicación: raíz del repositorio.
- Comando de compilación: `npm ci && npm run build`.
- Comando de inicio: `npm run start`.
- Versión de Node.js: 22 LTS o una versión compatible con Next.js 16.
- No configure `public` como raíz web de una aplicación estática.
- El proxy de Hostinger debe enviar también `/_next/*`, `/api/*` y las rutas dinámicas al mismo proceso Node.js.

Las variables `PORT` y `HOSTNAME` son leídas por el servidor standalone. Hostinger normalmente define `PORT`; no debe fijarse manualmente en el código.

## Comprobar una publicación

Con la aplicación iniciada:

```bash
APP_BASE_URL=https://su-dominio.example SMOKE_ROUTE=/eafc26/jugadores npm run smoke:production
```

La prueba solicita la página dos veces —incluyendo una recarga sin caché— y valida todos los CSS y JavaScript referenciados. Debe terminar con `Production reload OK`.

## Actualizaciones

Cada publicación debe reemplazar el artefacto completo. No mezcle `.next/static` de un build con `server.js` de otro: los nombres contienen hashes y una mezcla genera errores 404 únicamente después de ciertas recargas o navegaciones.
