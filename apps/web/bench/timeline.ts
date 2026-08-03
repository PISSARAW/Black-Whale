import { PrismaClient } from '@prisma/client'
import { TimelineEngine } from '@black-whale/canon-engine'

/**
 * What the timeline engine costs, against a real database.
 *
 * Run it before and after touching the engine. The late point is the worst
 * case on purpose: everyone has boarded and nobody has left yet, so every
 * interval table is at its widest.
 */

const prisma = new PrismaClient()
const timeline = new TimelineEngine(prisma as never)

async function time(label: string, run: () => Promise<unknown>, runs = 5): Promise<void> {
  const marks: number[] = []
  for (let attempt = 0; attempt < runs; attempt += 1) {
    const start = performance.now()
    await run()
    marks.push(performance.now() - start)
  }
  marks.sort((left, right) => left - right)
  const median = marks[Math.floor(runs / 2)] ?? 0
  console.log(`${label.padEnd(40)} median ${median.toFixed(0)} ms  best ${marks[0]!.toFixed(0)} ms`)
}

const events = await prisma.narrativeEvent.findMany({
  orderBy: { ordinal: 'asc' },
  include: { chapter: true },
})
const early = events[Math.floor(events.length * 0.2)]
const late = events[events.length - 1]
if (!early || !late)
  throw new Error('La base ne contient pas d’événements : lancez le compilateur.')

console.log(
  `${events.length} événements ; tôt = ch.${early.chapter.number}, tard = ch.${late.chapter.number}\n`,
)

await time('getWorldState — point tôt', () => timeline.getWorldState({ eventId: early.id }))
await time('getWorldState — point tard', () => timeline.getWorldState({ eventId: late.id }))
await time('getKernelState — point tard', () => timeline.getKernelState({ eventId: late.id }))
await time('getEventsBefore — point tard', () => timeline.getEventsBefore({ eventId: late.id }))

await prisma.$disconnect()
