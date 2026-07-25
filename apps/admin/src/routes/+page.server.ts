import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const chaptersCount = await prisma.chapter.count();
  const abilitiesCount = await prisma.nenAbility.count();
  const charactersCount = await prisma.character.count();
  const sourcesCount = await prisma.source.count();
  const eventsCount = await prisma.narrativeEvent.count();
  const factsCount = await prisma.fact.count();

  return {
    stats: {
      chapters: chaptersCount,
      abilities: abilitiesCount,
      characters: charactersCount,
      sources: sourcesCount,
      events: eventsCount,
      facts: factsCount
    }
  };
};
