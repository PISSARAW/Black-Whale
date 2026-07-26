# Black Whale

**A temporal narrative engine for the Hunter × Hunter Succession Arc.**

Track bodies, consciousnesses, Nen abilities, and character knowledge across every chapter of the Black Whale arc.

🚀 **Status:** [v1.0.0 Released] - Timeline, Ship Map, and Spoiler Engine are fully functional!

---

## Architecture

```
black-whale/
├── apps/
│   ├── web/       # Public SvelteKit app (port 3000)
│   ├── admin/     # Back-office SvelteKit app (port 3002)
│   ├── api/       # NestJS REST API (port 3001)
│   └── worker/    # Async jobs (snapshots, cache warming)
│
├── packages/
│   ├── domain/              # Shared TypeScript models & domain events
│   ├── contracts/           # API DTOs shared between frontend & backend
│   ├── database/            # Prisma schema and PostgreSQL client
│   ├── world-engine/        # Pure event reducer, invariants, cursors & projections
│   ├── timeline-engine/     # Reconstructs world state at any event
│   ├── identity-engine/     # Separates body / consciousness / aura
│   ├── perspective-engine/  # Filters world through a character's POV
│   ├── knowledge-engine/    # What each character knows or believes
│   ├── spoiler-engine/      # Protects users from future chapter spoilers
│   ├── nen-engine/          # Validates and executes Nen abilities
│   ├── simulation-engine/   # Non-canonical branch timelines
│   ├── map-engine/          # Ship map layers and entity positions
│   ├── ability-sdk/         # DSL for defining Nen ability modules
│   ├── ability-modules/     # Concrete ability implementations
│   ├── ui/                  # Shared Svelte components
│   └── config/              # Shared environment config
│
├── data/
│   ├── chapters/
│   ├── characters/
│   ├── abilities/
│   ├── locations/
│   └── seeds/
│
└── infrastructure/
    ├── docker/              # Dockerfiles + docker-compose
    └── database/migrations/ # PostgreSQL schema
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | SvelteKit 5, Tailwind CSS, TanStack Query |
| Backend | NestJS 10, Fastify |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| ORM | Prisma |
| Search | Meilisearch (to add) |
| Storage | Cloudflare R2 / S3 (to add) |
| Monorepo | pnpm workspaces + Turborepo |

---

## Getting started

### Prerequisites

- Node ≥ 20
- pnpm ≥ 9
- PostgreSQL database running locally

### Install

```bash
pnpm install
```

### Configuration & Database Initialization

Make sure to create `.env` files in your applications with a valid database connection string:

```bash
# Set your DATABASE_URL in the .env file (apps/api, apps/web, apps/admin, packages/database)
DATABASE_URL="postgresql://<user>@localhost:5432/blackwhale?schema=public"
```

Create the database and push the canonical Prisma schema:

```bash
createdb blackwhale
pnpm --filter "@black-whale/database" db:push
```

For an existing database, review and apply the additive world-kernel migration
in `packages/database/prisma/migrations/20260726143000_world_kernel/migration.sql`
through your normal deployment pipeline. Docker Compose provisions fresh local
databases directly from the canonical Prisma schema.

### Run in development

```bash
# All apps in parallel
pnpm dev

# Individual apps
pnpm --filter "@black-whale/api" dev
pnpm --filter "@black-whale/web" dev
pnpm --filter "@black-whale/admin" dev
```

### Build

```bash
pnpm build
```

### Type check

```bash
pnpm typecheck
```

### Production on Hetzner

The hardened production stack, TLS proxy, database migrations, healthchecks,
and backup/restore runbook are documented in
[`infrastructure/hetzner/README.md`](infrastructure/hetzner/README.md).

---

## Five core questions

At any point in the story, the system can answer:

1. **What is actually happening on the Black Whale?** → `GET /v1/world-state?eventId=…`
2. **Where is each body?** → `GET /v1/map/entities/:id/presence?eventId=…`
3. **Which consciousness is in which body?** → identity engine
4. **What does each character know or believe?** → `GET /v1/perspectives/:character?eventId=…`
5. **How does a Nen ability modify reality or perception?** → `POST /v1/nen/abilities/:id/plan`

The answer to all five questions now comes from the same temporal model. A
canonical event or simulation branch identifies a `StoryCursor`; the pure
`world-engine` replays typed events into a `WorldState`; Nen abilities emit
those same events; and the map consumes a `MapScene` projection instead of
reimplementing domain rules in Svelte.

### Simulation branch API

```text
POST /v1/simulations                         create a fork at a canonical event
GET  /v1/simulations/:branchId               read its projected world state
POST /v1/simulations/:branchId/actions       execute a typed action/Hatsu
GET  /v1/simulations/:branchId/map-scene     project the branch on the map
```

---

## MVP roadmap

| Version | Scope | Status |
|---|---|---|
| **v1** | Ship map, characters, positions, timeline, spoiler filter | ✅ Released |
| **v2** | Body/consciousness split, knowledge engine, perspective comparison | ✅ Foundation shipped |
| **v3** | Nen action plans, explainable conditions, typed effects | 🏗️ Bungee Gum vertical shipped |
| **v4** | Ability modules migrated to the shared runtime | 🏗️ In progress |
| **v5** | Persistent branches and map projections | 🏗️ First vertical shipped |

---

## API docs

Once the API is running, Swagger docs are available at:

```
http://localhost:3001/docs
```
