import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const sources = await prisma.source.findMany({
    orderBy: [{ chapterNumber: 'asc' }, { page: 'asc' }],
    include: {
      presence: true,
      bodyState: true,
      consciousnessState: true
    }
  });

  return {
    sources: sources as any[]
  };
};
