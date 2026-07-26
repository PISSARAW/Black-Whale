import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { filterVisible } from '@black-whale/spoiler-engine';
import { TimelineEngine } from '@black-whale/timeline-engine';

export const load: PageServerLoad = async ({ cookies, url, fetch }) => {
  const spoilerLimitCookie = cookies.get('userSpoilerLimit');
  const maxChapter = spoilerLimitCookie ? parseInt(spoilerLimitCookie) : Infinity;
  const spoilerProfile = spoilerLimitCookie ? { maxChapter } : undefined;

  let characters = await prisma.character.findMany({
    orderBy: { canonicalName: 'asc' },
    include: { firstVisibleEvent: { include: { chapter: true } } }
  });

  if (spoilerProfile) {
    characters = filterVisible(characters as any, spoilerProfile) as any;
  }

  const events = await prisma.narrativeEvent.findMany({
    where: {
      occursOnBlackWhale: true,
      ...(maxChapter !== Infinity ? { chapter: { number: { lte: maxChapter } } } : {})
    },
    orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
    include: { chapter: true }
  });

  const defaultEvent = events[events.length - 1];
  const selectedEventId = url.searchParams.get('eventId') || defaultEvent?.id || '';
  const selectedLeft = url.searchParams.get('left') || characters[0]?.id || '';
  const selectedRight = url.searchParams.get('right') || characters[1]?.id || '';
  const compareCanonical = url.searchParams.get('canonical') === '1';

  const sync = {
    zoom: Number(url.searchParams.get('zoom') || '1'),
    tier: url.searchParams.get('tier') || 'tier-1',
    zone: url.searchParams.get('zone') || '',
    subject: url.searchParams.get('subject') || ''
  };

  let leftPerspective: any = null;
  let rightPerspective: any = null;
  let comparison: any[] = [];

  if (selectedEventId && selectedLeft && selectedRight) {
    try {
      const [leftRes, rightRes, compareRes] = await Promise.all([
        fetch(`http://localhost:3001/v1/perspectives/${selectedLeft}?eventId=${selectedEventId}`),
        fetch(`http://localhost:3001/v1/perspectives/${selectedRight}?eventId=${selectedEventId}`),
        fetch(`http://localhost:3001/v1/perspectives/compare?left=${selectedLeft}&right=${selectedRight}&eventId=${selectedEventId}`)
      ]);

      if (leftRes.ok) leftPerspective = await leftRes.json();
      if (rightRes.ok) rightPerspective = await rightRes.json();
      if (compareRes.ok) comparison = await compareRes.json();
    } catch (error) {
      console.error('Failed to fetch perspective comparison payloads', error);
    }
  }

  const timelineEngine = new TimelineEngine(prisma as any);
  let worldState: any = null;
  let selectedEventSequence = defaultEvent?.sequence;
  let selectedEventChapter = defaultEvent?.chapter?.number;
  let canonicalTruth: any = {
    facts: [],
    positions: {},
    chapter: selectedEventChapter || null,
    restrictedBySpoiler: spoilerProfile?.maxChapter ?? null
  };

  if (selectedEventId) {
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    selectedEventSequence = selectedEvent?.sequence ?? selectedEventSequence;
    selectedEventChapter = selectedEvent?.chapter?.number ?? selectedEventChapter;

    if (selectedEventSequence !== undefined) {
      const rawWorld = await timelineEngine.getWorldState({ eventId: selectedEventId });
      const locations = await prisma.location.findMany();
      worldState = {
        ...rawWorld,
        locations: spoilerProfile ? filterVisible(locations as any, spoilerProfile) as any : locations
      };

      if (compareCanonical) {
        const objectiveFacts = await prisma.fact.findMany({
          where: {
            fromEvent: {
              sequence: { lte: selectedEventSequence }
            },
            OR: [
              { validUntilEventId: null },
              {
                untilEvent: {
                  sequence: { gt: selectedEventSequence }
                }
              }
            ]
          }
        });

        const bodyById = new Map((rawWorld.bodies || []).map((body: any) => [body.id, body]));
        const positions: Record<string, { locationId: string | null; certainty: string }> = {};

        for (const presence of rawWorld.presences || []) {
          const body = bodyById.get(presence.entityId);
          const subjectId = body?.originalCharacterId || presence.entityId;
          positions[subjectId] = {
            locationId: presence.locationId || null,
            certainty: presence.certainty || 'CONFIRMED'
          };
        }

        canonicalTruth = {
          facts: objectiveFacts,
          positions,
          chapter: selectedEventChapter || null,
          restrictedBySpoiler: spoilerProfile?.maxChapter ?? null
        };
      }
    }
  }

  return {
    characters,
    events,
    selectedEventId,
    selectedLeft,
    selectedRight,
    leftPerspective,
    rightPerspective,
    comparison,
    compareCanonical,
    canonicalTruth,
    worldState,
    sync,
    spoilerLimit: spoilerProfile?.maxChapter ?? null
  };
};
