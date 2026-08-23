# 🧠 CONTEXTO COMPLETO DEL PROYECTO: TOURNAMENTSPRO (Para Modelos GPT / ChatGPT / Antigravity)

Este documento contiene el contexto integral de arquitectura, modelo de datos, convenciones de código, reglas de negocio y estado del proyecto **TournamentsPro**. Puedes adjuntar o copiar este archivo en cualquier sesión de GPT para que la IA comprenda el sistema al 100% de manera inmediata.

---

## 📌 1. Visión General del Sistema

**TournamentsPro** es una plataforma web integral de alto rendimiento para la administración, gestión y organización de competencias, ligas y torneos eSports multidisciplina (**EA SPORTS FC 26**, **VALORANT**, **Counter-Strike 2**, **League of Legends** y **Rocket League**).

### Roles del Sistema:
1. **Administrador (`Administrador`)**: Control total del sistema, gestión CRUD de usuarios y atletas, asignación/desbaneo disciplinario, gestión de organizaciones madre y clubes.
2. **Organizador (`Organizador`)**: Gestión de ligas por juego eSports, selección de modalidades de juego, generación de fixtures simultáneos, homologación ("Visto Bueno") de marcadores con capturas de pantalla.
3. **Capitán (`Capitán`)**: Administración de la plantilla de su club, reporte de resultados eSports con comprobantes y comunicación vía chat.
4. **Jugador (`Jugador`)**: Ficha pública de atleta, estadísticas eSports, historial de transferencias y postulaciones.

---

## 🛠️ 2. Stack Tecnológico & Arquitectura

* **Framework Core**: Next.js 16.2.11 (App Router con Turbopack) & React 19.
* **Lenguaje**: TypeScript (Estricto).
* **Estilos & UI**: TailwindCSS 3.4, Lucide React Icons, fuentes modernas (Inter/Roboto) y estética eSports en modo oscuro con efectos neón/cristal (Glassmorphism).
* **Base de Datos**: MySQL 8.0 / MariaDB utilizando el driver `mysql2` con **pool de conexiones dinámico** y sanitización automática de parámetros (`undefined` a `null`).
* **Multimedia**: Optimización y subida de imágenes en formato **WebP HD** (escudos 512x512, banners 1200px) mediante Canvas/Sharp.
* **Notificaciones CRUD**: Sistema unificado con `CrudAlertBanner` y `useCrudNotifier` posicionado en `z-[99999]` con timestamps exactos de inicio/término.

---

## 🗄️ 3. Esquema de Base de Datos MySQL (DDL)

