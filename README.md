# Black Whale

**A temporal narrative engine for the Hunter × Hunter Succession Arc.**

Track bodies, consciousnesses, Nen abilities, and character knowledge across every chapter of the Black Whale arc.

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
│   ├── timeline-engine/     # Reconstructs world state at any event
│   ├── identity-engine/     # Separates body / consciousness / aura
│   ├── perspective-engine/  # Filters world through a character's POV
│   ├── knowledge-engine/    # What each character knows or believes
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
| ORM | Prisma / Drizzle (to add) |
| Search | Meilisearch (to add) |
| Storage | Cloudflare R2 / S3 (to add) |
| Monorepo | pnpm workspaces + Turborepo |

---

## Getting started

### Prerequisites

- Node ≥ 20
- pnpm ≥ 9
- Docker (for local database)

### Install

```bash
pnpm install
```

### Start local services

```bash
docker compose -f infrastructure/docker/docker-compose.yml up postgres redis
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

---

## Five core questions

At any point in the story, the system can answer:

1. **What is actually happening on the Black Whale?** → `GET /v1/world-state?eventId=…`
2. **Where is each body?** → `GET /v1/map/entities/:id/presence?eventId=…`
3. **Which consciousness is in which body?** → identity engine
4. **What does each character know or believe?** → `GET /v1/perspectives/:character?eventId=…`
5. **How does a Nen ability modify reality or perception?** → `POST /v1/nen/abilities/:id/validate`

---

## MVP roadmap

| Version | Scope |
|---|---|
| v1 | Ship map, characters, positions, timeline, spoiler filter |
| v2 | Body/consciousness split, knowledge engine, perspective comparison |
| v3 | Nen rule engine (declarative YAML), conditions, post-mortem Nen |
| v4 | Ability modules (Bungee Gum, Emperor Time, consciousness transfer…) |
| v5 | Simulations, community theories, canonical vs non-canonical branches |

---

## API docs

Once the API is running, Swagger docs are available at:

```
http://localhost:3001/docs
```
