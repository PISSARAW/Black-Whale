-- What a live archive holds, in miniature.
--
-- Two kinds of row, and the whole point of the drill is that they are not the
-- same kind of loss: the chapter, the event and the character are canon, and
-- git could write them again through the compiler. The branch and its event
-- record are what a visitor made, and nothing but a backup can give them back.
--
-- Enough of each to prove the restore path, and no more: the drill is about
-- the dump and restore code, not about the catalogue.

INSERT INTO public."Chapter" (id, number, title)
VALUES ('chapter-drill', 401, 'The drill');

INSERT INTO public."NarrativeEvent" (id, "chapterId", sequence, title, summary)
VALUES ('event-drill', 'chapter-drill', 1, 'Departure', 'The horn sounds.');

INSERT INTO public."Character" (id, slug, "canonicalName", aliases, "firstVisibleEventId")
VALUES ('character-drill', 'drill-passenger', 'Drill Passenger', '{}', 'event-drill');

-- A visitor's simulation: a branch forked from that event, and one event
-- recorded on it. This is the irreplaceable half.
INSERT INTO public."WorldBranch" (id, name, "forkEventId")
VALUES ('branch-drill', 'A visitor simulation', 'event-drill');

-- A branch forked from another branch. `WorldBranch` references itself, so
-- pg_dump warns that a data-only dump may not restore: a child written before
-- its parent would violate the foreign key on the way back in. The drill seeds
-- one so that the day it stops restoring is a red build and not a red evening.
INSERT INTO public."WorldBranch" (id, name, "forkEventId", "parentBranchId")
VALUES ('branch-drill-child', 'A fork of that simulation', 'event-drill', 'branch-drill');

INSERT INTO public."WorldEventRecord"
  (id, "branchId", ordinal, type, "chapterNumber", "localSequence", "sourceIds", payload)
VALUES
  ('record-drill', 'branch-drill', 1, 'ABILITY_ACTIVATED', 401, 1, '{}', '{"abilityId":"bungee-gum"}');
