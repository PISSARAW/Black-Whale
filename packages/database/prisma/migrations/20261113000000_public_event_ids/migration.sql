-- Public routes use a catalogue-owned identifier rather than a mutable title
-- or a database UUID. Existing rows are populated by compile:timeline during
-- the same deployment; editorial-only events remain nullable.
ALTER TABLE "NarrativeEvent" ADD COLUMN "sourceId" TEXT;

CREATE UNIQUE INDEX "NarrativeEvent_sourceId_key" ON "NarrativeEvent"("sourceId");
