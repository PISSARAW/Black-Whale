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
    where: maxChapter !== Infinity ? { chapter: { number: { lte: maxChapter } } } : undefined,
    orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
    include: { chapter: true }
  });

  const defaultEvent = events[events.length - 1];
  const selectedEventId = url.searchParams.get('eventId') || defaultEvent?.id || '';
  const selectedLeft = url.searchParams.get('left') || characters[0]?.id || '';
  const selectedRight = url.searchParams.get('right') || characters[1]?.id || '';

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

  if (selectedEventId) {
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    selectedEventSequence = selectedEvent?.sequence ?? selectedEventSequence;

    if (selectedEventSequence !== undefined) {
      const rawWorld = await timelineEngine.getWorldState({ sequence: selectedEventSequence });
      const locations = await prisma.location.findMany();
      worldState = {
        ...rawWorld,
        locations: spoilerProfile ? filterVisible(locations as any, spoilerProfile) as any : locations
      };
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
    worldState,
    sync,
    spoilerLimit: spoilerProfile?.maxChapter ?? null
  };
};
