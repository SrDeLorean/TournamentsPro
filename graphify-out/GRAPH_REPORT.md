# Graph Report - TournamentsPro  (2026-08-27)

## Corpus Check
- 386 files · ~520,306 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1900 nodes · 4438 edges · 201 communities (95 shown, 106 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c30d8563`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api-types.ts
- card.tsx
- cn
- user-profile-settings-view.tsx
- game-portal-client.tsx
- dependencies
- devDependencies
- compilerOptions
- GameConfig
- games-data.ts
- TeamData
- teams-page-client.tsx
- team-profile-view.tsx
- useAuth
- app/layout.tsx
- data-store.ts
- alter-orgs.js
- seed-all-data.js
- update-statuses.js
- api-schemas.ts
- competitions.ts
- eslint.config.mjs
- next.config.ts
- next-env.d.ts
- postcss.config.mjs
- auth.ts
- queryDB
- services.ts
- badge.tsx
- button.tsx
- authorizationErrorResponse
- security.ts
- getActionErrorMessage
- validation.ts
- chat.ts
- squads.ts
- design-provider.tsx
- auth-server.ts
- new-squad-management.tsx
- transfer-market.tsx
- transfers.ts
- migrate.mjs
- 🏆 TournamentsPro — Plataforma eSports Integral
- getServerUserSession
- plantilla-management-view.tsx
- public-competition-detail-view.tsx
- game-ui-showcase-client.tsx
- 5. Re-render Optimization
- 🧠 CONTEXTO COMPLETO DEL PROYECTO: TOURNAMENTSPRO (Para Modelos GPT / ChatGPT / Antigravity)
- 7. JavaScript Performance
- Quick Reference
- [section]/page.tsx
- classification-view.tsx
- fixture-schedule-view.tsx
- 3. 🚀 Módulos y Funcionalidades Desarrolladas
- scripts
- .findById
- logger.ts
- 6. Rendering Performance
- Fases y estado
- BaseRepository
- TeamRepository
- 3. Server-Side Performance
- security-housekeeping.mjs
- standings-view.tsx
- React Best Practices
- Sections
- language-provider.tsx
- repositories.ts
- check-architecture.mjs
- UserRepository
- Runbook operativo
- 1. Eliminating Waterfalls
- 2. Bundle Size Optimization
- club/matchday/page.tsx
- games-management-view.tsx
- CompetitionRepository
- React Best Practices
- Security model
- 🕸️ GRAPHIFY — Mapa Estructural y Grafo de Navegación de TournamentsPro
- 8. Advanced Patterns
- Migraciones de base de datos
- Informe de implementación
- Recomendaciones integrales de TournamentsPro
- [gameSlug]/layout.tsx
- 🛠️ Core Principles
- async-cheap-condition-before-await.md
- Prefer Statically Analyzable Paths
- server-hoist-static-io.md
- package.json
- telemetry-card.tsx
- schema-contract.test.ts
- 🪨 Caveman Execution Protocol
- 🚀 Superpowers Agentic Framework
- seed.mjs
- add-fortnite.js
- alter-matches-bracket.js
- apply-foreign-keys.js
- check-comp.js
- check-db.js
- check-fks.js
- check-matches-columns.js
- create-competitions-tables.js
- debug-schema.js
- fix-matches-id-column.js
- fix-matches-schema.js
- optimize-database.js
- seed-16-teams-users.js
- seed-16-teams-users-complete.js
- seed-teams-and-captains.js
- test-db-optimization.js
- test-seasons-competitions.js
- test-squads.js
- AGENTS.md
- advanced-effect-event-deps.md
- advanced-event-handler-refs.md
- advanced-init-once.md
- advanced-use-latest.md
- async-api-routes.md
- async-dependencies.md
- async-parallel.md
- async-suspense-boundaries.md
- bundle-barrel-imports.md
- bundle-conditional.md
- bundle-defer-third-party.md
- bundle-dynamic-imports.md
- bundle-preload.md
- client-event-listeners.md
- client-localstorage-schema.md
- client-passive-event-listeners.md
- client-swr-dedup.md
- js-batch-dom-css.md
- js-cache-function-results.md
- js-cache-property-access.md
- js-cache-storage.md
- js-combine-iterations.md
- js-early-exit.md
- js-flatmap-filter.md
- js-hoist-regexp.md
- js-index-maps.md
- js-length-check-first.md
- js-min-max-loop.md
- js-request-idle-callback.md
- js-set-map-lookups.md
- js-tosorted-immutable.md
- rendering-activity.md
- rendering-animate-svg-wrapper.md
- rendering-conditional-render.md
- rendering-content-visibility.md
- rendering-hoist-jsx.md
- rendering-hydration-no-flicker.md
- rendering-hydration-suppress-warning.md
- rendering-resource-hints.md
- rendering-script-defer-async.md
- rendering-svg-precision.md
- rendering-usetransition-loading.md
- rerender-defer-reads.md
- rerender-dependencies.md
- rerender-derived-state.md
- rerender-derived-state-no-effect.md
- rerender-functional-setstate.md
- rerender-lazy-state-init.md
- rerender-memo.md
- rerender-memo-with-default-value.md
- rerender-move-effect-to-event.md
- rerender-no-inline-components.md
- rerender-simple-expression-in-memo.md
- rerender-split-combined-hooks.md
- rerender-transitions.md
- rerender-use-deferred-value.md
- rerender-use-ref-transient-values.md
- server-after-nonblocking.md
- server-auth-actions.md
- server-cache-lru.md
- server-dedup-props.md
- server-parallel-fetching.md
- server-parallel-nested-fetching.md
- server-serialization.md
- _template.md
- lucide-react
- @next/env
- next-themes
- tailwind.config.ts
- public-asset-policy.test.ts

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 87 edges
2. `queryDB()` - 74 edges
3. `Button` - 67 edges
4. `getActionErrorMessage()` - 63 edges
5. `Badge()` - 53 edges
6. `GameConfig` - 50 edges
7. `cn()` - 48 edges
8. `GAMES_CATALOG` - 44 edges
9. `authorizationErrorResponse()` - 40 edges
10. `requireRequestActor()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `migrateGames()` --calls--> `executeCommand`  [EXTRACTED]
  scripts/migrate-games-catalog.ts → src/lib/db.ts
- `TestUserRepository` --inherits--> `UserRepository`  [EXTRACTED]
  tests/repositories-mapping.test.ts → src/lib/repositories.ts
- `DedicatedPlayerProfilePage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/[gameSlug]/jugadores/[playerId]/page.tsx → src/components/providers/auth-provider.tsx
- `PublicCompetitionDetailPage()` --calls--> `queryDB()`  [EXTRACTED]
  src/app/[gameSlug]/organizacion/[orgId]/competencias/[compId]/page.tsx → src/lib/db.ts
- `GET()` --indirect_call--> `mapUserRowToProfile()`  [INFERRED]
  src/app/api/users/route.ts → src/lib/api-types.ts

## Import Cycles
- None detected.

## Communities (201 total, 106 thin omitted)

### Community 0 - "api-types.ts"
Cohesion: 0.07
Nodes (31): GET(), GET(), loadTeamScope(), POST(), PUT(), GET(), POST(), apiError() (+23 more)

### Community 1 - "card.tsx"
Cohesion: 0.14
Nodes (15): metadata, metadata, Card(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle() (+7 more)

### Community 2 - "cn"
Cohesion: 0.12
Nodes (24): ComponentsPage(), metadata, Alert(), AlertProps, EmptyState(), EmptyStateProps, Input, InputProps (+16 more)

### Community 3 - "user-profile-settings-view.tsx"
Cohesion: 0.17
Nodes (11): AtletaAjustesNestedPageProps, AtletaAjustesPageProps, GameSubNavbar(), CreateTeamModal(), UserProfileSettingsView(), UserProfileSettingsViewProps, checkTeamNameAvailability(), fetchJson() (+3 more)

### Community 4 - "game-portal-client.tsx"
Cohesion: 0.12
Nodes (19): ClubDashboardSection(), GameDataSection(), MatchdaySection(), PlayerFichaCrudSection(), PlayerOffersSection(), PlayerStatsSection(), RosterSection(), PlayerCardData (+11 more)

### Community 5 - "dependencies"
Cohesion: 0.09
Nodes (23): bcryptjs, clsx, framer-motion, google-auth-library, jsonwebtoken, mysql2, next, dependencies (+15 more)

### Community 6 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/postcss (+17 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, Nueva carpeta (+20 more)

### Community 8 - "GameConfig"
Cohesion: 0.12
Nodes (14): GameHighlightsSection(), GameHighlightsSectionProps, GameHomeHero(), GameHomeHeroProps, MockMatch, GameSubNavbarProps, SideMarginsBackgroundProps, EsportsAnalyticsViewProps (+6 more)

### Community 9 - "games-data.ts"
Cohesion: 0.15
Nodes (16): AdminNavbar(), NavLinks(), Navbar(), NotificationCenter(), NotificationFilter, NotificationItem, useTranslation(), GameLogo() (+8 more)

### Community 10 - "TeamData"
Cohesion: 0.16
Nodes (15): ClubSettingsViewProps, ClubDashboardSectionProps, TeamAdminSection, TeamAdminSubnavbarProps, TeamsContextType, AthleteManagementModal(), AthleteTabOption, ClubManagementModal() (+7 more)

### Community 11 - "teams-page-client.tsx"
Cohesion: 0.07
Nodes (32): metadata, metadata, metadata, OrganizerDashboardView(), ColumnDef, COUNTRY_MAP, EsportsCard(), EsportsCardBadge (+24 more)

### Community 12 - "team-profile-view.tsx"
Cohesion: 0.14
Nodes (17): OrganizationRow, SubSubNavbar(), SubSubNavbarProps, SubSubTabOption, LegacyTeamData, ProfileTab, TeamContract, TeamProfileSquadMember (+9 more)

### Community 13 - "useAuth"
Cohesion: 0.10
Nodes (25): AtletaFichaPage(), ClubAjustesPage(), ClubPlantillaPage(), GoogleCredentialResponse, GoogleIdentityServices, GoogleOAuthModal(), GoogleOAuthModalProps, Window (+17 more)

### Community 14 - "app/layout.tsx"
Cohesion: 0.12
Nodes (12): inter, jetbrainsMono, metadata, outfit, viewport, AdminOrganizerHeader(), AdminOrganizerSidebar(), AppLayoutWrapper() (+4 more)

### Community 15 - "data-store.ts"
Cohesion: 0.09
Nodes (19): TeamPageProps, DedicatedPlayerProfilePage(), PlayerPageProps, AuthContextType, DirectoryManager, DirectoryMember, DirectoryTeam, TeamDirectory() (+11 more)

### Community 19 - "api-schemas.ts"
Cohesion: 0.16
Nodes (13): FixtureTeam, fixtureRequestBodySchema, loginBodySchema, matchApprovalBodySchema, organizerSeasonBodySchema, registerBodySchema, teamCreateBodySchema, teamMutationFields (+5 more)

### Community 20 - "competitions.ts"
Cohesion: 0.06
Nodes (65): advancePlayoffWinnerAction(), CompetitionData, CompetitionStatus, CompetitionTeamData, enrollIndividualAthleteAction(), enrollTeamAction(), FixtureConfig, generateFixtureAction() (+57 more)

### Community 25 - "auth.ts"
Cohesion: 0.07
Nodes (27): POST(), POST(), GET(), Params, ALLOWED_IMAGE_MIMES, authenticateRequest(), canManageOrganization(), csrfTokens (+19 more)

### Community 26 - "queryDB"
Cohesion: 0.14
Nodes (24): googleClient, POST(), POST(), POST(), GET(), parseJsonValue(), PublicOrganizationRow, TournamentListRow (+16 more)

### Community 34 - "services.ts"
Cohesion: 0.06
Nodes (65): createExecutor(), DatabaseExecutor, executeCas(), withTransaction(), Competition, Team, User, AddPlayerToSquadResult (+57 more)

### Community 35 - "badge.tsx"
Cohesion: 0.08
Nodes (30): SquadMemberData, metadata, metadata, ModerationDashboard(), MatchReportModal(), MatchReportModalProps, MatchApiItem, MatchdayReportItem (+22 more)

### Community 36 - "button.tsx"
Cohesion: 0.08
Nodes (30): metadata, AdminDashboardView(), AdminOrganization, AdminTab, AdminTeam, AdminUser, ManagementHero(), ManagementPage() (+22 more)

### Community 37 - "authorizationErrorResponse"
Cohesion: 0.18
Nodes (33): DELETE(), GET(), OrganizationRow, POST(), PUT(), AdminTeamRow, canAssignTeamStaff(), DELETE() (+25 more)

### Community 38 - "security.ts"
Cohesion: 0.08
Nodes (19): AuthorizationActor, createRateLimiter(), createSessionRegistry(), InMemoryRateLimitStore, isAuthSessionActive(), MUTATION_METHODS, MutationOriginResult, mysqlRateLimitStore (+11 more)

### Community 39 - "getActionErrorMessage"
Cohesion: 0.13
Nodes (29): createCompetitionAction(), getTeamRosterForMatchReportAction(), PlayerStatInput, submitMatchReportAction(), SubmitMatchReportInput, getSentContractsByTeamAction(), getUserOffersAction(), issueNewContractOfferService() (+21 more)

### Community 40 - "validation.ts"
Cohesion: 0.06
Nodes (32): AddPlayerToSquadInput, addPlayerToSquadSchema, competitionStatusSchema, CreateCompetitionInput, createCompetitionSchema, CreateSeasonInput, createSeasonSchema, CreateTeamInput (+24 more)

### Community 41 - "chat.ts"
Cohesion: 0.15
Nodes (29): banUserFromChatAction(), checkUserBanStatusAction(), clearTypingStatusAction(), createOrGetDirectThreadAction(), getChatThreadsAction(), getThreadMessagesAction(), getTypingUsersAction(), getUsersByRoleAction() (+21 more)

### Community 42 - "squads.ts"
Cohesion: 0.12
Nodes (28): AcceptedPlayerOffer, AcceptedTeamOffer, addPlayerToSquadAction(), AvailablePlayerData, checkTeamManagementPermissionAction(), EnrolledTeamEntry, EnrolledTeamRow, getAllPlayersForContractOfferAction() (+20 more)

### Community 43 - "design-provider.tsx"
Cohesion: 0.13
Nodes (23): applyPreferences(), DesignContext, DesignContextValue, DesignProvider(), getClientSnapshot(), persistPreferences(), subscribe(), useDesign() (+15 more)

### Community 44 - "auth-server.ts"
Cohesion: 0.16
Nodes (20): MatchRow, POST(), assertAllowedRole(), ServerUserSession, SessionUserRow, toAuthorizationActor(), belongsToActorOrganization(), canApproveMatch() (+12 more)

### Community 45 - "new-squad-management.tsx"
Cohesion: 0.12
Nodes (21): expelPlayerFromSquadAction(), getNewPlayerInscriptionsMatrixAction(), getNewTeamSquadAction(), getUserEnrolledTeamsAction(), InscriptionRow, NewSquadMember, NewSquadRow, OrganizationSummary (+13 more)

### Community 46 - "transfer-market.tsx"
Cohesion: 0.12
Nodes (18): getOrganizationsWithStatsAction(), OrgWithStats, OrganizationDirectory(), OrganizationDirectoryProps, OrganizationDisplayData, TacticalLoadingSkeleton(), TacticalLoadingSkeletonProps, CompletedTransfer (+10 more)

### Community 47 - "transfers.ts"
Cohesion: 0.16
Nodes (19): approveExtraordinaryTransferAction(), getAthleteTransferHistoryAction(), getCompletedTransfersAction(), getGameConfigurationAction(), getPlayerContractOffersAction(), getTransferPostsAction(), rejectExtraordinaryTransferAction(), TransferApplicationData (+11 more)

### Community 48 - "migrate.mjs"
Cohesion: 0.21
Nodes (17): baselinePath, connectionOptions(), databaseDirectory, loadBaseline(), loadMigrations(), main(), migrate(), migrationsDirectory (+9 more)

### Community 49 - "🏆 TournamentsPro — Plataforma eSports Integral"
Cohesion: 0.10
Nodes (19): 1. Clonar el Repositorio, 1. 🛡️ Módulo de Gestión de Usuarios y Atletas (`/usuarios`), 2. Instalar Dependencias, 2. 🏢 Módulo de Organizaciones Madre (`/organizaciones`), 3. Configurar Variables de Entorno, 3. 🛡️ Módulo de Clubes y Escuadras (`/equipos`), 4. Inicializar la Base de Datos MySQL, 4. 🏆 Panel de Control del Organizador eSports (`/dashboard`) (+11 more)

### Community 50 - "getServerUserSession"
Cohesion: 0.19
Nodes (11): migrateGames(), DELETE(), GET(), POST(), GET(), GET(), POST(), CompetitionsPage() (+3 more)

### Community 51 - "plantilla-management-view.tsx"
Cohesion: 0.12
Nodes (15): CompetitionOption, ContractPlayer, errorMessage(), InscriptionMatrixEntry, ManagedTeam, MatrixOrganization, OrganizationOption, OutgoingOffer (+7 more)

### Community 52 - "public-competition-detail-view.tsx"
Cohesion: 0.16
Nodes (14): PublicCompetitionDetailPage(), revalidate, getRoundWeight(), PlayoffBracket(), PlayoffBracketProps, PlayoffMatch, PlayoffPair, ROUND_ORDER_MAP (+6 more)

### Community 53 - "game-ui-showcase-client.tsx"
Cohesion: 0.16
Nodes (12): metadata, CalendarDayItem, DateCarousel(), DateCarouselProps, MatchCard(), MatchFilterToolbar(), MatchFilterToolbarProps, OrgOption (+4 more)

### Community 54 - "5. Re-render Optimization"
Cohesion: 0.12
Nodes (16): 5.10 Subscribe to Derived State, 5.11 Use Functional setState Updates, 5.12 Use Lazy State Initialization, 5.13 Use Transitions for Non-Urgent Updates, 5.14 Use useDeferredValue for Expensive Derived Renders, 5.15 Use useRef for Transient Values, 5.1 Calculate Derived State During Rendering, 5.2 Defer State Reads to Usage Point (+8 more)

### Community 55 - "🧠 CONTEXTO COMPLETO DEL PROYECTO: TOURNAMENTSPRO (Para Modelos GPT / ChatGPT / Antigravity)"
Cohesion: 0.12
Nodes (15): 📌 1. Visión General del Sistema, 🛠️ 2. Stack Tecnológico & Arquitectura, 🗄️ 3. Esquema de Base de Datos MySQL (DDL), 🗺️ 4. Mapa de Rutas de la Aplicación (App Router), 🧩 5. Estándares y Componentes Clave de UI, 🎮 6. Disciplinas eSports y Modalidades Soportadas, ⚡ 7. Reglas de Desarrollo & Convenciones, 🧠 CONTEXTO COMPLETO DEL PROYECTO: TOURNAMENTSPRO (Para Modelos GPT / ChatGPT / Antigravity) (+7 more)

### Community 56 - "7. JavaScript Performance"
Cohesion: 0.13
Nodes (15): 7.10 Hoist RegExp Creation, 7.11 Use flatMap to Map and Filter in One Pass, 7.12 Use Loop for Min/Max Instead of Sort, 7.13 Use Set/Map for O(1) Lookups, 7.14 Use toSorted() Instead of sort() for Immutability, 7.1 Avoid Layout Thrashing, 7.2 Build Index Maps for Repeated Lookups, 7.3 Cache Property Access in Loops (+7 more)

### Community 57 - "Quick Reference"
Cohesion: 0.13
Nodes (14): 1. Eliminating Waterfalls (CRITICAL), 2. Bundle Size Optimization (CRITICAL), 3. Server-Side Performance (HIGH), 4. Client-Side Data Fetching (MEDIUM-HIGH), 5. Re-render Optimization (MEDIUM), 6. Rendering Performance (MEDIUM), 7. JavaScript Performance (LOW-MEDIUM), 8. Advanced Patterns (LOW) (+6 more)

### Community 58 - "[section]/page.tsx"
Cohesion: 0.20
Nodes (10): GamePageProps, GameSectionDynamicPage(), GameSectionPageProps, generateMetadata(), GamePortalClient(), getSectionMetadata(), isPublicGameSection(), PUBLIC_GAME_SECTIONS (+2 more)

### Community 59 - "classification-view.tsx"
Cohesion: 0.24
Nodes (11): ClassificationView(), calculateStandings(), ClassificationMatch, emptyStanding(), OrganizationApiItem, OrganizationItem, PLAYOFF_ROUNDS, TeamStanding (+3 more)

### Community 60 - "fixture-schedule-view.tsx"
Cohesion: 0.25
Nodes (9): FixtureScheduleView(), FixtureApiMatch, FixtureMatchItem, getLocalDateString(), OrganizationApiItem, OrganizationOption, TournamentApiItem, TournamentOption (+1 more)

### Community 61 - "3. 🚀 Módulos y Funcionalidades Desarrolladas"
Cohesion: 0.14
Nodes (13): 1. 📌 Resumen del Proyecto, 2. 🏛️ Arquitectura & Modelo de Datos (Base de Datos MySQL), 3.1 🔒 Módulo del Organizador eSports (`http://localhost:3000/dashboard/competencias`), 3.2 🏆 Detalle de Competencia e Inscripción (`http://localhost:3000/dashboard/competencias/[id]`), 3.3 📅 Fixture, Clasificación & Directorio de Clubes (`http://localhost:3000/eafc26/equipos`, `/eafc26/partidos` & `/valorant/UI`), 3.4 🔁 Mercado de Transferencias y Traspasos Extraordinarios (`src/app/actions/transfers.ts`), 3.5 👥 Gestión Directa de Roster (`http://localhost:3000/equipos`), 3.6 🎨 Layout del Organizador Reestructurado (`src/components/layout/admin-organizer-header.tsx` & `admin-organizer-sidebar.tsx`) (+5 more)

### Community 62 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, architecture:check, build, db:migrate, db:migrate:check, db:migrate:verify, dev, lint (+6 more)

### Community 64 - "logger.ts"
Cohesion: 0.23
Nodes (10): dynamic, GET(), queryRows, getRequestId(), log(), logger, LogLevel, LogMetadata (+2 more)

### Community 65 - "6. Rendering Performance"
Cohesion: 0.17
Nodes (12): 6.10 Use React DOM Resource Hints, 6.11 Use useTransition Over Manual Loading States, 6.1 Animate SVG Wrapper Instead of SVG Element, 6.2 CSS content-visibility for Long Lists, 6.3 Hoist Static JSX Elements, 6.4 Optimize SVG Precision, 6.5 Prevent Hydration Mismatch Without Flickering, 6.6 Suppress Expected Hydration Mismatches (+4 more)

### Community 66 - "Fases y estado"
Cohesion: 0.17
Nodes (11): 1. Fundaciones — implementada, 2. Páginas delgadas — implementada, 3. Portal por juego — implementada en rutas, 4. Datos — fase expandir implementada, 5. Mega-vistas — en curso, 6. Objetivos medibles, Fases y estado, Objetivo (+3 more)

### Community 67 - "BaseRepository"
Cohesion: 0.17
Nodes (3): DatabaseParams, BaseRepository, Repository

### Community 68 - "TeamRepository"
Cohesion: 0.18
Nodes (3): TeamRepository, TestTeamRepository, TestUserRepository

### Community 69 - "3. Server-Side Performance"
Cohesion: 0.18
Nodes (10): 3.10 Use after() for Non-Blocking Operations, 3.1 Authenticate Server Actions Like API Routes, 3.2 Avoid Duplicate Serialization in RSC Props, 3.3 Avoid Shared Module State for Request Data, 3.4 Cross-Request LRU Caching, 3.5 Hoist Static I/O to Module Level, 3.6 Minimize Serialization at RSC Boundaries, 3.7 Parallel Data Fetching with Component Composition (+2 more)

### Community 70 - "security-housekeeping.mjs"
Cohesion: 0.29
Nodes (8): checkOnly, config, buildSecurityHousekeepingPlan(), mysqlDate(), readSecurityRetentionConfig(), retentionDays(), databaseDirectory, plan

### Community 71 - "standings-view.tsx"
Cohesion: 0.20
Nodes (9): BracketMatch, isPlaceholderTeam(), OrganizationApiItem, StandingsMatch, StandingsView(), StandingsViewProps, StandingTeamRow, TournamentApiItem (+1 more)

### Community 72 - "React Best Practices"
Cohesion: 0.20
Nodes (9): 4.1 Deduplicate Global Event Listeners, 4.2 Use Passive Event Listeners for Scrolling Performance, 4.3 Use SWR for Automatic Deduplication, 4.4 Version and Minimize localStorage Data, 4. Client-Side Data Fetching, Abstract, React Best Practices, References (+1 more)

### Community 73 - "Sections"
Cohesion: 0.20
Nodes (9): 1. Eliminating Waterfalls (async), 2. Bundle Size Optimization (bundle), 3. Server-Side Performance (server), 4. Client-Side Data Fetching (client), 5. Re-render Optimization (rerender), 6. Rendering Performance (rendering), 7. JavaScript Performance (js), 8. Advanced Patterns (advanced) (+1 more)

### Community 74 - "language-provider.tsx"
Cohesion: 0.29
Nodes (9): dictionaries, getServerLanguage(), getStoredLanguage(), isLanguage(), Language, LanguageContext, LanguageContextType, LanguageProvider() (+1 more)

### Community 75 - "repositories.ts"
Cohesion: 0.20
Nodes (9): dbPool, CompetitionRow, FindOptions, MutableDatabaseParams, OrganizationRow, Season, SeasonRow, TeamRow (+1 more)

### Community 76 - "check-architecture.mjs"
Cohesion: 0.22
Nodes (6): appDirectory, componentFiles, componentViolations, debt, debtPath, oversized

### Community 78 - "Runbook operativo"
Cohesion: 0.25
Nodes (7): Archivo y retención, Contrato del proxy inverso, Despliegue, Incidentes de autenticación, Mantenimiento periódico, Restauración, Runbook operativo

### Community 79 - "1. Eliminating Waterfalls"
Cohesion: 0.29
Nodes (7): 1.1 Check Cheap Conditions Before Async Flags, 1.2 Defer Await Until Needed, 1.3 Dependency-Based Parallelization, 1.4 Prevent Waterfall Chains in API Routes, 1.5 Promise.all() for Independent Operations, 1.6 Strategic Suspense Boundaries, 1. Eliminating Waterfalls

### Community 80 - "2. Bundle Size Optimization"
Cohesion: 0.29
Nodes (7): 2.1 Avoid Barrel File Imports, 2.2 Conditional Module Loading, 2.3 Defer Non-Critical Third-Party Libraries, 2.4 Dynamic Imports for Heavy Components, 2.5 Prefer Statically Analyzable Paths, 2.6 Preload Based on User Intent, 2. Bundle Size Optimization

### Community 81 - "club/matchday/page.tsx"
Cohesion: 0.29
Nodes (3): metadata, metadata, MatchdayReportView()

### Community 82 - "games-management-view.tsx"
Cohesion: 0.33
Nodes (4): metadata, GameDbRecord, GamesManagementView(), StatSchemaField

### Community 84 - "React Best Practices"
Cohesion: 0.33
Nodes (5): Creating a New Rule, Getting Started, React Best Practices, Rule File Structure, Structure

### Community 85 - "Security model"
Cohesion: 0.33
Nodes (5): Deployment requirements, Operational security controls, Roles and scope, Security model, Temporarily accepted browser-policy risk

### Community 86 - "🕸️ GRAPHIFY — Mapa Estructural y Grafo de Navegación de TournamentsPro"
Cohesion: 0.33
Nodes (5): 1. 🗺️ Grafo de Enrutamiento y Navegación (Next.js App Router), 2. 🧱 Grafo de Jerarquía de Layout y Componentes UI, 3. 🔄 Grafo de Flujo de Datos y Conexión MySQL API, 📂 4. Mapa de Archivos por Módulo, 🕸️ GRAPHIFY — Mapa Estructural y Grafo de Navegación de TournamentsPro

### Community 87 - "8. Advanced Patterns"
Cohesion: 0.40
Nodes (5): 8.1 Do Not Put Effect Events in Dependency Arrays, 8.2 Initialize App Once, Not Per Mount, 8.3 Store Event Handlers in Refs, 8.4 useEffectEvent for Stable Callback Refs, 8. Advanced Patterns

### Community 88 - "Migraciones de base de datos"
Cohesion: 0.40
Nodes (4): Estrategia de bootstrap y upgrade, Migraciones de base de datos, Reglas, Uso

### Community 89 - "Informe de implementación"
Cohesion: 0.40
Nodes (4): Estado alcanzado, Informe de implementación, Verificación final, Único cierre dependiente del entorno

### Community 90 - "Recomendaciones integrales de TournamentsPro"
Cohesion: 0.40
Nodes (4): Acciones de despliegue (no son cambios de código), Mejoras futuras opcionales, Recomendaciones implementadas, Recomendaciones integrales de TournamentsPro

### Community 92 - "🛠️ Core Principles"
Cohesion: 0.50
Nodes (3): 🛠️ Core Principles, Example Mermaid Component Dependency Flow:, 🕸️ Graphify Codebase Knowledge Mapping

### Community 94 - "Prefer Statically Analyzable Paths"
Cohesion: 0.50
Nodes (3): File-System Paths, Import Paths, Prefer Statically Analyzable Paths

### Community 96 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 98 - "schema-contract.test.ts"
Cohesion: 0.50
Nodes (3): baseline, compatibilityMigration, organizationGamesMigration

## Knowledge Gaps
- **684 isolated node(s):** `databaseDirectory`, `projectDirectory`, `migrationsDirectory`, `baselinePath`, `forbiddenBaselineStatements` (+679 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **106 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GAMES_CATALOG` connect `games-data.ts` to `card.tsx`, `cn`, `user-profile-settings-view.tsx`, `game-portal-client.tsx`, `TeamData`, `teams-page-client.tsx`, `team-profile-view.tsx`, `app/layout.tsx`, `data-store.ts`, `competitions.ts`, `services.ts`, `badge.tsx`, `button.tsx`, `transfer-market.tsx`, `getServerUserSession`, `public-competition-detail-view.tsx`, `game-ui-showcase-client.tsx`, `[section]/page.tsx`, `[gameSlug]/layout.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `Button` connect `button.tsx` to `card.tsx`, `cn`, `user-profile-settings-view.tsx`, `game-portal-client.tsx`, `GameConfig`, `games-data.ts`, `TeamData`, `teams-page-client.tsx`, `team-profile-view.tsx`, `useAuth`, `data-store.ts`, `competitions.ts`, `badge.tsx`, `chat.ts`, `design-provider.tsx`, `new-squad-management.tsx`, `transfer-market.tsx`, `transfers.ts`, `plantilla-management-view.tsx`, `game-ui-showcase-client.tsx`, `classification-view.tsx`, `fixture-schedule-view.tsx`, `games-management-view.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `queryDB()` connect `queryDB` to `api-types.ts`, `team-profile-view.tsx`, `api-schemas.ts`, `competitions.ts`, `auth.ts`, `services.ts`, `authorizationErrorResponse`, `security.ts`, `getActionErrorMessage`, `chat.ts`, `squads.ts`, `auth-server.ts`, `new-squad-management.tsx`, `transfer-market.tsx`, `transfers.ts`, `getServerUserSession`, `public-competition-detail-view.tsx`, `.findById`, `TeamRepository`, `repositories.ts`, `UserRepository`, `CompetitionRepository`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `databaseDirectory`, `projectDirectory`, `migrationsDirectory` to the rest of the system?**
  _684 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `api-types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0700354609929078 - nodes in this community are weakly interconnected._
- **Should `card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13663663663663664 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.11596638655462185 - nodes in this community are weakly interconnected._