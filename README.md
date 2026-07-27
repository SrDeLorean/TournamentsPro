# 🏆 TournamentsPro — Plataforma eSports Integral

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**TournamentsPro** es un sistema web integral de vanguardia para la administración, organización y gestión de competencias, ligas y torneos eSports multidisciplina (**EA SPORTS FC 26**, **VALORANT**, **Counter-Strike 2**, **League of Legends** y **Rocket League**). 

Diseñado bajo estándares de ingeniería de software modernos con **Next.js 16 (App Router)**, **TypeScript** y **MySQL**, la plataforma separa responsabilidades por módulos del sistema, ofreciendo dashboards dedicados para Administradores, Organizadores, Capitanes de Club y Atletas.

---

## 🚀 Características Principales del Sistema

### 1. 🛡️ Módulo de Gestión de Usuarios y Atletas (`/usuarios`)
* **Directorio Público de Atletas**: Muestra las fichas oficiales de los jugadores con estadísticas eSports, trofeos, roles y biografía.
* **Sistema de Roles eSports**: Gestión de accesos y permisos jerárquicos: `Administrador`, `Organizador`, `Capitán` y `Jugador`.
* **Sanciones y Baneos Disciplinarios**: Menú de desbaneo en tiempo real, registro de causa justa de sanción y bloqueo inmediato de acceso (`HTTP 403 Forbidden`).
* **Control de Contraseñas Seguras**: Cambio de contraseña obligatorio en creación y opcional en edición, con soporte para guardado parcial dinámico en MySQL.

### 2. 🏢 Módulo de Organizaciones Madre (`/organizaciones`)
* **Directorio de Sedes Oficiales**: Fichas enriquecidas con identidad visual corporativa.
* **Multimedia Optimizado WebP**: Escudo/Logo oficial y Banner panorámico HD.
* **Datos de Prestigio**: Año de fundación, país de sede, rating eSports (`★ 4.98`), sitio web oficial y redes sociales.
* **Asignación de Organizadores**: El Administrador puede vincular organizadores específicos a cada Organización Madre.

### 3. 🛡️ Módulo de Clubes y Escuadras (`/equipos`)
* **Directorio Multidisciplina Global**: Vista unificada (`TODAS LAS DISCIPLINAS`) o filtrada por juego.
* **Insignias de Disciplina eSports**: Badges con iconos y colores oficiales de cada juego (`EA FC 26`, `VALORANT`, `CS2`, `LoL`, `Rocket League`).
* **Filtros eSports Avanzados**: Filtrado por plataforma (`CROSSPLAY`, `PS5`, `PC`, `Xbox`) y estado del club (`Reclutando`, `Plantilla Completa`, `Inactivo`).

### 4. 🏆 Panel de Control del Organizador eSports (`/dashboard`)
* **Selector de Disciplina en Tiempo Real**: Al alternar de juego, el panel y toda la navegación lateral adaptan su interfaz y filtran exclusivamente los torneos, fixtures y escuadras de ese juego.
* **Selector de Modalidades de Juego**:
  * **EA SPORTS FC 26**: `Clubes Pro 11v11`, `Ultimate Team 1v1`, `Parejas Co-Op 2v2`.
  * **VALORANT**: `Competitivo 5v5`, `Swiftplay 5v5`, `Spike Rush 5v5`.
  * **CS2**: `Competitivo 5v5`, `Wingman 2v2`.
  * **LEAGUE OF LEGENDS**: `Grieta del Invocador 5v5`, `ARAM 5v5`.
  * **ROCKET LEAGUE**: `Estándar 3v3`, `Duos 2v2`, `Individual 1v1`.
* **Generador de Fixtures Simultáneos**: Creación automática de rondas de liga con horarios sincronizados.
* **Módulo de Visto Bueno (Homologación)**: Revisión y aprobación de marcadores reportados por capitanes con comprobantes de captura WebP.

