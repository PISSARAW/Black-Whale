import type { HatsuKey } from '$lib/tour/hatsu'
import { aimReadout, controlReadouts, locationReadout, statusReadout } from '$lib/tour/pageReadouts'
import type { Space, Structure } from '$lib/tour/types'

interface OverlayContext {
  muted: boolean
  levelName: string
  tierName: string
  insideInterior: boolean
  currentSpace: Space | null
  isolatedCopy: boolean
  onSolids: boolean
  aimedAt: Space | null
  aimedSolidAt: Structure | null
  color: string | null
  touch: boolean
  engaged: boolean
  controls: readonly HatsuKey[]
}

interface OverlayLabels {
  insideOf: (tier: string) => string
  outside: string
  noSource: string
  copyBadge: string
  copySource: string
  aimingSolid: (name: string) => string
  aimingNothingSolid: string
  aimingSpace: (name: string) => string
  aimingNothingSpace: string
  click: string
  action: (key: HatsuKey['action']) => string
  engaged: string
  touch: string
  enter: string
}

interface OverlayViewOptions {
  read: () => OverlayContext
  labels: () => OverlayLabels
  named: (space: Space) => Space
  nameOf: (item: { name: string; nameFr: string }) => string
  badgeOf: (item: { provenance: Space['provenance'] }) => string
  badgeClassOf: (item: { provenance: Space['provenance'] }) => string
  sourceOf: (item: { source: string; sourceFr: string }) => string
}

export class TourOverlayView {
  constructor(private readonly options: OverlayViewOptions) {}

  get location() {
    const context = this.options.read()
    const labels = this.options.labels()
    const room = context.currentSpace ? this.options.named(context.currentSpace) : null
    const suffix = context.insideInterior ? ` · ${labels.insideOf(context.tierName)}` : ''
    return locationReadout({
      muted: context.muted,
      level: `${context.levelName}${suffix}`,
      outside: labels.outside,
      room: room
        ? {
            name: this.options.nameOf(room),
            badge: this.options.badgeOf(room),
            badgeClass: this.options.badgeClassOf(room),
            source: this.options.sourceOf(room) || labels.noSource,
          }
        : null,
      copy: {
        active: context.isolatedCopy,
        badge: labels.copyBadge,
        badgeClass: 'border-[#7095d6] bg-[#7095d6]/20 text-[#a8c2ea]',
        source: labels.copySource,
      },
    })
  }

  get aim() {
    const context = this.options.read()
    const labels = this.options.labels()
    const solid = context.onSolids ? context.aimedSolidAt : null
    return aimReadout({
      muted: context.muted,
      color: context.color,
      text: this.aimText(context, labels),
      evidence: solid
        ? {
            badge: this.options.badgeOf(solid),
            badgeClass: this.options.badgeClassOf(solid),
            source: this.options.sourceOf(solid) || labels.noSource,
          }
        : null,
    })
  }

  get controls() {
    const context = this.options.read()
    const labels = this.options.labels()
    return controlReadouts({
      hidden: context.touch || context.muted,
      controls: context.controls,
      keyOf: (control) => (control.click ? `${control.key} / ${labels.click}` : control.key),
      actionOf: (control) => labels.action(control.action),
      color: context.color,
    })
  }

  get status() {
    const context = this.options.read()
    const labels = this.options.labels()
    return statusReadout({
      engaged: context.engaged,
      touch: context.touch,
      engagedText: labels.engaged,
      touchText: labels.touch,
      enterText: labels.enter,
    })
  }

  private aimText(context: OverlayContext, labels: OverlayLabels) {
    if (context.onSolids) {
      return context.aimedSolidAt
        ? labels.aimingSolid(this.options.nameOf(context.aimedSolidAt))
        : labels.aimingNothingSolid
    }
    return context.aimedAt
      ? labels.aimingSpace(this.options.nameOf(this.options.named(context.aimedAt)))
      : labels.aimingNothingSpace
  }
}
