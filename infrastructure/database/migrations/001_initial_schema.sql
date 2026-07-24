-- ============================================================
-- Black Whale — Initial Database Schema
-- ============================================================

-- ──────────────────────────────────────────────
-- Enums
-- ──────────────────────────────────────────────

CREATE TYPE biological_state AS ENUM ('alive', 'dead', 'unknown', 'revived', 'possessed');
CREATE TYPE mental_state AS ENUM ('normal', 'unconscious', 'controlled', 'split', 'unknown');
CREATE TYPE certainty_level AS ENUM ('confirmed', 'strongly_implied', 'deduction', 'theory', 'simulation', 'contradicted');
CREATE TYPE canon_status AS ENUM ('canon', 'non_canon', 'theory', 'simulation');
CREATE TYPE nen_category AS ENUM ('enhancer', 'emitter', 'transmuter', 'conjurer', 'manipulator', 'specialist', 'unknown');
CREATE TYPE entity_type AS ENUM ('body', 'consciousness', 'nen_creature', 'guardian_beast', 'clone', 'object');
CREATE TYPE belief_status AS ENUM ('known', 'suspected', 'believed', 'rejected', 'unknown');
CREATE TYPE ability_state AS ENUM ('inactive', 'active', 'post_mortem', 'broken', 'transferred');
CREATE TYPE source_type AS ENUM ('manga', 'anime', 'databook', 'interview', 'community');
CREATE TYPE zone_type AS ENUM ('quarters', 'corridor', 'medical', 'military', 'utility', 'external', 'unknown');
CREATE TYPE simulation_mode AS ENUM ('strict-canon', 'rule-compatible', 'sandbox');
CREATE TYPE event_relation_type AS ENUM ('precedes', 'causes', 'concurrent', 'reveals');

-- ──────────────────────────────────────────────
-- Characters & Identity
-- ──────────────────────────────────────────────

