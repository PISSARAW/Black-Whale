-- Four models with no reader anywhere in the repository, and one enum that
-- existed only to type one of them. ADR-001 §2.4: the schema should describe
-- what the archive stores, and these described an intention that was never
-- built — spatial observations and map manifests were superseded by the
-- blueprint in `data/ship/`, and LocationEdge by `plan.doorways`.
--
-- They hold no rows in production: nothing has ever written to them.

-- DropForeignKey
ALTER TABLE "SpatialObservation" DROP CONSTRAINT "SpatialObservation_entityId_fkey";

-- DropTable
DROP TABLE "LocationEdge";

-- DropTable
DROP TABLE "MapAssetManifest";

-- DropTable
DROP TABLE "SpatialObservation";

-- DropTable
DROP TABLE "WorldEntity";

-- DropEnum
DROP TYPE "WorldEntityKind";
