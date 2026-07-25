import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const abilities = await prisma.nenAbility.findMany({
    orderBy: { name: 'asc' }
  });

  const characters = await prisma.character.findMany({
    orderBy: { canonicalName: 'asc' }
  });

  return {
    abilities: abilities as any[],
    characters: characters as any[]
  };
};
