ALTER TABLE "NarrativeEvent"
ADD COLUMN "occursOnBlackWhale" BOOLEAN NOT NULL DEFAULT true;

UPDATE "NarrativeEvent" event
SET "occursOnBlackWhale" = false
FROM "Chapter" chapter
WHERE event."chapterId" = chapter."id"
  AND (chapter."number" < 359 OR chapter."number" IN (396, 397));
