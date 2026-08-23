# 🎮 TournamentsPro — Informe de Contexto del Proyecto & Estado Técnico

**Fecha de Generación**: 29 de Julio, 2026  
**Proyecto**: TournamentsPro (Sistema Integrado de Gestión eSports, Torneos y Clubes)  
**Tecnología Principal**: Next.js 16 (App Router), TypeScript, Vanilla CSS / Tailwind, MySQL (`tournamentspro` via `mysql2/promise`).

---

## 1. 📌 Resumen del Proyecto

TournamentsPro es una plataforma eSports de nivel profesional diseñada para la gestión de competencias, ligas simultáneas, fixture automatizado, perfiles de atletas, escuadras y mercado de fichajes para múltiples disciplinas eSports:
- **EA SPORTS FC 26** (`eafc26`)
- **VALORANT** (`valorant`)
- **LEAGUE OF LEGENDS** (`lol`)
- **COUNTER-STRIKE 2** (`csgo`)
- **ROCKET LEAGUE** (`rocketleague`)
- **FORTNITE** (`fortnite`)

---

## 2. 🏛️ Arquitectura & Modelo de Datos (Base de Datos MySQL)

La base de datos MySQL `tournamentspro` está completamente normalizada e indexada mediante **Claves Foráneas (`Foreign Keys`)** y restricciones en cascada para optimizar las consultas `JOIN` y garantizar la integridad referencial.

### 🔗 Matriz de Claves Foráneas (Foreign Keys) Activas

| Tabla Origen | Columna FK | Tabla Referenciada | Columna PK | Regla de Borrado / Actualización |
| :--- | :--- | :--- | :--- | :--- |
| `competitions` | `organization_id` | `organizations` | `id` | `ON DELETE SET NULL ON UPDATE CASCADE` |
| `competitions` | `organizer_id` | `users` | `id` | `ON DELETE SET NULL ON UPDATE CASCADE` |
| `competitions` | `season_id` | `seasons` | `id` | `ON DELETE SET NULL ON UPDATE CASCADE` |
| `competitions` | `game_slug` | `games` | `slug` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| `competition_teams` | `competition_id` | `competitions` | `id` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| `competition_teams` | `team_id` | `teams` | `id` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| `matches` | `competition_id` | `competitions` | `id` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| `matches` | `home_team_id` | `teams` | `id` | `ON DELETE SET NULL ON UPDATE CASCADE` |
| `matches` | `away_team_id` | `teams` | `id` | `ON DELETE SET NULL ON UPDATE CASCADE` |
| `match_reports` | `match_id` | `matches` | `id` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| `match_player_stats` | `match_id` | `matches` | `id` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| `seasons` | `organization_id` | `organizations` | `id` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| `teams` | `organization_id` | `organizations` | `id` | `ON DELETE SET NULL ON UPDATE CASCADE` |
| `teams` | `captain_id` | `users` | `id` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| `team_members` | `team_id` | `teams` | `id` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| `team_members` | `user_id` | `users` | `id` | `ON DELETE CASCADE ON UPDATE CASCADE` |

---

## 3. 🚀 Módulos y Funcionalidades Desarrolladas

### 3.1 🔒 Módulo del Organizador eSports (`http://localhost:3000/dashboard/competencias`)
- **Aislamiento por Organización**: El Organizador solo visualiza y gestiona las competencias pertenecientes a su propia Organización (`organization_id`). Los Administradores mantienen acceso global.
- **Creación y Asignación de Temporadas al Vuelo**: Selector de temporadas de la organización o creación instantánea (`createSeasonAction`) integrada en el modal.
- **3 Fechas Oficiales de Competencia**:
  1. `fecha_limite_inscripcion`: Cierre oficial de registros.
  2. `fecha_inicio`: Inicio del torneo y generación de fixture.
  3. `fecha_termino`: Finalización estimada.
- **Disciplinas Habilitadas por Organización (`allowed_games`)**: El modal de creación filtra la lista de disciplinas eSports según las autorizadas en `organization.allowed_games`.
- **Modalidades de Juego Dinámicas**: Formatos prehechos por disciplina:
  - **EA FC 26**: `11v11` (Clubes Pro), `2v2` (Parejas), `1v1` (Solo).
  - **Valorant / CS2**: `5v5` (Táctico Estándar).
  - **League of Legends**: `5v5` (Grieta), `3v3` (ARAM), `1v1` (Duelo).
  - **Rocket League**: `4v4`, `3v3`, `2v2`, `1v1`.
  - **Fortnite**: `escuadrones` (4v4), `trios` (3v3), `duos` (2v2), `solo` (1v1).

---

