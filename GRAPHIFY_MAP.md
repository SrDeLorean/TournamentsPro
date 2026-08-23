# 🕸️ GRAPHIFY — Mapa Estructural y Grafo de Navegación de TournamentsPro

Este documento fue generado aplicando la skill **Graphify** para mapear la arquitectura completa del proyecto, jerarquía de componentes, flujos de navegación y relaciones de datos en MySQL.

---

## 1. 🗺️ Grafo de Enrutamiento y Navegación (Next.js App Router)

```mermaid
graph TD
    Root["/ (Landing Page eSports)"] --> Login["/login"]
    Root --> Registro["/registro"]
    Root --> Usuarios["/usuarios (Directorio & Gestión Atletas)"]
    Root --> Organizaciones["/organizaciones (Sedes Madre)"]
    Root --> Equipos["/equipos (Directorio Global Escuadras)"]
    Root --> Dashboard["/dashboard (Panel Admin / Organizador)"]
    Root --> Matchday["/club/matchday (Reporte & Visto Bueno)"]
    Root --> PortalJuego["/[gameSlug] (Portal Dedicado eSports)"]

    PortalJuego --> SectionHome["/[gameSlug]/home"]
    PortalJuego --> SectionEquipos["/[gameSlug]/equipos"]
    PortalJuego --> SectionJugadores["/[gameSlug]/jugadores"]
    PortalJuego --> SectionMatches["/[gameSlug]/partidos"]
    PortalJuego --> SectionAjustes["/[gameSlug]/atleta/ajustes"]

    click Root "file:///c:/xampp/htdocs/TournamentsPro/src/app/page.tsx"
    click Usuarios "file:///c:/xampp/htdocs/TournamentsPro/src/app/usuarios/page.tsx"
    click Organizaciones "file:///c:/xampp/htdocs/TournamentsPro/src/app/organizaciones/page.tsx"
    click Equipos "file:///c:/xampp/htdocs/TournamentsPro/src/app/equipos/page.tsx"
    click Dashboard "file:///c:/xampp/htdocs/TournamentsPro/src/app/dashboard/page.tsx"
    click Matchday "file:///c:/xampp/htdocs/TournamentsPro/src/app/club/matchday/page.tsx"
```

---

## 2. 🧱 Grafo de Jerarquía de Layout y Componentes UI

```mermaid
graph TD
    AppLayout["RootLayout (layout.tsx)"] --> ThemeProv["ThemeProvider (next-themes)"]
    ThemeProv --> AuthProv["AuthProvider (useAuth)"]
    AuthProv --> LangProv["LanguageProvider"]
    LangProv --> HeaderNav["AdminOrganizerHeader"]
    LangProv --> GlobalSubNav["AdminGlobalSubnavbar"]
    LangProv --> SidebarNav["AdminOrganizerSidebar"]
    LangProv --> PageContent["Page Views"]
    LangProv --> CrudAlert["CrudAlertBanner (z-[99999])"]

    PageContent --> DataTableComp["DataTable"]
    PageContent --> ModalFormComp["ModalForm"]
    PageContent --> ConfirmModalComp["ConfirmModal"]
    PageContent --> ImageUploadComp["ImageUploadCard"]
```

---

## 3. 🔄 Grafo de Flujo de Datos y Conexión MySQL API

```mermaid
graph LR
    subgraph Frontend["Capa de Presentación (React 19)"]
        UsersView["/usuarios"]
        OrgsView["/organizaciones"]
        TeamsView["/equipos"]
        OrgDashboard["OrganizerDashboardView"]
    end

    subgraph Backend["Next.js Server API Routes"]
        ApiUsers["/api/admin/users & /api/users"]
        ApiOrgs["/api/admin/organizations"]
        ApiTeams["/api/admin/teams & /api/teams"]
        ApiApproval["/api/matches/approval"]
    end

    subgraph Database["Base de Datos MySQL"]
        DBQuery["src/lib/db.ts (queryDB null-safe)"]
        TblUsers[("users")]
        TblOrgs[("organizations")]
        TblTeams[("teams")]
        TblMatches[("matches")]
    end

    UsersView --> ApiUsers
    OrgsView --> ApiOrgs
    TeamsView --> ApiTeams
    OrgDashboard --> ApiApproval

    ApiUsers --> DBQuery
    ApiOrgs --> DBQuery
    ApiTeams --> DBQuery
    ApiApproval --> DBQuery

    DBQuery --> TblUsers
    DBQuery --> TblOrgs
    DBQuery --> TblTeams
    DBQuery --> TblMatches
```

---

## 📂 4. Mapa de Archivos por Módulo

- **Núcleo de Base de Datos**: `src/lib/db.ts` • `src/lib/api-types.ts` • `src/lib/auth.ts`
- **Catálogo eSports & Modalidades**: `src/lib/games-data.ts` (`GAME_MODES`, `GAMES_CATALOG`)
- **Gestión de Atletas**: `src/app/usuarios/page.tsx` • `src/app/api/admin/users/route.ts` • `src/app/api/users/route.ts`
- **Gestión de Organizaciones**: `src/app/organizaciones/page.tsx` • `src/app/api/admin/organizations/route.ts`
- **Gestión de Clubes**: `src/app/equipos/page.tsx` • `src/components/teams/team-directory.tsx` • `src/app/api/admin/teams/route.ts` • `src/app/api/teams/route.ts`
- **Panel Organizador**: `src/components/organizer/organizer-dashboard-view.tsx` • `src/components/layout/admin-organizer-sidebar.tsx`
