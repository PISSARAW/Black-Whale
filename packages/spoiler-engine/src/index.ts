export interface SpoilerProfile {
  maxChapter: number;
}

export interface VisibleEntity {
  firstVisibleChapter: number;
}

/**
 * Returns a Prisma WHERE clause snippet to filter entities by spoiler limit.
 */
export function getSpoilerFilter(profile?: SpoilerProfile) {
  if (!profile || profile.maxChapter === Infinity) {
    return {};
  }
  return {
    firstVisibleChapter: {
      lte: profile.maxChapter,
    },
  };
}

/**
 * In-memory filter for an array of entities.
 */
export function filterVisible<T extends VisibleEntity>(
  entities: T[],
  profile?: SpoilerProfile,
): T[] {
  if (!profile || profile.maxChapter === Infinity) {
    return entities;
  }
  return entities.filter(
    (entity) => entity.firstVisibleChapter <= profile.maxChapter,
  );
}

/**
 * Specifically for temporal records (Presence, State, Affiliation) 
 * where we need to check the event's visibility. 
 * Assumes the record has a joined `fromEvent: { firstVisibleChapter: number }`.
 */
export function filterTemporalRecords<T extends { fromEvent: VisibleEntity }>(
  records: T[],
  profile?: SpoilerProfile,
): T[] {
  if (!profile || profile.maxChapter === Infinity) {
    return records;
  }
  return records.filter(
    (record) => record.fromEvent.firstVisibleChapter <= profile.maxChapter,
  );
}

/**
 * Removes the `untilEvent` if it occurs after the maxChapter, 
 * simulating that the state is still current for the user.
 */
export function maskFutureEnds<T extends { untilEvent?: VisibleEntity | null }>(
  records: T[],
  profile?: SpoilerProfile,
): T[] {
  if (!profile || profile.maxChapter === Infinity) {
    return records;
  }
  return records.map((record) => {
    if (
      record.untilEvent &&
      record.untilEvent.firstVisibleChapter > profile.maxChapter
    ) {
      return { ...record, untilEvent: null };
    }
    return record;
  });
}
