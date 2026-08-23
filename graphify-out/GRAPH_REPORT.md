# Graph Report - .  (2026-07-27)

## Corpus Check
- Large corpus: 259 files · ~787,567 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 533 nodes · 1461 edges · 38 communities (29 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API routes
- Application pages
- Admin interface
- Module pages
- Game portal pages
- Runtime dependencies
- Lint tooling
- TypeScript configuration
- Game highlights
- Athlete settings
- Team navigation
- Athlete profile pages
- Team profile pages
- Mobile navigation
- Root application layout
- Application data store
- Organization migration
- Database seed data
- Status migration
- React Query provider
- ESLint configuration
- Next.js configuration
- Next environment types
- PostCSS configuration
- Prisma schema

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 73 edges
2. `Button` - 47 edges
3. `Badge()` - 43 edges
4. `GAMES_CATALOG` - 31 edges
5. `cn()` - 31 edges
6. `queryDB()` - 30 edges
7. `Card()` - 27 edges
8. `TeamData` - 24 edges
9. `Avatar()` - 23 edges
10. `GameConfig` - 22 edges

## Surprising Connections (you probably didn't know these)
- `DedicatedTeamProfilePage()` --references--> `react`  [EXTRACTED]
  src/app/[gameSlug]/equipos/[teamId]/page.tsx → package.json
- `DedicatedPlayerProfilePage()` --references--> `react`  [EXTRACTED]
  src/app/[gameSlug]/jugadores/[playerId]/page.tsx → package.json
- `GameDedicatedPortalPage()` --references--> `react`  [EXTRACTED]
  src/app/[gameSlug]/page.tsx → package.json
- `ClubSettingsView()` --references--> `react`  [EXTRACTED]
  src/components/club/club-settings-view.tsx → package.json
- `CreateTeamModal()` --references--> `react`  [EXTRACTED]
  src/components/teams/create-team-modal.tsx → package.json

## Import Cycles
- None detected.

## Communities (38 total, 9 thin omitted)

### Community 0 - "API routes"
Cohesion: 0.07
Nodes (57): GET(), POST(), PUT(), POST(), PUT(), GET(), POST(), PUT() (+49 more)

### Community 1 - "Application pages"
Cohesion: 0.14
Nodes (26): AdminDashboardView(), GoogleOAuthModal(), GoogleOAuthModalProps, ChatSystem(), ChatSystemProps, GAME_MODES, OrganizerDashboardView(), PlayerProfileViewProps (+18 more)

### Community 2 - "Admin interface"
Cohesion: 0.10
Nodes (31): ComponentsShowcasePage(), AdminNavbar(), AdminOrganizerHeader(), Navbar(), NotificationCenter(), NotificationItem, dictionaries, Language (+23 more)

### Community 3 - "Module pages"
Cohesion: 0.10
Nodes (28): TeamsModulePage(), OrganizationsModulePage(), UsersModulePage(), CreateTeamModal(), ConfirmModal(), ConfirmModalProps, CrudAlertBanner(), CrudAlertProps (+20 more)

### Community 4 - "Game portal pages"
Cohesion: 0.08
Nodes (30): ClubSettingsView, EsportsAnalyticsView, GameDedicatedPortalPage(), GamePageProps, TeamProfileView, TournamentHubView, TransferMarket, UserProfileSettingsView (+22 more)

### Community 5 - "Runtime dependencies"
Cohesion: 0.06
Nodes (33): bcryptjs, clsx, framer-motion, jsonwebtoken, lucide-react, mysql2, next, next-intl (+25 more)

### Community 6 - "Lint tooling"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs (+21 more)

### Community 7 - "TypeScript configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, Nueva carpeta (+20 more)

### Community 8 - "Game highlights"
Cohesion: 0.10
Nodes (17): GameHighlightsSection(), GameHighlightsSectionProps, GameHomeHero(), GameHomeHeroProps, MockMatch, ClubDashboardSectionProps, GameSubNavbarProps, MobileResponsiveSubnavbarProps (+9 more)

### Community 9 - "Athlete settings"
Cohesion: 0.16
Nodes (10): AtletaAjustesNestedPageProps, AtletaAjustesPageProps, DedicatedPlayerProfilePage(), PlayerPageProps, AppLayoutWrapper(), HIDE_FOOTER_PATTERNS, Footer(), GameSubNavbar() (+2 more)

### Community 10 - "Team navigation"
Cohesion: 0.19
Nodes (14): TeamAdminSection, TeamAdminSubnavbarProps, AuthContextType, AthleteManagementModal(), AthleteManagementModalProps, AthleteTabOption, ClubManagementModal(), ClubManagementModalProps (+6 more)

### Community 11 - "Athlete profile pages"
Cohesion: 0.14
Nodes (15): AtletaFichaPage(), AtletaOfertasPage(), AtletaStatsPage(), ClubAjustesPage(), ClubMatchdayPage(), ClubPlantillaPage(), ClubReclutamientoPage(), DashboardPage() (+7 more)

### Community 12 - "Team profile pages"
Cohesion: 0.15
Nodes (13): react, react, DedicatedTeamProfilePage(), TeamPageProps, AdminOrganizerSidebar(), SubSubNavbar(), SubSubNavbarProps, SubSubTabOption (+5 more)

### Community 13 - "Mobile navigation"
Cohesion: 0.24
Nodes (8): MobileResponsiveSubnavbar(), MobileSubnavSegment, TeamClubSubnavbar(), UserAthleteSubnavbar(), AuthContext, TeamsContext, TeamsContextType, initialTeams

### Community 14 - "Root application layout"
Cohesion: 0.22
Nodes (7): inter, metadata, outfit, viewport, AuthProvider(), LanguageProvider(), ThemeProvider()

### Community 15 - "Application data store"
Cohesion: 0.20
Nodes (9): ChatMessage, Conversation, GameProfile, initialConversations, initialTournamentRosters, initialTransfers, initialUsers, TournamentRosterEntry (+1 more)

## Knowledge Gaps
- **145 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+140 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime dependencies` to `Team profile pages`, `Lint tooling`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Why does `react` connect `Team profile pages` to `Module pages`, `Game portal pages`, `Runtime dependencies`, `Athlete settings`, `Athlete profile pages`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _145 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API routes` be split into smaller, more focused modules?**
  _Cohesion score 0.06596491228070175 - nodes in this community are weakly interconnected._
- **Should `Application pages` be split into smaller, more focused modules?**
  _Cohesion score 0.1357142857142857 - nodes in this community are weakly interconnected._
- **Should `Admin interface` be split into smaller, more focused modules?**
  _Cohesion score 0.09990749306197964 - nodes in this community are weakly interconnected._
- **Should `Module pages` be split into smaller, more focused modules?**
  _Cohesion score 0.10409745293466224 - nodes in this community are weakly interconnected._