### 5. 🔔 Sistema Estandarizado de Alertas y Notificaciones CRUD (`CrudAlertBanner`)
* **Superposición Flotante (`z-[99999]`)**: Las alertas emergen en la esquina superior derecha por encima de cualquier ventana modal o fondo oscuro.
* **Seguimiento Temporal en Tiempo Real**: Muestra el estado activo (`⏳ PROCESANDO`), la **hora de inicio exacta** (`HH:mm:ss`), la **hora de término** y la confirmación de persistencia (`✅ Éxito` o `❌ Error`).

### 6. 🎨 Estándar Global de Componentes de Interfaz
* **`DataTable`**: Tabla interactiva reutilizable con ordenación por columna, paginación dinámica, selector de filas por página y búsqueda global.
* **`ModalForm`**: Formulario modal estandarizado con un único botón de cierre y soporte para carga WebP.
* **`ConfirmModal`**: Modal de confirmación para acciones destructivas y baneos disciplinarios.
* **`ImageUploadCard`**: Convertidor y cargador de imágenes optimizadas en formato WebP HD.

---

## 🛠️ Arquitectura y Stack Tecnológico

* **Frontend**: Next.js 16 (App Router con Turbopack), React 19, TailwindCSS, Lucide React Icons.
* **Backend & APIs**: Endpoints API en Server Routes de Next.js (`/api/admin/users`, `/api/admin/organizations`, `/api/admin/teams`, `/api/matches/approval`, `/api/organizer/fixture`, `/api/auth/login`, `/api/auth/register`).
* **Base de Datos**: MySQL 8.0 / MariaDB con pool de conexiones `mysql2` y sanitización automática contra errores de bind SQL.
* **Autenticación**: Sesiones persistentes basadas en JWT/LocalStorage con flujo alternativo de Google OAuth.

---

## 🗄️ Esquema de la Base de Datos MySQL

El sistema utiliza una base de datos relacional orientada a eSports:

```sql
-- Tabla de Usuarios y Atletas
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

-- Tabla de Organizaciones Madre
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

-- Tabla de Equipos y Escuadras
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
  logo_url TEXT DEFAULT NULL,
  banner_url TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 💻 Instalación y Configuración Local

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/TournamentsPro.git
cd TournamentsPro
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tournamentspro
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Inicializar la Base de Datos MySQL
Inicia tu servidor MySQL (XAMPP o MySQL Server standalone) y crea la base de datos `tournamentspro`.

### 5. Ejecutar el Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para interactuar con el sistema.

---

## 📦 Compilación para Producción

Para validar el tipado estricto de TypeScript y generar el build optimizado de Next.js:

```bash
npm run build
npm run start
```

---

## 📂 Estructura del Proyecto

```text
TournamentsPro/
├── src/
│   ├── app/                    # Next.js App Router (Rutas y Endpoints API)
│   │   ├── api/                # Endpoints REST (Users, Teams, Organizations, Matches)
│   │   ├── club/               # Módulo de Matchday y Plantilla del Club
│   │   ├── equipos/            # Módulo de Gestión y Directorio de Clubes
│   │   ├── organizaciones/     # Módulo de Organizaciones Madre
│   │   ├── usuarios/           # Módulo de Gestión de Usuarios y Atletas
│   │   ├── dashboard/          # Dashboards de Admin y Organizador
│   │   └── page.tsx            # Página Principal / Landing eSports
│   ├── components/             # Componentes React de UI y Módulos
│   │   ├── admin/              # Componentes de Administración Global
│   │   ├── layout/             # Header, Sidebar y Sub-navbar Estandarizados
│   │   ├── organizer/          # OrganizerDashboardView y Módulos de Fixtures
│   │   ├── teams/              # TeamDirectory y TeamProfileView
│   │   └── ui/                 # Estándar Global UI (DataTable, ModalForm, CrudAlertBanner)
│   └── lib/                    # Configuración de Base de Datos MySQL y Data Store
├── public/                     # Archivos estáticos y subidas de imágenes WebP
├── README.md                   # Documentación principal del proyecto
├── package.json                # Dependencias y scripts de ejecución
└── tsconfig.json               # Configuración de TypeScript
```

---

## 📄 Licencia

Este proyecto se encuentra bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

<p align="center">
  Desarrollado con ❤️ para la comunidad global de eSports.
</p>
