import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const chapters = await prisma.chapter.findMany({
    orderBy: { number: 'asc' },
    include: {
      events: {
        orderBy: { sequence: 'asc' }
      }
    }
  });

  return {
    chapters: chapters as any[]
  };
};
