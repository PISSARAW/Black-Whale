ALTER TABLE "NarrativeEvent"
ADD COLUMN "isFlashback" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "occurredAtLabel" TEXT;

COMMENT ON COLUMN "NarrativeEvent"."ordinal" IS
'Chronological occurrence order aboard the Black Whale; it may differ from chapter publication order for flashbacks.';