```sql
-- TABLA DE USUARIOS Y ATLETAS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  gamertag VARCHAR(100) NOT NULL,
  role ENUM('Jugador', 'Capitán', 'Organizador', 'Administrador') DEFAULT 'Jugador',
  organization_id VARCHAR(100) DEFAULT NULL,
  primary_game_slug VARCHAR(50) DEFAULT 'eafc26',
  platform VARCHAR(50) DEFAULT 'CROSSPLAY',
  position VARCHAR(50) DEFAULT 'DFC',
  rating VARCHAR(20) DEFAULT '9.0',
  status VARCHAR(50) DEFAULT 'Activo',
  is_banned TINYINT(1) DEFAULT 0,
  ban_reason TEXT DEFAULT NULL,
  banned_at DATETIME DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL,
  banner_url TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA DE ORGANIZACIONES MADRE
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tag VARCHAR(10) NOT NULL,
  owner_id VARCHAR(100) DEFAULT NULL,
  allowed_games JSON DEFAULT NULL,
  logo_url TEXT DEFAULT NULL,
  banner_url TEXT DEFAULT NULL,
  country VARCHAR(100) DEFAULT 'Venezuela',
  founded_year VARCHAR(50) DEFAULT '2020',
  rating VARCHAR(20) DEFAULT '4.95',
  website VARCHAR(255) DEFAULT NULL,
  redes_sociales TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA DE EQUIPOS Y ESCUADRAS
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tag VARCHAR(10) NOT NULL,
  game_slug VARCHAR(50) NOT NULL,
  captain_id VARCHAR(100) DEFAULT NULL,
  captain_name VARCHAR(255) DEFAULT NULL,
  organization_id VARCHAR(100) DEFAULT NULL,
  platform VARCHAR(50) DEFAULT 'CROSSPLAY',
  status VARCHAR(50) DEFAULT 'Reclutando',
  is_banned TINYINT(1) DEFAULT 0,
  ban_reason TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL,
  banner_url TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA DE MATCHES / FIXTURE
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(100) PRIMARY KEY,
  tournament_id VARCHAR(100) NOT NULL,
  season_id VARCHAR(100) DEFAULT NULL,
  matchday_number INT NOT NULL,
  home_team_id VARCHAR(100) NOT NULL,
  away_team_id VARCHAR(100) NOT NULL,
  home_team_name VARCHAR(255) NOT NULL,
  away_team_name VARCHAR(255) NOT NULL,
  reported_score_home INT DEFAULT NULL,
  reported_score_away INT DEFAULT NULL,
  proof_url TEXT DEFAULT NULL,
  status ENUM('PENDIENTE', 'POR_REVISAR', 'TERMINADO', 'DISPUTADO') DEFAULT 'PENDIENTE',
  scheduled_time DATETIME DEFAULT NULL,
  approved_by VARCHAR(100) DEFAULT NULL,
  approved_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🗺️ 4. Mapa de Rutas de la Aplicación (App Router)

### Rutas Frontend (Vistas):
- `/` — Landing Page principal eSports con carrusel de disciplinas y destacados.
- `/usuarios` — Módulo de Gestión de Usuarios/Atletas, Sanciones y Directorio Público.
- `/organizaciones` — Directorio y CRUD de Organizaciones Madre con Asignación de Organizadores.
- `/equipos` — Directorio Global Multidisciplina (`TODAS LAS DISCIPLINAS`) y CRUD de Escuadras.
- `/dashboard` — Dashboard General (Admin) y Panel de Control del Organizador (`OrganizerDashboardView`).
- `/club/matchday` — Centro de Reporte de Marcadores y Visto Bueno de Capitanes/Organizadores.
- `/login` / `/registro` — Portal de Autenticación con soporte Google OAuth.

### Rutas de API Backend (Server Routes):
- `GET/POST/PUT/DELETE /api/admin/users` — CRUD de usuarios, actualización parcial dinámica, desbaneo y cambio de contraseñas (`password_hash`).
- `GET/POST/PUT /api/admin/organizations` — CRUD de organizaciones madre, asignación de organizadores y datos de prestigio.
- `GET/POST/PUT /api/admin/teams` — CRUD de escuadras eSports, asignación de capitanes y baneos.
- `GET /api/teams` — Consulta pública de escuadras con filtro `gameSlug` (incluye opción `ALL`).
- `POST /api/matches/approval` — Proceso de Homologación / Visto Bueno de resultados por Organizadores.
- `POST /api/organizer/fixture` — Generador automático de calendario de partidos.

---

## 🧩 5. Estándares y Componentes Clave de UI

### `CrudAlertBanner` (`src/components/ui/crud-alert.tsx`)
- Notificador flotante con `fixed top-5 right-5 z-[99999]` para flotar por encima de cualquier ventana modal o fondo oscuro.
- Registra el estado activo (`⏳ Procesando...`), la **hora de inicio exacta** (`HH:mm:ss`), la **hora de término** y el resultado final (`✅ Éxito` o `❌ Error`).

### `DataTable` (`src/components/ui/data-table.tsx`)
- Componente genérico para tablas de administración con ordenación por columna, paginador dinámico (`rowsPerPage`), búsqueda en vivo e insignias personalizadas.

### `ModalForm` (`src/components/ui/modal-form.tsx`)
- Formulario modal con overlay oscuro (`z-50`), único botón de cierre, validaciones nativas y estilo de bordes neón configurables (`brandColor`).

### Sanitización de Parámetros en Base de Datos (`src/lib/db.ts`)
- La función `queryDB` mapea automáticamente cualquier valor `undefined` a `null` antes de enviarlo a `mysql2`, evitando el error `Bind parameters must not contain undefined`.

---

## 🎮 6. Disciplinas eSports y Modalidades Soportadas

El objeto `GAME_MODES` en `src/lib/games-data.ts` define las estructuras oficiales:

1. **EA SPORTS FC 26 (`eafc26`)**:
   - `Clubes Pro 11v11` (11v11)
   - `Ultimate Team 1v1` (1v1)
   - `Parejas Co-Op 2v2` (2v2)
2. **VALORANT (`valorant`)**:
   - `Competitivo 5v5` (5v5)
   - `Swiftplay 5v5` (5v5)
   - `Spike Rush 5v5` (5v5)
3. **COUNTER-STRIKE 2 (`csgo`)**:
   - `Competitivo 5v5` (5v5)
   - `Wingman 2v2` (2v2)
4. **LEAGUE OF LEGENDS (`lol`)**:
   - `Grieta del Invocador 5v5` (5v5)
   - `ARAM 5v5` (5v5)
5. **ROCKET LEAGUE (`rocketleague`)**:
   - `Estándar 3v3` (3v3)
   - `Duos 2v2` (2v2)
   - `Individual 1v1` (1v1)

---

## ⚡ 7. Reglas de Desarrollo & Convenciones

1. **No romper los contratos API existentes**: Al realizar un `UPDATE` en SQL, construir las consultas de forma dinámica para actualizar únicamente los campos que contengan datos y preservar los intactos.
2. **Null-Safety estricta en MySQL**: Utilizar `null` explícito en sustitución de `undefined`.
3. **Z-Index Layering**: Los banners de alerta deben mantener `z-[99999]` para asegurar visibilidad sobre ventanas modales (`z-50`).
4. **Validación de Compilación**: Todo cambio debe ser verificado ejecutando `npm run build` garantizando 0 errores de compilación y tipado estricto en TypeScript.
