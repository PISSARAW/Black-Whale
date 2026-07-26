-- CreateEnum
CREATE TYPE "NarrativeImportance" AS ENUM ('PRIMARY', 'SECONDARY', 'MINOR', 'BACKGROUND');

-- CreateEnum
CREATE TYPE "AffiliationType" AS ENUM ('ROYAL_FAMILY', 'PRINCE_CAMP', 'KAKIN_ROYAL_ARMY', 'BENJAMIN_PRIVATE_ARMY', 'HUNTER_ASSOCIATION', 'MAFIA_FAMILY', 'PHANTOM_TROUPE', 'EXPEDITION_TEAM', 'JUSTICE_POLICE', 'CIVILIAN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('LEADER', 'EXECUTIVE', 'MEMBER', 'ASSOCIATE', 'PRISONER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXILED', 'DECEASED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CohortProfile" AS ENUM ('PASSENGERS', 'MEDICAL_STAFF', 'WORKERS', 'MILITARY', 'VIP_GUESTS', 'MAFIA_ASSOCIATES');

-- CreateEnum
CREATE TYPE "ParticipationType" AS ENUM ('ACTIVE', 'PASSIVE', 'OBSERVER', 'VICTIM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('ORIGINAL', 'CLONE', 'COPY', 'CONSTRUCT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ConsciousnessType" AS ENUM ('ORIGINAL', 'COPIED', 'ARTIFICIAL', 'NEN_ENTITY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OccupancyType" AS ENUM ('ORIGINAL', 'TRANSFERRED', 'POSSESSED', 'CONTROLLED', 'EMPTY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Certainty" AS ENUM ('CONFIRMED', 'PROBABLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('SHIP', 'TIER', 'ZONE', 'ROOM', 'CORRIDOR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SpatialEntityType" AS ENUM ('BODY', 'NEN_BEAST', 'CLONE', 'OBJECT', 'AURA_ENTITY', 'COHORT');

-- CreateEnum
CREATE TYPE "PresencePrecision" AS ENUM ('EXACT_ROOM', 'ZONE', 'TIER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PresenceCertainty" AS ENUM ('CONFIRMED', 'PROBABLE', 'LAST_KNOWN');

-- CreateEnum
CREATE TYPE "BodyStateType" AS ENUM ('ALIVE', 'INJURED', 'UNCONSCIOUS', 'DEAD', 'DESTROYED', 'PRESERVED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ConsciousnessStateType" AS ENUM ('ACTIVE', 'UNCONSCIOUS', 'TRANSFERRED', 'SUPPRESSED', 'DORMANT', 'DISCONNECTED', 'DESTROYED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AppearanceCause" AS ENUM ('NATURAL', 'TRANSFORMATION', 'DISGUISE', 'NEN_ABILITY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FactSubjectType" AS ENUM ('CHARACTER', 'BODY', 'CONSCIOUSNESS', 'LOCATION', 'EVENT', 'ABILITY', 'AFFILIATION', 'COHORT');

-- CreateEnum
CREATE TYPE "TruthStatus" AS ENUM ('CONFIRMED', 'STRONGLY_IMPLIED', 'DEDUCTION', 'CONTESTED');

-- CreateEnum
CREATE TYPE "EpistemicState" AS ENUM ('KNOWN', 'BELIEVED', 'SUSPECTED', 'DOUBTED', 'REJECTED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AcquisitionMethod" AS ENUM ('DIRECT_OBSERVATION', 'TOLD_BY_OTHER', 'DEDUCTION', 'NEN_ABILITY', 'DOCUMENT', 'RUMOR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('DIRECT_SPEECH', 'PHONE', 'MESSAGE', 'REPORT', 'BROADCAST', 'NEN_LINK');

-- CreateEnum
CREATE TYPE "Reliability" AS ENUM ('TRUSTED', 'UNVERIFIED', 'DECEPTIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WorldBranchKind" AS ENUM ('CANON', 'THEORY', 'SIMULATION');

-- CreateEnum
CREATE TYPE "WorldBranchPolicy" AS ENUM ('STRICT_CANON', 'RULE_COMPATIBLE', 'SANDBOX');

-- CreateEnum
CREATE TYPE "WorldEntityKind" AS ENUM ('CHARACTER', 'BODY', 'CONSCIOUSNESS', 'OBJECT', 'NEN_ENTITY', 'AURA_ENTITY', 'COHORT', 'PORTAL', 'CURSE', 'CONSTRUCT', 'LOCATION');

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "aliases" TEXT[],
    "description" TEXT,
    "narrativeImportance" "NarrativeImportance" NOT NULL DEFAULT 'MINOR',
    "modelingLevel" INTEGER NOT NULL DEFAULT 3,
    "firstVisibleEventId" TEXT NOT NULL,
    "portraitAssetId" TEXT,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Faction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AffiliationType" NOT NULL,
    "leaderId" TEXT,

    CONSTRAINT "Faction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliationMembership" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "factionId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,

    CONSTRAINT "AffiliationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterRole" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,

    CONSTRAINT "CharacterRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterAssignment" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "assignedPrinceId" TEXT NOT NULL,
    "officialRole" TEXT NOT NULL,
    "trueAllegianceId" TEXT,
    "knownAllegianceId" TEXT,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,

    CONSTRAINT "CharacterAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopulationCohort" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "estimatedCount" INTEGER,
    "profile" "CohortProfile" NOT NULL,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,

    CONSTRAINT "PopulationCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "participantType" TEXT NOT NULL,
    "participationType" "ParticipationType" NOT NULL,

    CONSTRAINT "EventParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Body" (
    "id" TEXT NOT NULL,
    "originalCharacterId" TEXT,
    "label" TEXT NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "firstVisibleEventId" TEXT NOT NULL,

    CONSTRAINT "Body_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consciousness" (
    "id" TEXT NOT NULL,
    "originCharacterId" TEXT,
    "label" TEXT NOT NULL,
    "consciousnessType" "ConsciousnessType" NOT NULL,
    "firstVisibleEventId" TEXT NOT NULL,

    CONSTRAINT "Consciousness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyOccupancy" (
    "id" TEXT NOT NULL,
    "bodyId" TEXT NOT NULL,
    "consciousnessId" TEXT,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,
    "occupancyType" "OccupancyType" NOT NULL,
    "certainty" "Certainty" NOT NULL,

    CONSTRAINT "BodyOccupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentLocationId" TEXT,
    "type" "LocationType" NOT NULL,
    "mapElementId" TEXT,
    "firstVisibleEventId" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativeEvent" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "ordinal" INTEGER,
    "isFlashback" BOOLEAN NOT NULL DEFAULT false,
    "occurredAtLabel" TEXT,
    "occursOnBlackWhale" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "NarrativeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "entityType" "SpatialEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "locationId" TEXT,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,
    "precision" "PresencePrecision" NOT NULL,
    "certainty" "PresenceCertainty" NOT NULL,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyState" (
    "id" TEXT NOT NULL,
    "bodyId" TEXT NOT NULL,
    "state" "BodyStateType" NOT NULL,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,

    CONSTRAINT "BodyState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsciousnessState" (
    "id" TEXT NOT NULL,
    "consciousnessId" TEXT NOT NULL,
    "state" "ConsciousnessStateType" NOT NULL,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,

    CONSTRAINT "ConsciousnessState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppearanceState" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "appearanceCharacterId" TEXT,
    "appearanceAssetId" TEXT,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,
    "cause" "AppearanceCause" NOT NULL,

    CONSTRAINT "AppearanceState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fact" (
    "id" TEXT NOT NULL,
    "subjectType" "FactSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "predicate" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "validFromEventId" TEXT NOT NULL,
    "validUntilEventId" TEXT,
    "truthStatus" "TruthStatus" NOT NULL,
    "firstVisibleEventId" TEXT NOT NULL,

    CONSTRAINT "Fact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeState" (
    "id" TEXT NOT NULL,
    "observerCharacterId" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,
    "epistemicState" "EpistemicState" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "acquisitionMethod" "AcquisitionMethod" NOT NULL,
    "sourceCharacterId" TEXT,
    "acquisitionEventId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Belief" (
    "id" TEXT NOT NULL,
    "observerCharacterId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "predicate" TEXT NOT NULL,
    "believedValue" JSONB NOT NULL,
    "fromEventId" TEXT NOT NULL,
    "untilEventId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceEventId" TEXT NOT NULL,

    CONSTRAINT "Belief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformationTransferEvent" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "transmissionType" "TransmissionType" NOT NULL,
    "reliability" "Reliability" NOT NULL,
    "receiverIds" TEXT[],
    "factIds" TEXT[],

    CONSTRAINT "InformationTransferEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "page" INTEGER,
    "description" TEXT,
    "presenceId" TEXT,
    "bodyStateId" TEXT,
    "consciousnessStateId" TEXT,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "WorldEntity" (
    "id" TEXT NOT NULL,
    "kind" "WorldEntityKind" NOT NULL,
    "label" TEXT NOT NULL,
    "canonicalRefId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "_BodyOccupancySources" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FactSources" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Character_slug_key" ON "Character"("slug");

-- CreateIndex
CREATE INDEX "NenAbility_ownerId_idx" ON "NenAbility"("ownerId");

-- CreateIndex
CREATE INDEX "NenAbility_moduleKey_idx" ON "NenAbility"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "Body_originalCharacterId_key" ON "Body"("originalCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX "Consciousness_originCharacterId_key" ON "Consciousness"("originCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_number_key" ON "Chapter"("number");

-- CreateIndex
CREATE UNIQUE INDEX "NarrativeEvent_ordinal_key" ON "NarrativeEvent"("ordinal");

-- CreateIndex
CREATE INDEX "WorldBranch_parentBranchId_idx" ON "WorldBranch"("parentBranchId");

-- CreateIndex
CREATE INDEX "WorldBranch_forkEventId_idx" ON "WorldBranch"("forkEventId");

-- CreateIndex
CREATE INDEX "WorldBranch_ownerId_idx" ON "WorldBranch"("ownerId");

-- CreateIndex
CREATE INDEX "WorldEventRecord_branchId_type_idx" ON "WorldEventRecord"("branchId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "WorldEventRecord_branchId_ordinal_key" ON "WorldEventRecord"("branchId", "ordinal");

-- CreateIndex
CREATE INDEX "WorldProjectionSnapshot_branchId_projectionKind_cursorOrdin_idx" ON "WorldProjectionSnapshot"("branchId", "projectionKind", "cursorOrdinal" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "WorldProjectionSnapshot_branchId_projectionKind_cursorOrdin_key" ON "WorldProjectionSnapshot"("branchId", "projectionKind", "cursorOrdinal");

-- CreateIndex
CREATE INDEX "WorldEntity_kind_idx" ON "WorldEntity"("kind");

-- CreateIndex
CREATE INDEX "WorldEntity_canonicalRefId_idx" ON "WorldEntity"("canonicalRefId");

-- CreateIndex
CREATE INDEX "SpatialObservation_branchId_fromOrdinal_untilOrdinal_idx" ON "SpatialObservation"("branchId", "fromOrdinal", "untilOrdinal");

-- CreateIndex
CREATE INDEX "SpatialObservation_entityId_branchId_idx" ON "SpatialObservation"("entityId", "branchId");

-- CreateIndex
CREATE INDEX "SpatialObservation_locationId_branchId_idx" ON "SpatialObservation"("locationId", "branchId");

-- CreateIndex
CREATE INDEX "WorldEffectRecord_branchId_state_idx" ON "WorldEffectRecord"("branchId", "state");

-- CreateIndex
CREATE INDEX "WorldEffectRecord_abilityId_idx" ON "WorldEffectRecord"("abilityId");

-- CreateIndex
CREATE INDEX "WorldEffectRecord_sourceEntityId_idx" ON "WorldEffectRecord"("sourceEntityId");

-- CreateIndex
CREATE INDEX "LocationEdge_fromLocationId_idx" ON "LocationEdge"("fromLocationId");

-- CreateIndex
CREATE INDEX "LocationEdge_toLocationId_idx" ON "LocationEdge"("toLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "MapAssetManifest_assetKey_key" ON "MapAssetManifest"("assetKey");

-- CreateIndex
CREATE UNIQUE INDEX "_BodyOccupancySources_AB_unique" ON "_BodyOccupancySources"("A", "B");

-- CreateIndex
CREATE INDEX "_BodyOccupancySources_B_index" ON "_BodyOccupancySources"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FactSources_AB_unique" ON "_FactSources"("A", "B");

-- CreateIndex
CREATE INDEX "_FactSources_B_index" ON "_FactSources"("B");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_firstVisibleEventId_fkey" FOREIGN KEY ("firstVisibleEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NenAbility" ADD CONSTRAINT "NenAbility_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliationMembership" ADD CONSTRAINT "AffiliationMembership_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliationMembership" ADD CONSTRAINT "AffiliationMembership_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliationMembership" ADD CONSTRAINT "AffiliationMembership_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliationMembership" ADD CONSTRAINT "AffiliationMembership_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRole" ADD CONSTRAINT "CharacterRole_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRole" ADD CONSTRAINT "CharacterRole_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRole" ADD CONSTRAINT "CharacterRole_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterAssignment" ADD CONSTRAINT "CharacterAssignment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterAssignment" ADD CONSTRAINT "CharacterAssignment_trueAllegianceId_fkey" FOREIGN KEY ("trueAllegianceId") REFERENCES "Faction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterAssignment" ADD CONSTRAINT "CharacterAssignment_knownAllegianceId_fkey" FOREIGN KEY ("knownAllegianceId") REFERENCES "Faction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterAssignment" ADD CONSTRAINT "CharacterAssignment_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterAssignment" ADD CONSTRAINT "CharacterAssignment_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopulationCohort" ADD CONSTRAINT "PopulationCohort_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopulationCohort" ADD CONSTRAINT "PopulationCohort_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopulationCohort" ADD CONSTRAINT "PopulationCohort_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NarrativeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Body" ADD CONSTRAINT "Body_firstVisibleEventId_fkey" FOREIGN KEY ("firstVisibleEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Body" ADD CONSTRAINT "Body_originalCharacterId_fkey" FOREIGN KEY ("originalCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consciousness" ADD CONSTRAINT "Consciousness_firstVisibleEventId_fkey" FOREIGN KEY ("firstVisibleEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consciousness" ADD CONSTRAINT "Consciousness_originCharacterId_fkey" FOREIGN KEY ("originCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyOccupancy" ADD CONSTRAINT "BodyOccupancy_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "Body"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyOccupancy" ADD CONSTRAINT "BodyOccupancy_consciousnessId_fkey" FOREIGN KEY ("consciousnessId") REFERENCES "Consciousness"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyOccupancy" ADD CONSTRAINT "BodyOccupancy_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyOccupancy" ADD CONSTRAINT "BodyOccupancy_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_firstVisibleEventId_fkey" FOREIGN KEY ("firstVisibleEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentLocationId_fkey" FOREIGN KEY ("parentLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativeEvent" ADD CONSTRAINT "NarrativeEvent_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_bodyId_fkey" FOREIGN KEY ("entityId") REFERENCES "Body"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyState" ADD CONSTRAINT "BodyState_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "Body"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyState" ADD CONSTRAINT "BodyState_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyState" ADD CONSTRAINT "BodyState_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsciousnessState" ADD CONSTRAINT "ConsciousnessState_consciousnessId_fkey" FOREIGN KEY ("consciousnessId") REFERENCES "Consciousness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsciousnessState" ADD CONSTRAINT "ConsciousnessState_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsciousnessState" ADD CONSTRAINT "ConsciousnessState_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppearanceState" ADD CONSTRAINT "Appearance_bodyId_fkey" FOREIGN KEY ("entityId") REFERENCES "Body"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppearanceState" ADD CONSTRAINT "AppearanceState_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppearanceState" ADD CONSTRAINT "AppearanceState_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fact" ADD CONSTRAINT "Fact_firstVisibleEventId_fkey" FOREIGN KEY ("firstVisibleEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fact" ADD CONSTRAINT "Fact_validFromEventId_fkey" FOREIGN KEY ("validFromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fact" ADD CONSTRAINT "Fact_validUntilEventId_fkey" FOREIGN KEY ("validUntilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeState" ADD CONSTRAINT "KnowledgeState_observerCharacterId_fkey" FOREIGN KEY ("observerCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeState" ADD CONSTRAINT "KnowledgeState_sourceCharacterId_fkey" FOREIGN KEY ("sourceCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeState" ADD CONSTRAINT "KnowledgeState_factId_fkey" FOREIGN KEY ("factId") REFERENCES "Fact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeState" ADD CONSTRAINT "KnowledgeState_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeState" ADD CONSTRAINT "KnowledgeState_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeState" ADD CONSTRAINT "KnowledgeState_acquisitionEventId_fkey" FOREIGN KEY ("acquisitionEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Belief" ADD CONSTRAINT "Belief_observerCharacterId_fkey" FOREIGN KEY ("observerCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Belief" ADD CONSTRAINT "Belief_fromEventId_fkey" FOREIGN KEY ("fromEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Belief" ADD CONSTRAINT "Belief_untilEventId_fkey" FOREIGN KEY ("untilEventId") REFERENCES "NarrativeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Belief" ADD CONSTRAINT "Belief_sourceEventId_fkey" FOREIGN KEY ("sourceEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_presenceId_fkey" FOREIGN KEY ("presenceId") REFERENCES "Presence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_bodyStateId_fkey" FOREIGN KEY ("bodyStateId") REFERENCES "BodyState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_consciousnessStateId_fkey" FOREIGN KEY ("consciousnessStateId") REFERENCES "ConsciousnessState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldBranch" ADD CONSTRAINT "WorldBranch_parentBranchId_fkey" FOREIGN KEY ("parentBranchId") REFERENCES "WorldBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldBranch" ADD CONSTRAINT "WorldBranch_forkEventId_fkey" FOREIGN KEY ("forkEventId") REFERENCES "NarrativeEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldEventRecord" ADD CONSTRAINT "WorldEventRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "WorldBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldProjectionSnapshot" ADD CONSTRAINT "WorldProjectionSnapshot_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "WorldBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpatialObservation" ADD CONSTRAINT "SpatialObservation_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "WorldEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BodyOccupancySources" ADD CONSTRAINT "_BodyOccupancySources_A_fkey" FOREIGN KEY ("A") REFERENCES "BodyOccupancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BodyOccupancySources" ADD CONSTRAINT "_BodyOccupancySources_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FactSources" ADD CONSTRAINT "_FactSources_A_fkey" FOREIGN KEY ("A") REFERENCES "Fact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FactSources" ADD CONSTRAINT "_FactSources_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