### 3.2 🏆 Detalle de Competencia e Inscripción (`http://localhost:3000/dashboard/competencias/[id]`)
- **Inscripción de Clubes**: Muestra y permite inscribir únicamente los equipos pertenecientes a la misma disciplina eSports de la competencia (`teams.game_slug = competition.game_slug`).
- **Inscripción de Atletas Directos (1v1, 2v2, Solo, Dúos)**: Para modalidades individuales, la pestaña se transforma dinámicamente en **Inscripción de Atletas / Jugadores Directos**. Inscribe al usuario mediante `enrollIndividualAthleteAction` manteniendo la integridad FK en MySQL.

---

### 3.3 📅 Fixture, Clasificación & Directorio de Clubes (`http://localhost:3000/eafc26/equipos`, `/eafc26/partidos` & `/valorant/UI`)
- **Directorio Táctico de Escuadras (`/eafc26/equipos`)**: Integración con `TacticalLoadingSkeleton` mostrando el escudo oficial de EA FC 26 en pulso neón con el mensaje `"SINCRONIZANDO ESCUADRAS Y CLUBES DE EA FC 26..."` y barra de carga dinámica viva que nace en un punto (`12%`) y progresa fluido hasta el `100%`. Se unificó la llamada a la BD en una sola promesa impidiendo parpadeos de contadores (`0 -> 29`).
- **Refactorización de Maquetado Basada en `/equipos` (`pt-4 sm:pt-6`)**: Se configuró la envolvente de la vista de partidos tomando como estándar exacto la arquitectura de la vista de equipos (`src/app/[gameSlug]/page.tsx`), otorgando la holgura y separación superior idéntica bajo el sub-navbar.
- **Eliminación Absoluta de Salto en Encabezado**: `PageHeader` se renderiza de forma fija y permanente en el DOM raíz de `FixtureScheduleView`, evitando desmontar o re-animar el componente al conmutar de carga a listo. El título permanece 100% inmóvil.
- **Sincronización Total del Loader de Carga (`Promise.all`)**: El `TacticalLoadingSkeleton` permanece activo en pantalla hasta que se completen de manera síncrona y paralela todas las consultas a la BD (Organizaciones, Competencias y Encuentros).
- **Estabilidad de Imagen de Fondo (`scrollbar-gutter: stable`)**: Se configuró la reserva permanente de la barra de scroll (`scrollbar-gutter: stable; overflow-y: scroll;`) y se homogenizó la opacidad a `opacity-20 dark:opacity-45` con altura `h-[600px]`. Esto evita cualquier recorte, desplazamiento o reajuste de tamaño de la imagen de portada cuando los datos terminan de cargar.
- **Carrusel 1 a 1 & Flechas a los Costados (`< [Fechas] >`)**: Las flechas `<` y `>` desplazan y seleccionan 1 fecha a la vez (`handlePrevDate` / `handleNextDate`) con auto-centrado de la fecha actual o más cercana.
- **Centrado de Calendario & Relleno de Fecha Activa**: El encabezado `FECHAS DISPONIBLES EN CALENDARIO` y su carrusel están perfectamente centrados. La fecha seleccionada posee un relleno vibrante `Cyan to Teal` (`from-cyan-400 via-cyan-500 to-teal-500`) con texto en negro de alta visibilidad, borde blanco de 2px y resplandor de selección (`ring-4 ring-cyan-400/40 shadow-cyan-500/50`).
- **Autodetección 100% Automática de Formato**: El sistema evalúa automáticamente los partidos (`group_name`, `round_name`) y los datos del torneo en la BD para conmutar sin intervención entre `LIGA`, `HÍBRIDO` y `PLAYOFF`.
- **Jerarquía y Formateo del Árbol de Playoffs**: Separación estricta en columnas independientes para `CUARTOS DE FINAL`, `SEMIFINALES`, `GRAN FINAL 🏆` y `TERCER LUGAR 🥉 (SEGUNDA FINAL)`.
- **Formateo Limpio de Slots Provisionales (`renderBracketTeamRow`)**: Slots con nombres como `"1° de Grupo A"` o `"Por Definir"` se representan limpiamente en cursiva `font-mono text-slate-400` sin mostrar avatares ficticios ni etiquetas 'PO'.
- **Sincronización Total entre Fixture y Clasificación**: Al generar un fixture en `/api/organizer/fixture`, la API inscribe automáticamente en `matches` los campos `tournament_id`, `competition_id`, `home_team_name`, `away_team_name`, `group_name` y `round_name`, y actualiza síncronamente el formato en `competitions` y `tournaments`.
- **Desglose Dinámico por Grupos en Formato Híbrido**: Genera tablas independientes por grupo (`GRUPO A`, `GRUPO B`) y desglosa las llaves de playoffs con la Segunda Final de Tercer Lugar (🥉).
- **Módulo de Reportar Encuentros (`/matchday`)**: Vista en Gestión Global (`src/components/matches/matchday-report-view.tsx`) con buscador por Club, selector de Disciplina eSports y Competencia.
- **Componente `CountryFlag` (`src/components/ui/country-flag.tsx`)**: Renderizado de imágenes de banderas a color (PNG/SVG) para solucionar la falta de compatibilidad con emojis de banderas en Windows (Chrome/Edge/Firefox).
- **Corrección de Desfasaje Horario UTC**: Reparado el desfasaje que convertía Lunes/Jueves 22:00 a Martes/Viernes 02:00 al guardar en base de datos.

