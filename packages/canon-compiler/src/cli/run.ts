import { PrismaClient } from '@prisma/client'

/**
 * The shell every compiler pass runs inside.
 *
 * One client, one disconnect, and a non-zero exit on failure — the deploy runs
 * these before the previous release stops serving, so a pass that fails has to
 * say so loudly enough to stop the release rather than log and succeed.
 */
export function run(pass: (prisma: PrismaClient) => Promise<unknown>): void {
  const prisma = new PrismaClient()
  pass(prisma)
    .then((summary) => {
      if (summary !== undefined) console.log(JSON.stringify(summary, null, 2))
    })
    .catch((error: unknown) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
