import type { PageServerLoad } from './$types';
import { getPrisma } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const prisma = await getPrisma();
  
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