CREATE TABLE characters (
    id              TEXT PRIMARY KEY,
    canonical_name  TEXT NOT NULL,
    aliases         TEXT[]      NOT NULL DEFAULT '{}',
    description     TEXT,
    faction_id      TEXT,
    first_appearance_chapter_id TEXT,
    canon_status    canon_status NOT NULL DEFAULT 'canon',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bodies (
    id                      TEXT PRIMARY KEY,
    original_character_id   TEXT NOT NULL REFERENCES characters(id),
    biological_state        biological_state NOT NULL DEFAULT 'alive',
    current_location_id     TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consciousnesses (
    id                      TEXT PRIMARY KEY,
    original_character_id   TEXT NOT NULL REFERENCES characters(id),
    current_body_id         TEXT NOT NULL REFERENCES bodies(id),
    mental_state            mental_state NOT NULL DEFAULT 'normal',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE aura_identities (
    id                  TEXT PRIMARY KEY,
    owner_id            TEXT NOT NULL REFERENCES characters(id),
    current_holder_id   TEXT NOT NULL REFERENCES characters(id),
    nen_category        nen_category NOT NULL DEFAULT 'unknown',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Temporality
-- ──────────────────────────────────────────────

CREATE TABLE chapters (
    id                  TEXT PRIMARY KEY,
    number              INTEGER NOT NULL UNIQUE,
    publication_order   INTEGER NOT NULL,
    title               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE narrative_events (
    id                  TEXT PRIMARY KEY,
    chapter_id          TEXT NOT NULL REFERENCES chapters(id),
    sequence            INTEGER NOT NULL,
    narrative_timestamp TEXT,
    title               TEXT NOT NULL,
    description         TEXT,
    canon_status        canon_status NOT NULL DEFAULT 'canon',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (chapter_id, sequence)
);

CREATE TABLE event_relations (
    event_id            TEXT NOT NULL REFERENCES narrative_events(id),
    preceding_event_id  TEXT NOT NULL REFERENCES narrative_events(id),
    relation_type       event_relation_type NOT NULL DEFAULT 'precedes',
    PRIMARY KEY (event_id, preceding_event_id)
);

-- ──────────────────────────────────────────────
-- Locations
-- ──────────────────────────────────────────────

CREATE TABLE locations (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    parent_location_id  TEXT REFERENCES locations(id),
    deck                INTEGER,
    room                TEXT,
    zone_type           zone_type NOT NULL DEFAULT 'unknown',
    geometry_id         TEXT,
    capacity            INTEGER,
    entrances           TEXT[]  NOT NULL DEFAULT '{}',
    exits               TEXT[]  NOT NULL DEFAULT '{}',
    access_rules        TEXT[]  NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE presences (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    entity_type     entity_type NOT NULL,
    entity_id       TEXT NOT NULL,
    location_id     TEXT NOT NULL REFERENCES locations(id),
    from_event_id   TEXT NOT NULL REFERENCES narrative_events(id),
    until_event_id  TEXT REFERENCES narrative_events(id),
    certainty       certainty_level NOT NULL DEFAULT 'confirmed',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Nen
-- ──────────────────────────────────────────────

CREATE TABLE nen_abilities (
    id              TEXT PRIMARY KEY,
    owner_id        TEXT NOT NULL REFERENCES characters(id),
    name            TEXT NOT NULL,
    category        nen_category NOT NULL DEFAULT 'unknown',
    description     TEXT,
    canon_status    canon_status NOT NULL DEFAULT 'canon',
    module_key      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ability_rules (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    ability_id  TEXT NOT NULL REFERENCES nen_abilities(id),
    rule_type   TEXT NOT NULL,
    expression  TEXT NOT NULL,
    priority    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE ability_activations (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    ability_id              TEXT NOT NULL REFERENCES nen_abilities(id),
    actor_id                TEXT NOT NULL REFERENCES characters(id),
    started_at_event_id     TEXT NOT NULL REFERENCES narrative_events(id),
    ended_at_event_id       TEXT REFERENCES narrative_events(id),
    state                   ability_state NOT NULL DEFAULT 'inactive',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE nen_effects (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    activation_id           TEXT NOT NULL REFERENCES ability_activations(id),
    target_id               TEXT NOT NULL,
    effect_type             TEXT NOT NULL,
    payload                 JSONB NOT NULL DEFAULT '{}',
    started_at_event_id     TEXT NOT NULL REFERENCES narrative_events(id),
    ended_at_event_id       TEXT REFERENCES narrative_events(id)
);

-- ──────────────────────────────────────────────
-- Knowledge & Facts
-- ──────────────────────────────────────────────

CREATE TABLE facts (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    subject_id          TEXT NOT NULL,
    predicate           TEXT NOT NULL,
    value               JSONB NOT NULL,
    valid_from_event_id TEXT NOT NULL REFERENCES narrative_events(id),
    valid_until_event_id TEXT REFERENCES narrative_events(id),
    certainty           certainty_level NOT NULL DEFAULT 'confirmed',
    source_ids          TEXT[]  NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fact_knowledge (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    fact_id                 TEXT NOT NULL REFERENCES facts(id),
    observer_id             TEXT NOT NULL REFERENCES characters(id),
    known_from_event_id     TEXT NOT NULL REFERENCES narrative_events(id),
    known_until_event_id    TEXT REFERENCES narrative_events(id),
    belief                  belief_status NOT NULL DEFAULT 'known',
    confidence              NUMERIC(4,3) NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Sources & Claims
-- ──────────────────────────────────────────────

CREATE TABLE sources (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    type        source_type NOT NULL,
    chapter     INTEGER,
    page        INTEGER,
    panel       TEXT,
    description TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE claims (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    statement   TEXT NOT NULL,
    status      certainty_level NOT NULL DEFAULT 'confirmed',
    source_id   TEXT NOT NULL REFERENCES sources(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Event Sourcing — Domain Events log
-- ──────────────────────────────────────────────

CREATE TABLE domain_events (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    type            TEXT NOT NULL,
    narrative_event_id TEXT REFERENCES narrative_events(id),
    payload         JSONB NOT NULL DEFAULT '{}',
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domain_events_type ON domain_events(type);
CREATE INDEX idx_domain_events_occurred_at ON domain_events(occurred_at);

-- ──────────────────────────────────────────────
-- World State Snapshots
-- ──────────────────────────────────────────────

CREATE TABLE world_snapshots (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    at_event_id     TEXT NOT NULL REFERENCES narrative_events(id) UNIQUE,
    snapshot        JSONB NOT NULL,
    world_version   INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Simulations
-- ──────────────────────────────────────────────

CREATE TABLE simulation_branches (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    parent_event_id     TEXT NOT NULL REFERENCES narrative_events(id),
    owner_id            TEXT REFERENCES characters(id),
    mode                simulation_mode NOT NULL DEFAULT 'rule-compatible',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE simulation_events (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    branch_id       TEXT NOT NULL REFERENCES simulation_branches(id),
    sequence        INTEGER NOT NULL,
    type            TEXT NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}',
    applied_rules   TEXT[]  NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (branch_id, sequence)
);

-- ──────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────

CREATE INDEX idx_presences_entity ON presences(entity_id, entity_type);
CREATE INDEX idx_presences_location ON presences(location_id);
CREATE INDEX idx_presences_from_event ON presences(from_event_id);
CREATE INDEX idx_fact_knowledge_observer ON fact_knowledge(observer_id);
CREATE INDEX idx_fact_knowledge_fact ON fact_knowledge(fact_id);
CREATE INDEX idx_narrative_events_chapter ON narrative_events(chapter_id, sequence);
CREATE INDEX idx_ability_activations_actor ON ability_activations(actor_id);
CREATE INDEX idx_nen_effects_activation ON nen_effects(activation_id);
