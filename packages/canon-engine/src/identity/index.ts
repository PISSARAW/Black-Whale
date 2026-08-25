import type { PrismaClient } from '@black-whale/database'
import { compareEventOrder, isActiveAt, type Body, type Consciousness } from '@black-whale/domain'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type TrackingMode = 'consciousness' | 'body' | 'apparent'

export interface IdentityResolutionResult {
  body: Body
  consciousness: Consciousness | null
  /** Which character witnesses believe this to be */
  perceivedAs: string | null
  isDissonant: boolean
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

export interface IIdentityEngine {
  resolveIdentity(bodyId: string, eventId: string): Promise<IdentityResolutionResult>
  findBodyOf(consciousnessId: string, eventId: string): Promise<Body | null>
  track(entityId: string, mode: TrackingMode, eventId: string): Promise<IdentityResolutionResult>
}

// ──────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────

export class IdentityEngine implements IIdentityEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async resolveIdentity(bodyId: string, eventId: string): Promise<IdentityResolutionResult> {
    const targetEvent = await this.prisma.narrativeEvent.findUnique({
      where: { id: eventId },
      include: { chapter: true },
    })

    if (!targetEvent) throw new Error(`Event ${eventId} not found`)

    // Fetch the body
    const body = await this.prisma.body.findUnique({
      where: { id: bodyId },
    })

    if (!body) throw new Error(`Body ${bodyId} not found`)

    // 1. Find active consciousness inside this body
    const occupancies = await this.prisma.bodyOccupancy.findMany({
      where: { bodyId },
      include: {
        consciousness: true,
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } },
      },
    })
    const occupancy = occupancies
      .filter((candidate) => isActiveAt(candidate, targetEvent))
      .sort((left, right) => compareEventOrder(right.fromEvent, left.fromEvent))[0]

    const consciousness = occupancy?.consciousness ?? null

    // 2. Find appearance / perceived identity
    const appearances = await this.prisma.appearanceState.findMany({
      where: { entityId: bodyId, entityType: 'BODY' },
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } },
      },
    })
    const appearance = appearances
      .filter((candidate) => isActiveAt(candidate, targetEvent))
      .sort((left, right) => compareEventOrder(right.fromEvent, left.fromEvent))[0]

    const perceivedAs = appearance?.appearanceCharacterId ?? body.originalCharacterId ?? null

    // Check if the original character is different from the current consciousness
    // Meaning it's a transferred consciousness
    const isDissonant =
      consciousness && body.originalCharacterId !== consciousness.originCharacterId

    // Map Prisma models to Domain models
    const domainBody: Body = {
      id: body.id,
      originalCharacterId: body.originalCharacterId ?? undefined,
      label: body.label,
      bodyType: body.bodyType as Body['bodyType'],
      firstVisibleEventId: body.firstVisibleEventId,
    }

    const domainConsciousness: Consciousness | null = consciousness
      ? {
          id: consciousness.id,
          originCharacterId: consciousness.originCharacterId ?? undefined,
          label: consciousness.label,
          consciousnessType: consciousness.consciousnessType as Consciousness['consciousnessType'],
          firstVisibleEventId: consciousness.firstVisibleEventId,
        }
      : null

    return {
      body: domainBody,
      consciousness: domainConsciousness,
      perceivedAs,
      isDissonant: !!isDissonant,
    }
  }

  async findBodyOf(consciousnessId: string, eventId: string): Promise<Body | null> {
    const targetEvent = await this.prisma.narrativeEvent.findUnique({
      where: { id: eventId },
      include: { chapter: true },
    })

    if (!targetEvent) return null

    const occupancies = await this.prisma.bodyOccupancy.findMany({
      where: { consciousnessId },
      include: {
        body: true,
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } },
      },
    })
    const occupancy = occupancies
      .filter((candidate) => isActiveAt(candidate, targetEvent))
      .sort((left, right) => compareEventOrder(right.fromEvent, left.fromEvent))[0]

    if (!occupancy?.body) return null

    const body = occupancy.body
    return {
      id: body.id,
      originalCharacterId: body.originalCharacterId ?? undefined,
      label: body.label,
      bodyType: body.bodyType as Body['bodyType'],
      firstVisibleEventId: body.firstVisibleEventId,
    }
  }

  async track(
    entityId: string,
    mode: TrackingMode,
    eventId: string,
  ): Promise<IdentityResolutionResult> {
    if (mode === 'body') {
      return this.resolveIdentity(entityId, eventId)
    }

    if (mode === 'consciousness') {
      const body = await this.findBodyOf(entityId, eventId)
      if (!body) throw new Error(`Consciousness ${entityId} is not in any body at event ${eventId}`)
      return this.resolveIdentity(body.id, eventId)
    }

    // 'apparent' tracks who witnesses believe they see: the body currently
    // wearing `entityId` as an appearance, or — when no disguise is active —
    // that character's original body.
    if (mode === 'apparent') {
      // Find appearance states active at eventId with appearanceCharacterId = entityId
      const targetEvent = await this.prisma.narrativeEvent.findUnique({
        where: { id: eventId },
        include: { chapter: true },
      })

      if (!targetEvent) throw new Error(`Event ${eventId} not found`)

      const appearances = await this.prisma.appearanceState.findMany({
        where: { appearanceCharacterId: entityId },
        include: {
          fromEvent: { include: { chapter: true } },
          untilEvent: { include: { chapter: true } },
        },
      })
      const appearance = appearances
        .filter((candidate) => isActiveAt(candidate, targetEvent))
        .sort((left, right) => compareEventOrder(right.fromEvent, left.fromEvent))[0]

      let targetBodyId = appearance?.entityId

      if (!targetBodyId) {
        // Fallback: look for original body
        const body = await this.prisma.body.findUnique({
          where: { originalCharacterId: entityId },
        })
        if (body) {
          targetBodyId = body.id
        }
      }

      if (targetBodyId) {
        return this.resolveIdentity(targetBodyId, eventId)
      }

      throw new Error(`Could not track apparent identity ${entityId} at event ${eventId}`)
    }

    throw new Error(`Unknown tracking mode ${mode}`)
  }
}
