-- The voyage clock: in-world time in hours since the departure horn.
--
-- `occurredAtLabel` already existed but was hand-written and unordered — a
-- string cannot say whether "Day 8" is printed in the chapter or worked out
-- from the chapter before it, and nothing can sort by it. The label is now
-- rendered from these columns by prisma/backfill_timeline.mjs.
ALTER TABLE "NarrativeEvent" ADD COLUMN "occurredAtBasis" TEXT;
ALTER TABLE "NarrativeEvent" ADD COLUMN "occurredAtHours" DOUBLE PRECISION;
ALTER TABLE "NarrativeEvent" ADD COLUMN "occurredAtEarliest" DOUBLE PRECISION;
ALTER TABLE "NarrativeEvent" ADD COLUMN "occurredAtLatest" DOUBLE PRECISION;

-- Provenance, kept apart from strength: a Hunterpedia dating is real data
-- and a panel is a different claim, so the timeline can show which is which.
ALTER TABLE "NarrativeEvent" ADD COLUMN "occurredAtSource" TEXT;
