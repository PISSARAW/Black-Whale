ALTER TABLE "NarrativeEvent" ADD COLUMN "ordinal" INTEGER;
WITH ordered_events AS (
  SELECT event."id", ROW_NUMBER() OVER (
    ORDER BY chapter."number" ASC, event."sequence" ASC, event."id" ASC
  ) - 1 AS "ordinal"
  FROM "NarrativeEvent" event
  JOIN "Chapter" chapter ON chapter."id" = event."chapterId"
)
UPDATE "NarrativeEvent" event
SET "ordinal" = ordered_events."ordinal"
FROM ordered_events
WHERE event."id" = ordered_events."id";
CREATE UNIQUE INDEX "NarrativeEvent_ordinal_key" ON "NarrativeEvent"("ordinal");

CREATE TYPE "WorldBranchKind" AS ENUM ('CANON', 'THEORY', 'SIMULATION');
CREATE TYPE "WorldBranchPolicy" AS ENUM ('STRICT_CANON', 'RULE_COMPATIBLE', 'SANDBOX');
CREATE TYPE "WorldEntityKind" AS ENUM ('CHARACTER', 'BODY', 'CONSCIOUSNESS', 'OBJECT', 'NEN_ENTITY', 'AURA_ENTITY', 'COHORT', 'PORTAL', 'CURSE', 'CONSTRUCT', 'LOCATION');

CREATE TABLE "NenAbility" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "canonStatus" TEXT NOT NULL,
  "moduleKey" TEXT,
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "manifest" JSONB,
  CONSTRAINT "NenAbility_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorldBranch" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "WorldBranchKind" NOT NULL DEFAULT 'SIMULATION',
  "rulePolicy" "WorldBranchPolicy" NOT NULL DEFAULT 'RULE_COMPATIBLE',
  "parentBranchId" TEXT,
  "forkEventId" TEXT NOT NULL,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorldBranch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorldEventRecord" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "chapterNumber" INTEGER NOT NULL,
  "localSequence" INTEGER NOT NULL,
  "sourceIds" TEXT[],
  "revealedAtChapter" INTEGER,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorldEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorldProjectionSnapshot" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "projectionKind" TEXT NOT NULL,
  "cursorOrdinal" INTEGER NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorldProjectionSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorldEntity" (
  "id" TEXT NOT NULL,
  "kind" "WorldEntityKind" NOT NULL,
  "label" TEXT NOT NULL,
  "canonicalRefId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorldEntity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpatialObservation" (
  "id" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "fromOrdinal" INTEGER NOT NULL,
  "untilOrdinal" INTEGER,
  "locationId" TEXT,
  "precision" TEXT NOT NULL,
  "certainty" TEXT NOT NULL,
  "probability" DOUBLE PRECISION,
  "observedAtEventId" TEXT,
  CONSTRAINT "SpatialObservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorldEffectRecord" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "abilityId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "sourceEntityId" TEXT NOT NULL,
  "targetEntityIds" TEXT[],
  "state" TEXT NOT NULL,
  "startedOrdinal" INTEGER NOT NULL,
  "endedOrdinal" INTEGER,
  "attributes" JSONB NOT NULL,
  "anchors" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorldEffectRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LocationEdge" (
  "id" TEXT NOT NULL,
  "fromLocationId" TEXT NOT NULL,
  "toLocationId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "direction" TEXT NOT NULL DEFAULT 'BOTH',
  "accessRuleIds" TEXT[],
  "fromOrdinal" INTEGER,
  "untilOrdinal" INTEGER,
  "metadata" JSONB,
  CONSTRAINT "LocationEdge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MapAssetManifest" (
  "id" TEXT NOT NULL,
  "assetKey" TEXT NOT NULL,
  "coordinateSystem" TEXT NOT NULL,
  "width" DOUBLE PRECISION NOT NULL,
  "height" DOUBLE PRECISION NOT NULL,
  "regions" JSONB NOT NULL,
  "anchors" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MapAssetManifest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorldEventRecord_branchId_ordinal_key" ON "WorldEventRecord"("branchId", "ordinal");
CREATE UNIQUE INDEX "WorldProjectionSnapshot_branchId_projectionKind_cursorOrdinal_key" ON "WorldProjectionSnapshot"("branchId", "projectionKind", "cursorOrdinal");
CREATE UNIQUE INDEX "MapAssetManifest_assetKey_key" ON "MapAssetManifest"("assetKey");
CREATE INDEX "NenAbility_ownerId_idx" ON "NenAbility"("ownerId");
CREATE INDEX "NenAbility_moduleKey_idx" ON "NenAbility"("moduleKey");
CREATE INDEX "WorldBranch_parentBranchId_idx" ON "WorldBranch"("parentBranchId");
CREATE INDEX "WorldBranch_forkEventId_idx" ON "WorldBranch"("forkEventId");
CREATE INDEX "WorldBranch_ownerId_idx" ON "WorldBranch"("ownerId");
CREATE INDEX "WorldEventRecord_branchId_type_idx" ON "WorldEventRecord"("branchId", "type");
CREATE INDEX "WorldProjectionSnapshot_branchId_projectionKind_cursorOrdinal_idx" ON "WorldProjectionSnapshot"("branchId", "projectionKind", "cursorOrdinal" DESC);
CREATE INDEX "WorldEntity_kind_idx" ON "WorldEntity"("kind");
CREATE INDEX "WorldEntity_canonicalRefId_idx" ON "WorldEntity"("canonicalRefId");
CREATE INDEX "SpatialObservation_branchId_fromOrdinal_untilOrdinal_idx" ON "SpatialObservation"("branchId", "fromOrdinal", "untilOrdinal");
CREATE INDEX "SpatialObservation_entityId_branchId_idx" ON "SpatialObservation"("entityId", "branchId");
CREATE INDEX "SpatialObservation_locationId_branchId_idx" ON "SpatialObservation"("locationId", "branchId");
CREATE INDEX "WorldEffectRecord_branchId_state_idx" ON "WorldEffectRecord"("branchId", "state");
CREATE INDEX "WorldEffectRecord_abilityId_idx" ON "WorldEffectRecord"("abilityId");
CREATE INDEX "WorldEffectRecord_sourceEntityId_idx" ON "WorldEffectRecord"("sourceEntityId");
CREATE INDEX "LocationEdge_fromLocationId_idx" ON "LocationEdge"("fromLocationId");
CREATE INDEX "LocationEdge_toLocationId_idx" ON "LocationEdge"("toLocationId");

ALTER TABLE "WorldBranch" ADD CONSTRAINT "WorldBranch_parentBranchId_fkey" FOREIGN KEY ("parentBranchId") REFERENCES "WorldBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorldBranch" ADD CONSTRAINT "WorldBranch_forkEventId_fkey" FOREIGN KEY ("forkEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorldEventRecord" ADD CONSTRAINT "WorldEventRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "WorldBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorldProjectionSnapshot" ADD CONSTRAINT "WorldProjectionSnapshot_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "WorldBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpatialObservation" ADD CONSTRAINT "SpatialObservation_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "WorldEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NenAbility" ADD CONSTRAINT "NenAbility_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