---

### 3.4 🔁 Mercado de Transferencias y Traspasos Extraordinarios (`src/app/actions/transfers.ts`)
- **`ABIERTO`**: Fichajes libres y solicitudes directas entre atleta y club.
- **`CERRADO`**: Traspasos extraordinarios que requieren aprobación explícita del Organizador de la competencia (`organizer_approval_status = 'PENDIENTE_ORGANIZADOR'`).
- **`SIN_MERCADO`**: Roster congelado durante la competencia.

---

### 3.5 👥 Gestión Directa de Roster (`http://localhost:3000/equipos`)
- Modal `SquadRosterModal` (`src/components/teams/squad-roster-modal.tsx`) que permite agregar jugadores directamente a las escuadras. Excluye a jugadores asociados a otros clubes y los filtra por la Organización del organizador.

---

### 3.6 🎨 Layout del Organizador Reestructurado (`src/components/layout/admin-organizer-header.tsx` & `admin-organizer-sidebar.tsx`)
- **Barra Superior Principal (Top Header)**: Integra todas las vistas públicas en el centro (`Inicio`, desplegable de `Disciplinas`, `Partidos`, `Torneos`, `Equipos`, `Fichajes` y `Atletas`).
- **Navegación Dividida (Sidebar)**:
  - **🌐 GESTIÓN GLOBAL**: `Dashboard`, `Gestión de Competencias` (`/dashboard/competencias`), `Usuarios / Atletas`, `Equipos / Clubes`, `Reportar Encuentros`.
  - **🏆 GESTIÓN POR DISCIPLINA**: Selector de disciplina activa con sincronización automática de URL (`/eafc26/jugadores` $\rightarrow$ `/valorant/jugadores`) + subrutas públicas especializadas del submenú (`Portada`, `Competencias`, `Clasificación`, `Partidos`, `Traspasos`, `Equipos & Clubes`, `Jugadores` `/[activeGameSlug]/jugadores` [entre Equipos y Tops], `Tops & Rankings`, `Infografía`, `Datos`).

---

## 4. 📁 Estructura de Archivos Clave del Código

```text
TournamentsPro/
├── CONTEXTO_PROYECTO.md                      # Documento completo de contexto del proyecto
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   ├── competitions.ts              # Server Actions de competencias, inscripciones y formato
│   │   │   ├── seasons.ts                   # Server Actions para gestion de temporadas
│   │   │   ├── squads.ts                    # Server Actions para roster de equipos
│   │   │   ├── transfers.ts                 # Server Actions para mercado de transferencias
│   │   │   └── match-reports.ts             # Server Actions para actas y stats de partidos
│   │   ├── dashboard/
│   │   │   └── competencias/
│   │   │       ├── page.tsx                 # RSC Dashboard Competencias (Aislado por Organizacion)
│   │   │       ├── competitions-client.tsx   # Cliente con modal, disciplinas allowed y modalidades
│   │   │       └── [id]/
│   │   │           ├── page.tsx             # RSC Detalle Competencia (Filtrado de equipos/usuarios)
│   │   │           └── competition-tabs.tsx # Pestañas de detalle e inscripcion (Atletas vs Clubes)
│   │   └── eafc26/
│   │       └── partidos/page.tsx            # Vista publica de partidos y fixture paginado
│   ├── lib/
│   │   ├── auth-server.ts                   # Sesion del servidor y organizacion del usuario
│   │   ├── db.ts                            # Cliente de conexion MySQL con manejo de nulos
│   │   ├── fixture-date-scheduler.ts        # Algoritmo eSports de calculo de jornadas reales
│   │   └── games-data.ts                    # Catalogo de juegos y matriz GAME_MODE_OPTIONS
│   └── components/
│       └── teams/
│           └── squad-roster-modal.tsx       # Modal de gestion directa de plantilla por Organizacion
└── scratch/
    ├── apply-foreign-keys.js                # Migration script de Claves Foraneas en MySQL
    ├── check-fks.js                         # Verificador de FKs activas en MySQL
    └── seed-teams-and-captains.js           # Seed script de 48 equipos eSports y 48 capitanes
```

---

## 5. 🧪 Estado de Verificación y Compilación

- **Compilación Next.js**: `npm run build` ejecutado exitosamente (**37 de 37 rutas compiladas y prerenderizadas con 0 errores TypeScript/Turbopack**).
- **Base de Datos MySQL**: 20+ Claves Foráneas (`Foreign Keys`) activas y probadas.
- **Datos Iniciales**: 48 Equipos eSports (16 FC26, 16 Valorant, 16 LoL) con sus 48 capitanes asignados.
