# Black Whale

**A temporal narrative engine for the Hunter × Hunter Succession Arc.**

Track bodies, consciousnesses, Nen abilities, and character knowledge across every chapter of the Black Whale arc.

🚀 **Status:** Production-ready — the application, API, administration panel,
database migrations, HTTPS proxy, healthchecks, and backups are ready for a
Docker deployment on Hetzner.

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
    ├── docker/              # Development and production Docker stacks
    ├── hetzner/             # Deploy, backup, restore, and operations runbook
    └── database/            # Legacy migration references
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
| Reverse proxy | Caddy with automatic HTTPS |
| Deployment | Docker Compose on Hetzner Cloud |
| Search | Meilisearch (to add) |
| Storage | Cloudflare R2 / S3 (to add) |
| Monorepo | pnpm workspaces + Turborepo |

---

## Getting started

### Prerequisites

- Node ≥ 20
- pnpm ≥ 9
- PostgreSQL database running locally
- Redis 7 when running the complete stack

### Install

```bash
pnpm install
```

### Configuration and database initialization

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

Development uses `prisma db push`. Production uses the versioned baseline in
`packages/database/prisma/migrations` through `prisma migrate deploy`; do not
use `db push` against production.

Alternatively, start the complete development stack:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

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

### Tests

```bash
pnpm test
```

## Production on Hetzner

The production topology exposes only ports 80 and 443 through Caddy. The web,
API, admin, PostgreSQL, and Redis services remain on a private Docker network.
The admin panel requires an authenticated, signed, HTTP-only session.

Prepare the configuration and generate a different secret for every variable:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
# Use `openssl rand -hex 32` for PostgreSQL and Redis passwords.
```

After configuring the domain and its `api` and `admin` DNS records, deploy with:

```bash
./infrastructure/hetzner/deploy.sh
```

The command validates the Compose configuration, builds the images, applies
Prisma migrations, and starts the services with healthchecks. Caddy then obtains
and renews the TLS certificates automatically.

| Service | Production URL |
|---|---|
| Public application | `https://<domain>` |
| REST API | `https://api.<domain>` |
| Administration | `https://admin.<domain>` |
| Health endpoints | `/health` on each application service |

PostgreSQL is dumped every 24 hours with 14-day retention by default. Immediate
backup and guarded restoration commands are included in `infrastructure/hetzner`.

See the complete [Hetzner operations runbook](infrastructure/hetzner/README.md)
for server sizing, firewall rules, DNS, upgrades, logs, backup, and restoration.

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

In development, Swagger documentation is available at:

```
http://localhost:3001/docs
```

Swagger is disabled in production by default. Set `ENABLE_API_DOCS=true` only
when public API documentation is intentionally required.
