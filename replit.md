# PDC Darts Karriere Modus

## Overview

Vollständige PDC Darts Karriere-Simulation als pnpm-Monorepo. React + Vite Frontend, Express API-Backend, PostgreSQL-Datenbank. Deutsche Benutzeroberfläche, dunkles Design, Neon-Cyan Akzent.

## Features
- **Spieler-Setup**: Namenseingabe beim ersten Start
- **38 Turniere** im Saison-Kalender (Players Championships, European Tour, World Series, Majors)
- **128 echte PDC-Spieler** in der Rangliste (Luke Humphries, MvG, Michael Smith, etc.)
- **Statistiken-Seite**: Average-Verlauf, Doppelquote, Siegquote, Weltranglistenverlauf (Charts)
- **Head-to-Head**: Alle Duelle im Überblick mit Siegquoten
- **Saison-Kalender**: Alle 38 Events mit Status, Filter, Qualifikationsstatus
- **Equipment-Shop**: 9 Artikel (Darts, Flights, Shafts, Board, Coaching) mit Avg/CO-Boni
- **Turnierverlauf**: Alle vergangenen Turniere mit Ergebnissen und Preisgeld
- **Sponsor-Missionen**: Zufällige Sponsorenverträge mit 9 verschiedenen Zieltypen
- **Achievements**: 12 Meilensteine
- **Autodarts-Integration**: Match-Daten direkt von Autodarts API importieren
- **Form-Tracking**: Gegner-Form wird angezeigt (Heißlauf, Kältephase etc.)
- **Phase 1 – RPG**: Momentum-Badge (Win/Loss-Serie ±5–10%), Angstgegner (+7% AVG), Match-Herausforderungen (Sponsor-Bonusziele)
- **Phase 2 – Social**: Social-Follower-Counter, Gegner Social-Media-Posts, Pressenachrichten/Zeitungsartikel-Feed
- **Phase 3 – Strukturen**: 2-Jahres-Rolling-OoM (Preisgeld verfällt nach 2 Saisons), Premier League Liga-Abend (4-Spieler Round-Robin mit Live-Tabelle), Grand Slam Gruppenphase (3 Gruppenspiele, Top 2 kommen weiter), World Grand Prix Double-In/Double-Out Badge

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Artifacts

### `artifacts/pro-tour` (`@workspace/pro-tour`)

React + Vite frontend for the **Online Pro Tour Manager** — multi-player tournament platform for onlineprotour.eu.

- **Spielplan**: Phase-organized Season 1 calendar (23 events: PC1–PC9, Spring Open, Dev Cups 1–6, April Major, etc.)
- **OOM**: Order of Merit with 119 imported real players from onlineprotour.eu (Stand 26.03.2026). Compact + Detail view with per-tournament columns. DB: `tour_oom_standings` table.
- **Turniere**: Admin creates/manages tournaments with bracket generation
- **Spieler**: Player registration with Autodarts account linking
- API URL: `/api` (shared API server at port 8080)
- Important: `apiFetch` uses `BASE = "/api"` (not prefixed with artifact base path)
- Tournament types: `pc` | `m1` (Major) | `m2` (Final) | `dev_cup` | `dev_major`

### `artifacts/darts-career` (`@workspace/darts-career`)

React + Vite frontend for the PDC Darts Career Mode game. All UI in German.

- Pages: `src/pages/dashboard.tsx` (career overview), `src/pages/match.tsx` (live match view)
- Hooks: `src/hooks/use-career.ts` (API integration)
- Served at `/` (root preview path)
- Dark theme, neon cyan accent color scheme

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
